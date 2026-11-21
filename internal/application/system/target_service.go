package system

import (
	"sync"

	"beam-bridge/core/profile"
	"beam-bridge/core/target"
	"beam-bridge/core/types"
)

type TargetService struct {
	mu             sync.Mutex
	pendingTargets []string
	resolver       *target.Resolver
}

func NewTargetService(profileManager *profile.Manager) *TargetService {
	return &TargetService{
		resolver: target.NewResolver(profileManager),
	}
}

func (s *TargetService) Queue(targets []string) {
	if len(targets) == 0 {
		return
	}
	s.mu.Lock()
	s.pendingTargets = append(s.pendingTargets, targets...)
	s.mu.Unlock()
}

func (s *TargetService) GetPending() []string {
	s.mu.Lock()
	targets := append([]string(nil), s.pendingTargets...)
	s.pendingTargets = nil
	s.mu.Unlock()
	if targets == nil {
		targets = []string{}
	}
	return targets
}

func (s *TargetService) Handle(target string) (*types.Profile, error) {
	return s.resolver.Open(target)
}
