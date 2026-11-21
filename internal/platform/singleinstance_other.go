//go:build !windows && !linux && !darwin

package platform

import (
	"context"
	"net"
)

func TrySendToRunningInstance(args []string) bool {
	return false
}

func AcquireSingleInstanceLock(_ []string) (net.Listener, bool) {
	return nil, true
}

func ListenForSecondInstance(_ context.Context, _ net.Listener, _ func(args []string)) error {
	return nil
}
