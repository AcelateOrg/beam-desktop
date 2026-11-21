package handlers

import (
	"context"
	"sync"
)

type Runtime struct {
	mu                 sync.RWMutex
	ctx                context.Context
	shouldMinimizeFunc func() bool
	hideWindowFunc     func()
	quitAppFunc        func()
}

func NewRuntime() *Runtime {
	return &Runtime{}
}

func (r *Runtime) SetContext(ctx context.Context) {
	r.mu.Lock()
	r.ctx = ctx
	r.mu.Unlock()
}

func (r *Runtime) Context() context.Context {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return r.ctx
}

func (r *Runtime) SetWindowCallbacks(shouldMinimize func() bool, hideWindow func(), quitApp func()) {
	r.mu.Lock()
	r.shouldMinimizeFunc = shouldMinimize
	r.hideWindowFunc = hideWindow
	r.quitAppFunc = quitApp
	r.mu.Unlock()
}

func (r *Runtime) ShouldMinimizeToTray() bool {
	r.mu.RLock()
	fn := r.shouldMinimizeFunc
	r.mu.RUnlock()
	return fn != nil && fn()
}

func (r *Runtime) HideWindow() {
	r.mu.RLock()
	fn := r.hideWindowFunc
	r.mu.RUnlock()
	if fn != nil {
		fn()
	}
}

func (r *Runtime) QuitApp() {
	r.mu.RLock()
	fn := r.quitAppFunc
	r.mu.RUnlock()
	if fn != nil {
		fn()
	}
}
