package update

import (
	"bytes"
	"crypto/rand"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

// freezingListener imitates the ISP behaviour fetchFile works around: once a
// connection has sent `limit` bytes it stops sending (the write blocks until
// the connection is closed) instead of failing.
type freezingListener struct {
	net.Listener
	limit int64
	conns atomic.Int64
}

func (l *freezingListener) Accept() (net.Conn, error) {
	c, err := l.Listener.Accept()
	if err != nil {
		return nil, err
	}
	l.conns.Add(1)
	return &freezingConn{Conn: c, limit: l.limit, closed: make(chan struct{})}, nil
}

type freezingConn struct {
	net.Conn
	limit  int64
	sent   int64
	closed chan struct{}
	once   sync.Once
}

func (c *freezingConn) Write(p []byte) (int, error) {
	if c.limit > 0 && c.sent+int64(len(p)) > c.limit {
		allowed := c.limit - c.sent
		if allowed > 0 {
			n, err := c.Conn.Write(p[:allowed])
			c.sent += int64(n)
			if err != nil {
				return n, err
			}
		}
		<-c.closed // frozen: nothing more ever leaves
		return 0, net.ErrClosed
	}
	n, err := c.Conn.Write(p)
	c.sent += int64(n)
	return n, err
}

func (c *freezingConn) Close() error {
	c.once.Do(func() { close(c.closed) })
	return c.Conn.Close()
}

// newAssetServer serves payload at /cdn/file (with Range support via
// http.ServeContent) and redirects /asset there, like the OTA worker does.
func newAssetServer(t *testing.T, payload []byte, limit int64) (*httptest.Server, *freezingListener) {
	t.Helper()
	mux := http.NewServeMux()
	mux.HandleFunc("/asset", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/cdn/file?sig=secret", http.StatusFound)
	})
	mux.HandleFunc("/cdn/file", func(w http.ResponseWriter, r *http.Request) {
		http.ServeContent(w, r, "file", time.Time{}, bytes.NewReader(payload))
	})
	srv := httptest.NewUnstartedServer(mux)
	fl := &freezingListener{Listener: srv.Listener, limit: limit}
	srv.Listener = fl
	srv.Start()
	// Frozen handlers only return once their connection is closed.
	t.Cleanup(func() { srv.CloseClientConnections(); srv.Close() })
	return srv, fl
}

func fetchToFile(t *testing.T, url string, size int64) []byte {
	t.Helper()
	path := filepath.Join(t.TempDir(), "out")
	out, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	defer out.Close()

	var last atomic.Int64
	s := &Service{userAgent: "beam-test"}
	if err := s.fetchFile(url, out, size, func(done int64) { last.Store(done) }); err != nil {
		t.Fatalf("fetchFile: %v", err)
	}
	if got := last.Load(); got != size {
		t.Errorf("last progress = %d, want %d", got, size)
	}
	got, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	return got
}

func randomPayload(t *testing.T, n int) []byte {
	t.Helper()
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		t.Fatal(err)
	}
	return b
}

func TestFetchFileWhole(t *testing.T) {
	payload := randomPayload(t, 300_000)
	srv, _ := newAssetServer(t, payload, 0)
	if got := fetchToFile(t, srv.URL+"/asset", int64(len(payload))); !bytes.Equal(got, payload) {
		t.Fatal("payload differs")
	}
}

// The real case: every connection freezes after 16 KB. The whole download
// stalls, the chunks (one connection each) finish the file.
func TestFetchFileFallsBackToChunksUnder16KB(t *testing.T) {
	old := wholeStallTimeout
	wholeStallTimeout = 2 * time.Second
	t.Cleanup(func() { wholeStallTimeout = old })

	payload := randomPayload(t, 400_000)
	srv, fl := newAssetServer(t, payload, 16<<10)
	if got := fetchToFile(t, srv.URL+"/asset", int64(len(payload))); !bytes.Equal(got, payload) {
		t.Fatal("payload differs")
	}
	if n := fl.conns.Load(); n < int64(len(payload)/chunkStart) {
		t.Errorf("only %d connections for %d bytes: chunks are not on fresh connections", n, len(payload))
	}
}

// A limit below the starting chunk forces the chunk size down.
func TestFetchFileShrinksChunks(t *testing.T) {
	oldStall, oldChunk := wholeStallTimeout, chunkTimeout
	wholeStallTimeout, chunkTimeout = time.Second, time.Second
	t.Cleanup(func() { wholeStallTimeout, chunkTimeout = oldStall, oldChunk })

	payload := randomPayload(t, 60_000)
	// ~400 bytes of response headers + 5 KB of body per connection.
	srv, _ := newAssetServer(t, payload, 5<<10+400)
	if got := fetchToFile(t, srv.URL+"/asset", int64(len(payload))); !bytes.Equal(got, payload) {
		t.Fatal("payload differs")
	}
}

func TestFetchFileRejectsWrongSize(t *testing.T) {
	payload := randomPayload(t, 10_000)
	srv, _ := newAssetServer(t, payload, 0)
	out, err := os.Create(filepath.Join(t.TempDir(), "out"))
	if err != nil {
		t.Fatal(err)
	}
	defer out.Close()
	s := &Service{userAgent: "beam-test"}
	if err := s.fetchFile(srv.URL+"/asset", out, int64(len(payload)-1), func(int64) {}); err == nil {
		t.Fatal("a file one byte longer than the manifest was accepted")
	}
}

