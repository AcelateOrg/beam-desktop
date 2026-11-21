package platform

import (
	"context"
	"net"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
	"time"
	"unsafe"
)

func getSockPath() string {
	return filepath.Join(os.TempDir(), "beam-app-single-instance"+variantSuffix()+".sock")
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

var (
	singleInstanceDLL   = syscall.NewLazyDLL("kernel32.dll")
	procCreateMutexW    = singleInstanceDLL.NewProc("CreateMutexW")
	singleInstanceMutex syscall.Handle
)

const errorAlreadyExists = syscall.Errno(183)

func instanceMutexName() string {
	return `Local\beam-app-single-instance` + variantSuffix()
}

func tryAcquireInstanceMutex() bool {
	name, err := syscall.UTF16PtrFromString(instanceMutexName())
	if err != nil {
		return true
	}

	handle, _, callErr := procCreateMutexW.Call(0, 0, uintptr(unsafe.Pointer(name)))
	if handle == 0 {
		return true
	}
	if errno, ok := callErr.(syscall.Errno); ok && errno == errorAlreadyExists {
		_ = syscall.CloseHandle(syscall.Handle(handle))
		return false
	}

	singleInstanceMutex = syscall.Handle(handle)
	return true
}

func AcquireSingleInstanceLock(args []string) (net.Listener, bool) {
	const attempts = 6
	for attempt := 0; ; attempt++ {
		if tryAcquireInstanceMutex() {
			break
		}

		if TrySendToRunningInstance(args) {
			return nil, false
		}
		if attempt == attempts-1 {
			return nil, false
		}
		time.Sleep(300 * time.Millisecond)
	}

	sock := getSockPath()

	listener, err := net.Listen("unix", sock)
	if err == nil {
		return listener, true
	}

	_ = os.Remove(sock)
	listener, err = net.Listen("unix", sock)
	if err != nil {
		return nil, false
	}
	return listener, true
}

type socketKeeper struct {
	mu       sync.Mutex
	listener net.Listener
	closed   bool
}

func (k *socketKeeper) take() (net.Listener, bool) {
	k.mu.Lock()
	defer k.mu.Unlock()
	if k.closed {
		return nil, false
	}
	listener := k.listener
	k.listener = nil
	return listener, true
}

func (k *socketKeeper) set(listener net.Listener) bool {
	k.mu.Lock()
	defer k.mu.Unlock()
	if k.closed {
		return false
	}
	k.listener = listener
	return true
}

func (k *socketKeeper) close() {
	k.mu.Lock()
	listener := k.listener
	k.listener = nil
	k.closed = true
	k.mu.Unlock()

	if listener != nil {
		listener.Close()
	}
}

func ListenForSecondInstance(ctx context.Context, listener net.Listener, callback func(args []string)) error {
	sock := getSockPath()

	if listener == nil {
		_ = os.Remove(sock)

		l, err := net.Listen("unix", sock)
		if err != nil {
			return err
		}
		listener = l
	}

	keeper := &socketKeeper{listener: listener}

	go func() {
		<-ctx.Done()
		keeper.close()
		_ = os.Remove(sock)
	}()

	go acceptSecondInstances(listener, callback)
	go keeper.watchSocketFile(ctx, callback)
	return nil
}

func acceptSecondInstances(listener net.Listener, callback func(args []string)) {
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
}

func (k *socketKeeper) watchSocketFile(ctx context.Context, callback func(args []string)) {
	defer RecoverAndLog("single-instance-socket-watch")

	const checkInterval = 30 * time.Second
	sock := getSockPath()

	ticker := time.NewTicker(checkInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if _, err := os.Stat(sock); err == nil {
				continue
			}

			old, ok := k.take()
			if !ok {
				return
			}
			if old != nil {
				old.Close()
			}

			listener, err := net.Listen("unix", sock)
			if err != nil {
				continue
			}
			if !k.set(listener) {
				listener.Close()
				return
			}
			go acceptSecondInstances(listener, callback)
		}
	}
}
