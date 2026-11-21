//go:build !darwin && !linux

package platform

func EnsureElevated() {}
