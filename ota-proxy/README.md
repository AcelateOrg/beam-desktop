# ota-proxy

A stateless Cloudflare Worker that serves Beam's OTA feed (see
`docs/ota.md`) from GitHub Release assets of `AcelateOrg/beam-desktop`,
which may stay private.

| Path | Answer |
|---|---|
| `/v1/channels/{channel}/{target}.json[.sig]` | asset `ota-pointer-{channel}-{target}.json[.sig]` of the **highest published** version that has both the file and its `.sig` |
| `/v1/releases/{target}/{version}.json[.sig]` | asset `ota-release-{target}.json[.sig]` of release `v{version}` |
| `/v1/assets/{tag}/{asset}` | `HEAD`: 200 + size; `GET`: 302 to GitHub's short-lived signed URL |
| `/download/{windows,macos,linux}` | 302 to `Beam-X.Y.Z-windows-amd64-installer.exe` / `-macos-universal.dmg` / `-linux-amd64.tar.gz` of the highest published non-prerelease version - permanent links for the website |
| `/healthz` | `beam ota proxy` |

- Drafts are invisible: CI uploads everything into a draft and publishes it
  last. Turning a published release back into a draft is a rollback.
- Binaries never pass through the worker - clients download them straight
  from GitHub's CDN (`release-assets.githubusercontent.com`). The worker only
  sends a few KB per check, which matters on Russian networks that stall
  connections to foreign hosting after ~16 KB.
- Clients do not trust the worker: pointers and manifests are ed25519-signed,
  files are checked by size and sha256.
- The release list and signed URLs are cached in memory for 60 s, so even
  heavy traffic stays far below the GitHub API limit (5000 req/h).

## Setup

1. GitHub token: fine-grained PAT, *Only select repositories* ->
   `beam-desktop`, permission **Contents: Read-only**. Nothing else.
2. Repository secrets in `beam-desktop`: `OTA_PROXY_GITHUB_TOKEN` (the PAT),
   `CLOUDFLARE_API_TOKEN` (template *Edit Cloudflare Workers*),
   `CLOUDFLARE_ACCOUNT_ID`.
3. Push to `main` (or run the *OTA proxy* workflow): tests, deploys, and
   sets the worker secret. By hand: `npx wrangler deploy` then
   `npx wrangler secret put GITHUB_TOKEN`.
4. Domain. The client reads `ota.DefaultBaseURL`
   (`internal/application/update/ota/types.go`). Either move the
   `acelate.com` DNS zone to Cloudflare (free) and uncomment the `routes`
   line in `wrangler.toml` for `ota-updates.acelate.com`, or set
   `DefaultBaseURL` to the `https://beam-ota-proxy.<account>.workers.dev`
   URL. Change it before the first public build: shipped builds keep it.
5. Check it: `curl https://<host>/healthz`, then after a release
   `go run ./cmd/beam-ota verify`. Set the repository variable
   `OTA_PROXY_READY=true` so the release workflow verifies the live feed.

Tests: `npm test` (Node 18+, no dependencies).

The same file also runs on Deno Deploy (`GITHUB_TOKEN`, `GITHUB_REPO` from
the environment), if Cloudflare ever becomes unreachable.
