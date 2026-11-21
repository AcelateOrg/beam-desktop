package update

import (
	"context"
	"crypto/tls"
	"errors"
	"fmt"
	"io"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"
	"time"

	"beam-app/internal/platform"
)

// Some networks (Russian ISPs towards foreign hosting) freeze a TCP connection
// once ~16 KB have come down it, while new connections keep working. A file is
// therefore first fetched whole; if that stalls, the rest comes as Range
// requests small enough to finish under the limit, each on a fresh connection.
//
// Budget per connection, measured on release-assets.githubusercontent.com:
// a full TLS 1.3 handshake reads ~5.8 KB, the 206 headers ~1 KB. That leaves
// ~9 KB under 16 KB; chunks start at 8 KB and halve on failure. Resumed TLS
// sessions (the cache below) skip the certificate, which only adds headroom.
const (
	chunkStart    = 8 << 10
	chunkMin      = 2 << 10
	chunkWorkers  = 24
	chunkAttempts = 8
)

// Timeouts are variables so tests can shorten them.
var (
	wholeStallTimeout = 10 * time.Second
	chunkTimeout      = 12 * time.Second
)

var errStalled = errors.New("download stalled")

// updateLog writes to logs/update.log, so failed updates reported by users can
// be read back instead of only flashing by in the UI.
var updateLog = func() *log.Logger {
	dir := platform.GetLogsDir()
	if err := os.MkdirAll(dir, 0755); err == nil {
		if f, err := os.OpenFile(filepath.Join(dir, "update.log"), os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0644); err == nil {
			return log.New(f, "", log.LstdFlags|log.Lmicroseconds)
		}
	}
	return log.New(io.Discard, "", 0)
}()

// fetchFile downloads url into out (size bytes), whole first, then in chunks.
// progress gets the running byte count.
func (s *Service) fetchFile(rawURL string, out *os.File, size int64, progress func(done int64)) error {
	n, err := s.fetchWhole(rawURL, out, size, progress)
	if err == nil {
		return nil
	}
	if n > size {
		return err
	}
	updateLog.Printf("whole download of %s stopped at %d/%d bytes (%v); switching to chunks", rawURL, n, size, err)
	if err := s.fetchChunked(rawURL, out, n, size, progress); err != nil {
		updateLog.Printf("chunked download of %s failed: %v", rawURL, err)
		return err
	}
	updateLog.Printf("chunked download of %s finished", rawURL)
	return nil
}

// fetchWhole streams the file and gives up as soon as no byte arrives for
// wholeStallTimeout. It returns how many bytes reached out, a valid prefix.
func (s *Service) fetchWhole(rawURL string, out *os.File, size int64, progress func(done int64)) (int64, error) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, rawURL, nil)
	if err != nil {
		return 0, err
	}
	req.Header.Set("User-Agent", s.userAgent)

	var lastRead atomic.Int64
	lastRead.Store(time.Now().UnixNano())
	var stalled atomic.Bool
	go func() {
		t := time.NewTicker(time.Second)
		defer t.Stop()
		for {
			select {
			case <-ctx.Done():
				return
			case <-t.C:
				if time.Since(time.Unix(0, lastRead.Load())) > wholeStallTimeout {
					stalled.Store(true)
					cancel()
					return
				}
			}
		}
	}()

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		if stalled.Load() {
			return 0, errStalled
		}
		return 0, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return 0, fmt.Errorf("%s: %s", rawURL, resp.Status)
	}

	var written int64
	buf := make([]byte, 32<<10)
	body := io.LimitReader(resp.Body, size+1) // one byte over is enough to know it is wrong
	for {
		n, rerr := body.Read(buf)
		if n > 0 {
			lastRead.Store(time.Now().UnixNano())
			if _, werr := out.WriteAt(buf[:n], written); werr != nil {
				return written, werr
			}
			written += int64(n)
			progress(min(written, size))
		}
		if rerr == io.EOF {
			break
		}
		if rerr != nil {
			if stalled.Load() {
				return written, errStalled
			}
			return written, rerr
		}
	}
	if written != size {
		return written, fmt.Errorf("%s: got %d bytes, manifest says %d", rawURL, written, size)
	}
	return written, nil
}

type byteRange struct {
	start, end int64 // [start, end)
	attempts   int
}

// fetchChunked fills out[from:size] with parallel Range requests, one fresh
// connection each. A failed range goes back into the queue split to the
// current (shrunken) chunk size; one that fails chunkAttempts times aborts.
func (s *Service) fetchChunked(rawURL string, out *os.File, from, size int64, progress func(done int64)) error {
	transport := &http.Transport{
		Proxy:                 http.ProxyFromEnvironment,
		DialContext:           (&net.Dialer{Timeout: 8 * time.Second}).DialContext,
		TLSClientConfig:       &tls.Config{ClientSessionCache: tls.NewLRUClientSessionCache(chunkWorkers * 2)},
		TLSHandshakeTimeout:   8 * time.Second,
		ResponseHeaderTimeout: 8 * time.Second,
		DisableKeepAlives:     true, // the whole point: every chunk on a new connection
		DisableCompression:    true,
		// HTTP/2 would multiplex every chunk onto one connection again.
		TLSNextProto: map[string]func(string, *tls.Conn) http.RoundTripper{},
	}
	defer transport.CloseIdleConnections()
	client := &http.Client{
		Transport: transport,
		Timeout:   chunkTimeout,
		CheckRedirect: func(*http.Request, []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}

	// The feed URL answers with a redirect to a short-lived signed CDN URL.
	// Resolve it once instead of paying a second connection per chunk; resolve
	// again if the CDN starts refusing it (expired).
	var (
		mu       sync.Mutex
		target   string
		resolved time.Time
	)
	resolve := func(force bool) (string, error) {
		mu.Lock()
		defer mu.Unlock()
		if target != "" && !force {
			return target, nil
		}
		if force && time.Since(resolved) < 5*time.Second {
			return target, nil // another worker just did it
		}
		t, err := s.resolveRedirect(client, rawURL)
		if err != nil {
			return "", err
		}
		target, resolved = t, time.Now()
		return target, nil
	}
	if _, err := resolve(false); err != nil {
		return err
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	var (
		qmu      sync.Mutex
		cursor   = from
		retry    []byteRange
		chunk    int64 = chunkStart
		firstErr error
		done     atomic.Int64
	)
	done.Store(from)

	next := func() (byteRange, bool) {
		qmu.Lock()
		defer qmu.Unlock()
		if firstErr != nil {
			return byteRange{}, false
		}
		if len(retry) > 0 {
			r := retry[len(retry)-1]
			retry = retry[:len(retry)-1]
			return r, true
		}
		if cursor >= size {
			return byteRange{}, false
		}
		r := byteRange{start: cursor, end: min(cursor+chunk, size)}
		cursor = r.end
		return r, true
	}
	fail := func(r byteRange, err error) {
		qmu.Lock()
		defer qmu.Unlock()
		if firstErr != nil {
			return
		}
		if r.attempts+1 >= chunkAttempts {
			firstErr = fmt.Errorf("bytes %d-%d: %w", r.start, r.end-1, err)
			cancel()
			return
		}
		if chunk > chunkMin {
			chunk = max(chunkMin, chunk/2)
			updateLog.Printf("chunk failed (%v); chunk size now %d", err, chunk)
		}
		for start := r.start; start < r.end; start += chunk {
			retry = append(retry, byteRange{start: start, end: min(start+chunk, r.end), attempts: r.attempts + 1})
		}
	}

	var wg sync.WaitGroup
	for range chunkWorkers {
		wg.Add(1)
		go func() {
			defer wg.Done()
			buf := make([]byte, chunkStart)
			for {
				r, ok := next()
				if !ok {
					return
				}
				t, err := resolve(false)
				if err == nil {
					var status int
					status, err = s.fetchRange(ctx, client, t, r, buf[:r.end-r.start])
					if status == http.StatusForbidden || status == http.StatusGone {
						_, _ = resolve(true)
					}
				}
				if err == nil {
					_, err = out.WriteAt(buf[:r.end-r.start], r.start)
					if err != nil {
						qmu.Lock()
						if firstErr == nil {
							firstErr = err
							cancel()
						}
						qmu.Unlock()
						return
					}
					progress(done.Add(r.end - r.start))
					continue
				}
				if ctx.Err() != nil {
					return
				}
				fail(r, err)
			}
		}()
	}
	wg.Wait()

	if firstErr != nil {
		return firstErr
	}
	if got := done.Load(); got != size {
		return fmt.Errorf("chunked download ended at %d of %d bytes", got, size)
	}
	return nil
}

// resolveRedirect follows the feed's 302 by hand and returns where it points;
// a direct 200 means the URL serves the file itself.
func (s *Service) resolveRedirect(client *http.Client, rawURL string) (string, error) {
	req, err := http.NewRequest(http.MethodGet, rawURL, nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("User-Agent", s.userAgent)
	req.Header.Set("Range", "bytes=0-0")
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	_, _ = io.Copy(io.Discard, io.LimitReader(resp.Body, 1<<10))

	switch {
	case resp.StatusCode >= 300 && resp.StatusCode < 400:
		loc, err := resp.Location()
		if err != nil {
			return "", fmt.Errorf("%s: redirect without a location: %w", rawURL, err)
		}
		return loc.String(), nil
	case resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusPartialContent:
		return rawURL, nil
	default:
		return "", fmt.Errorf("%s: %s", redactURL(rawURL), resp.Status)
	}
}

// fetchRange reads exactly len(buf) bytes at r.start into buf.
func (s *Service) fetchRange(ctx context.Context, client *http.Client, target string, r byteRange, buf []byte) (int, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, target, nil)
	if err != nil {
		return 0, err
	}
	req.Header.Set("User-Agent", s.userAgent)
	req.Header.Set("Range", fmt.Sprintf("bytes=%d-%d", r.start, r.end-1))
	resp, err := client.Do(req)
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusPartialContent {
		return resp.StatusCode, fmt.Errorf("range request: %s", resp.Status)
	}
	if _, err := io.ReadFull(resp.Body, buf); err != nil {
		return resp.StatusCode, err
	}
	return resp.StatusCode, nil
}

// redactURL drops the query, where signed CDN URLs keep their tokens.
func redactURL(raw string) string {
	u, err := url.Parse(raw)
	if err != nil {
		return "(url)"
	}
	u.RawQuery = ""
	return u.String()
}
