// node --test ota-proxy/test   (Node 18+, no dependencies)
import test from "node:test";
import assert from "node:assert/strict";

const env = { GITHUB_TOKEN: "t0ken", GITHUB_REPO: "o/r" };

const asset = (id, name, size = 10) => ({ id, name, size });
const RELEASES = [
  // newest created first, like the API - but not the highest version
  { tag_name: "v2.0.1", draft: true, assets: [asset(9, "ota-pointer-stable-windows-amd64.json"), asset(10, "ota-pointer-stable-windows-amd64.json.sig")] },
  { tag_name: "v1.9.0", draft: false, assets: [asset(1, "ota-pointer-stable-windows-amd64.json"), asset(2, "ota-pointer-stable-windows-amd64.json.sig")] },
  { tag_name: "v2.0.0", draft: false, assets: [
    asset(3, "ota-pointer-stable-windows-amd64.json"), asset(4, "ota-pointer-stable-windows-amd64.json.sig"),
    asset(5, "ota-release-windows-amd64.json"), asset(6, "ota-release-windows-amd64.json.sig"),
    asset(7, "windows-amd64-Beam.exe", 12345678),
    asset(8, "ota-pointer-stable-linux-amd64.json"), // signature not uploaded yet
    asset(11, "Beam-2.0.0-windows-amd64-installer.exe", 999),
  ] },
  { tag_name: "v3.0.0", draft: false, prerelease: true, assets: [asset(12, "Beam-3.0.0-windows-amd64-installer.exe")] },
  { tag_name: "nightly", draft: false, assets: [] },
];

const calls = [];
globalThis.fetch = async (url, init = {}) => {
  calls.push({ url: String(url), init });
  const u = new URL(url);
  if (u.hostname === "api.github.com") {
    assert.equal(init.headers.Authorization, "Bearer t0ken");
    if (u.pathname === "/repos/o/r/releases") return Response.json(RELEASES);
    const m = /^\/repos\/o\/r\/releases\/assets\/(\d+)$/.exec(u.pathname);
    if (m) {
      assert.equal(init.redirect, "manual");
      return new Response(null, { status: 302, headers: { Location: `https://objects.example/${m[1]}?sig=x` } });
    }
    return new Response("nope", { status: 404 });
  }
  if (u.hostname === "objects.example") {
    assert.equal(init.headers?.Authorization, undefined, "token must not leak to the CDN");
    return new Response(`asset-${u.pathname.slice(1)}`);
  }
  throw new Error("unexpected fetch " + url);
};

const { default: worker } = await import("../src/worker.js");
const get = (path, method = "GET") => worker.fetch(new Request("https://ota.example" + path, { method }), env);

test("pointer comes from the highest published version", async () => {
  const r = await get("/v1/channels/stable/windows-amd64.json");
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("X-Beam-Release"), "v2.0.0");
  assert.equal(await r.text(), "asset-3");
  const s = await get("/v1/channels/stable/windows-amd64.json.sig");
  assert.equal(await s.text(), "asset-4");
});

test("half-uploaded pointer pair is ignored", async () => {
  assert.equal((await get("/v1/channels/stable/linux-amd64.json")).status, 404);
});

test("release manifest by version", async () => {
  const r = await get("/v1/releases/windows-amd64/2.0.0.json");
  assert.equal(await r.text(), "asset-5");
  assert.equal((await get("/v1/releases/windows-amd64/2.0.1.json")).status, 404, "drafts are invisible");
});

test("assets redirect, HEAD reports size", async () => {
  const r = await get("/v1/assets/v2.0.0/windows-amd64-Beam.exe");
  assert.equal(r.status, 302);
  assert.equal(r.headers.get("Location"), "https://objects.example/7?sig=x");
  const h = await get("/v1/assets/v2.0.0/windows-amd64-Beam.exe", "HEAD");
  assert.equal(h.status, 200);
  assert.equal(h.headers.get("Content-Length"), "12345678");
  assert.equal((await get("/v1/assets/v2.0.0/nope.exe")).status, 404);
});

test("website download link: newest stable installer", async () => {
  const r = await get("/download/windows");
  assert.equal(r.status, 302);
  assert.equal(r.headers.get("Location"), "https://objects.example/11?sig=x", "prereleases are skipped");
  assert.equal((await get("/download/windows", "HEAD")).headers.get("Content-Length"), "999");
  assert.equal((await get("/download/macos")).status, 404);
  assert.equal((await get("/download/amiga")).status, 404);
});

test("bad paths and methods", async () => {
  assert.equal((await get("/v1/channels/stable/../x.json")).status, 404);
  assert.equal((await get("/v2/channels/stable/windows-amd64.json")).status, 404);
  assert.equal((await get("/v1/channels/stable/windows-amd64.json", "POST")).status, 405);
  assert.equal((await get("/healthz")).status, 200);
});

test("release list is cached", async () => {
  const before = calls.filter((c) => c.url.includes("/releases?")).length;
  await get("/v1/channels/stable/windows-amd64.json");
  assert.equal(calls.filter((c) => c.url.includes("/releases?")).length, before);
});
