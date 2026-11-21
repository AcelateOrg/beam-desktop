package ota

import "embed"

// SchemaFS holds the JSON Schema files published under /v1/schema/.
//
//go:embed schema/*.schema.json
var SchemaFS embed.FS
