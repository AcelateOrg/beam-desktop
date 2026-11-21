//go:build !darwin

package platform

// Windows and the common Linux desktops toggle maximise on a caption
// double-click and expose no per-user override worth honouring.
func TitleBarDoubleClickAction() TitleBarAction {
	return TitleBarMaximise
}
