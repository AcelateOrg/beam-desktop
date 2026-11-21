package ota

import (
	"bytes"
	"encoding/json"
)

// Marshal validates v (a *Pointer or *Release) and renders it the way it is
// published: indented, UTF-8, trailing newline. The signature covers these
// exact bytes.
func Marshal(v interface{ Validate() error }) ([]byte, error) {
	if err := v.Validate(); err != nil {
		return nil, err
	}
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	enc.SetIndent("", "  ")
	if err := enc.Encode(v); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
