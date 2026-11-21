//go:build linux || darwin

package platform

import (
	"context"
	"net"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func getSockPath() string {
	dir := os.Getenv("XDG_RUNTIME_DIR")
	if dir == "" {
		dir = os.TempDir()
	}
	return filepath.Join(dir, "beam-app-single-instance"+variantSuffix()+".sock")
}

func TrySendToRunningInstance(args []string) bool {
	conn, err := net.DialTimeout("unix", getSockPath(), 800*time.Millisecond)
	if err != nil {
		return false
	}
	defer conn.Close()

	payload := strings.Join(args, "\n")
	_, err = conn.Write([]byte(payload))
	return err == nil
}

func bindSingleInstanceSocket(sock string) (net.Listener, error) {
	if err := os.MkdirAll(filepath.Dir(sock), 0700); err != nil {
		return nil, err
	}
	listener, err := net.Listen("unix", sock)
	if err != nil {
		return nil, err
	}
	_ = os.Chmod(sock, 0600)
	return listener, nil
}

func AcquireSingleInstanceLock(args []string) (net.Listener, bool) {
	sock := getSockPath()

	listener, err := bindSingleInstanceSocket(sock)
	if err == nil {
		return listener, true
	}

	if TrySendToRunningInstance(args) {
		return nil, false
	}

	_ = os.Remove(sock)
	listener, err = bindSingleInstanceSocket(sock)
	if err != nil {
		return nil, false
	}
	return listener, true
}

func ListenForSecondInstance(ctx context.Context, listener net.Listener, callback func(args []string)) error {
	sock := getSockPath()

	if listener == nil {
		_ = os.Remove(sock)

		l, err := bindSingleInstanceSocket(sock)
		if err != nil {
			return err
		}
		listener = l
	}

	go func() {
		<-ctx.Done()
		listener.Close()
		_ = os.Remove(sock)
	}()

	go func() {
		for {
			conn, err := listener.Accept()
			if err != nil {
				return
			}
			go func(c net.Conn) {
				defer RecoverAndLog("second-instance-conn")
				defer c.Close()
				buf := make([]byte, 4096)
				n, _ := c.Read(buf)
				var args []string
				if n > 0 {
					args = strings.Split(strings.TrimSpace(string(buf[:n])), "\n")
				}
				callback(args)
			}(conn)
		}
	}()
	return nil
}
