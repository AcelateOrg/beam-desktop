// Beam OTA proxy: serves the update feed (internal/application/update/ota)
// out of GitHub Release assets of a possibly private repository.
//
//   /v1/channels/{channel}/{target}.json[.sig]  asset ota-pointer-{channel}-{target}.json
//                                               of the highest published version that has it
//   /v1/releases/{target}/{version}.json[.sig]  asset ota-release-{target}.json of v{version}
//   /v1/assets/{tag}/{asset}                    HEAD: size; GET: 302 to GitHub's signed URL
//   /download/{windows|macos|linux|android}     installer of the highest published stable
//                                               version (for the website; never changes)
//
// The proxy is stateless and NOT trusted by clients: every pointer and
// manifest is ed25519-signed and every file is checked by size + sha256.
// It only needs a read-only token (contents: read) for that one repository.
// Feed files are tiny; binaries are never streamed through here - clients
// download them straight from GitHub's CDN.
//
// Runs on Cloudflare Workers (env from wrangler) and Deno Deploy (Deno.env).

const API = "https://api.github.com";
const RELEASES_TTL_MS = 60_000;
const ASSET_TTL_MS = 60_000;
const SEGMENT = /^[A-Za-z0-9._-]{1,128}$/;

const memo = new Map(); // key -> { exp, promise }

function cached(key, ttl, fn) {
  const hit = memo.get(key);
  const now = Date.now();
  if (hit && hit.exp > now) return hit.promise;
  const promise = fn().catch((err) => {
    memo.delete(key); // never cache failures
    throw err;
  });
  memo.set(key, { exp: now + ttl, promise });
  if (memo.size > 500) {
    for (const [k, v] of memo) if (v.exp <= now) memo.delete(k);
  }
  return promise;
}

function config(env) {
  const get = (name) =>
    (env && env[name]) ?? (globalThis.Deno ? globalThis.Deno.env.get(name) : undefined);
  const token = get("GITHUB_TOKEN");
  const repo = get("GITHUB_REPO") || "AcelateOrg/beam-desktop";
  const mobileRepo = get("GITHUB_MOBILE_REPO") || "AcelateOrg/beam-mobile";
  if (!token) throw new HttpError(500, "GITHUB_TOKEN is not configured");
  return { token, repo, mobileRepo };
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function gh(cfg, path, init = {}) {
  const resp = await fetch(API + path, {
    ...init,
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "beam-ota-proxy",
      ...(init.headers || {}),
    },
  });
  return resp;
}

function parseVersion(tag) {
  const m = /^v(\d+)\.(\d+)\.(\d+)$/.exec(tag);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function compareVersions(a, b) {
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] - b[i];
  return 0;
}

// Published releases with a vX.Y.Z tag, highest version first. Drafts are
// skipped: a release goes live only when it is published, and unpublishing
// it (back to draft) rolls clients back to the previous one.
function releases(cfg) {
  const cacheKey = cfg.repo === "AcelateOrg/beam-mobile" ? `releases:${cfg.repo}` : "releases";
  return cached(cacheKey, RELEASES_TTL_MS, async () => {
    const out = [];
    for (let page = 1; page <= 3; page++) {
      const resp = await gh(cfg, `/repos/${cfg.repo}/releases?per_page=100&page=${page}`);
      if (!resp.ok) throw new HttpError(502, `GitHub: list releases: ${resp.status}`);
      const list = await resp.json();
      for (const r of list) {
        const version = parseVersion(r.tag_name);
        if (r.draft || !version) continue;
        out.push({
          tag: r.tag_name,
          version,
          prerelease: Boolean(r.prerelease),
          assets: new Map(r.assets.map((a) => [a.name, { id: a.id, name: a.name, size: a.size, repo: cfg.repo }])),
        });
      }
      if (list.length < 100) break;
    }
    out.sort((a, b) => compareVersions(b.version, a.version));
    return out;
  });
}

// The signed URL GitHub redirects an asset download to (valid ~5 minutes).
function assetLocation(cfg, asset) {
  const repo = asset.repo || cfg.repo;
  return cached(`loc:${repo}:${asset.id}`, ASSET_TTL_MS, async () => {
    const resp = await gh(cfg, `/repos/${repo}/releases/assets/${asset.id}`, {
      headers: { Accept: "application/octet-stream" },
      redirect: "manual",
    });
    const location = resp.headers.get("Location");
    if (resp.status >= 300 && resp.status < 400 && location) return location;
    throw new HttpError(502, `GitHub: asset ${asset.name}: ${resp.status}`);
  });
}

function assetBytes(cfg, asset) {
  return cached(`bytes:${asset.id}`, ASSET_TTL_MS, async () => {
    // Fetch the signed URL ourselves: following GitHub's redirect would
    // forward the Authorization header, which the storage backend rejects.
    const resp = await fetch(await assetLocation(cfg, asset), {
      headers: { "User-Agent": "beam-ota-proxy" },
    });
    if (!resp.ok) throw new HttpError(502, `GitHub: download ${asset.name}: ${resp.status}`);
    return new Uint8Array(await resp.arrayBuffer());
  });
}

// The highest-version release holding BOTH the file and its signature, so a
// half-uploaded pair never mixes a new file with an old signature.
async function newestWithPair(cfg, name) {
  const base = name.endsWith(".sig") ? name.slice(0, -4) : name;
  for (const r of await releases(cfg)) {
    if (r.assets.has(base) && r.assets.has(base + ".sig")) return r;
  }
  return null;
}

// Installer names produced by the release flow, see docs/ota.md.
const DOWNLOADS = {
  windows: /^Beam-\d+\.\d+\.\d+-windows-amd64-installer\.exe$/,
  macos: /^Beam-\d+\.\d+\.\d+-macos-universal\.dmg$/,
  linux: /^Beam-\d+\.\d+\.\d+-linux-amd64\.tar\.gz$/,
  android: /^BEAM-.*\.apk$/i,
};

async function newestDownload(cfg, platform) {
  const re = DOWNLOADS[platform];
  if (!re) return null;
  if (platform === "android") {
    try {
      const mobileCfg = { ...cfg, repo: cfg.mobileRepo || "AcelateOrg/beam-mobile" };
      for (const r of await releases(mobileCfg)) {
        if (r.prerelease) continue;
        for (const asset of r.assets.values()) if (re.test(asset.name)) return asset;
      }
    } catch (_) {
      // fall through to main repo if token doesn't cover mobileRepo
    }
  }
  for (const r of await releases(cfg)) {
    if (r.prerelease) continue;
    for (const asset of r.assets.values()) if (re.test(asset.name)) return asset;
  }
  return null;
}

function redirectToAsset(cfg, asset, method) {
  if (method === "HEAD") {
    return Promise.resolve(
      new Response(null, {
        status: 200,
        headers: { "Content-Length": String(asset.size), "Cache-Control": "no-store" },
      }),
    );
  }
  return assetLocation(cfg, asset).then(
    (location) => new Response(null, { status: 302, headers: { Location: location, "Cache-Control": "no-store" } }),
  );
}

async function releaseByTag(cfg, tag) {
  return (await releases(cfg)).find((r) => r.tag === tag) || null;
}

function notFound() {
  return new HttpError(404, "not found");
}

async function serveFeedFile(cfg, release, name, method, maxAge) {
  if (!release || !release.assets.has(name)) throw notFound();
  const asset = release.assets.get(name);
  const headers = {
    "Content-Type": name.endsWith(".sig") ? "text/plain; charset=utf-8" : "application/json; charset=utf-8",
    "Cache-Control": `public, max-age=${maxAge}`,
    "Content-Length": String(asset.size),
    "X-Beam-Release": release.tag,
  };
  if (method === "HEAD") return new Response(null, { status: 200, headers });
  const body = await assetBytes(cfg, asset);
  headers["Content-Length"] = String(body.byteLength);
  return new Response(body, { status: 200, headers });
}

async function route(request, env) {
  const method = request.method;
  if (method !== "GET" && method !== "HEAD") throw new HttpError(405, "method not allowed");
  const url = new URL(request.url);
  const parts = url.pathname.split("/").filter(Boolean);

  if (parts.length === 0 || (parts.length === 1 && parts[0] === "healthz")) {
    return new Response("beam ota proxy\n", { headers: { "Content-Type": "text/plain" } });
  }
  if (parts.length === 2 && parts[0] === "download") {
    const cfg = config(env);
    const asset = await newestDownload(cfg, parts[1]);
    if (!asset) throw notFound();
    return redirectToAsset(cfg, asset, method);
  }
  if (parts[0] !== "v1" || parts.length !== 4 || !parts.every((p) => SEGMENT.test(p))) throw notFound();
  const cfg = config(env);
  const [, kind, a, b] = parts;
  const sig = b.endsWith(".json.sig") ? ".sig" : "";
  const stem = sig ? b.slice(0, -".json.sig".length) : b.endsWith(".json") ? b.slice(0, -".json".length) : null;

  switch (kind) {
    case "channels": {
      // /v1/channels/{channel}/{target}.json[.sig]
      if (stem === null) throw notFound();
      const name = `ota-pointer-${a}-${stem}.json${sig}`;
      return serveFeedFile(cfg, await newestWithPair(cfg, name), name, method, 60);
    }
    case "releases": {
      // /v1/releases/{target}/{version}.json[.sig]
      if (stem === null) throw notFound();
      const name = `ota-release-${a}.json${sig}`;
      return serveFeedFile(cfg, await releaseByTag(cfg, `v${stem}`), name, method, 300);
    }
    case "assets": {
      // /v1/assets/{tag}/{asset}
      const release = await releaseByTag(cfg, a);
      const asset = release && release.assets.get(b);
      if (!asset) throw notFound();
      return redirectToAsset(cfg, asset, method);
    }
  }
  throw notFound();
}

export default {
  async fetch(request, env) {
    try {
      return await route(request, env);
    } catch (err) {
      const status = err instanceof HttpError ? err.status : 500;
      if (status >= 500) console.error(err);
      return new Response(JSON.stringify({ error: err.message || String(err) }) + "\n", {
        status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
      });
    }
  },
};
