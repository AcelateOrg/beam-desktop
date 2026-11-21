// Command beam-ota publishes Beam updates as GitHub Release assets served
// by the OTA proxy (ota-proxy/). CI does this in .github/workflows/release.yml.
//
//	go run ./cmd/beam-ota keygen
//	go run ./cmd/beam-ota publish -target windows-amd64 -live \
//	    -file Beam.exe=build/bin/Beam.exe -file BeamRelay.exe=build/bin/BeamRelay.exe \
//	    -notes notes.ru.txt
//	go run ./cmd/beam-ota verify
//
// See docs/ota.md for the whole flow.
package main

import (
	"fmt"
	"os"
)

func main() {
	if len(os.Args) < 2 {
		usage()
		os.Exit(2)
	}

	var err error
	switch os.Args[1] {
	case "keygen":
		err = runKeygen(os.Args[2:])
	case "publish":
		err = runPublish(os.Args[2:])
	case "verify":
		err = runVerify(os.Args[2:])
	case "-h", "--help", "help":
		usage()
		return
	default:
		fmt.Fprintf(os.Stderr, "unknown command %q\n\n", os.Args[1])
		usage()
		os.Exit(2)
	}

	if err != nil {
		fmt.Fprintln(os.Stderr, "ERROR:", err)
		os.Exit(1)
	}
}

func usage() {
	fmt.Fprint(os.Stderr, `beam-ota - publish Beam updates to the static OTA feed

Commands:
  keygen    create the ed25519 signing key (once)
  publish   hash + sign a build, upload it to the GitHub release v{version}
  verify    read the live (or local) feed exactly like the app does

Run "beam-ota <command> -h" for flags.
`)
}
