const http = require("http");
const { createApp } = require("../app");
const s3 = require("../storage/s3");

const TINY_WEBP = Buffer.from("UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=", "base64");

let passed = 0;
let failed = 0;

function check(name, cond, detail) {
  if (cond) {
    passed += 1;
    console.log(`  ok ${name}`);
  } else {
    failed += 1;
    console.log(`FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

async function main() {
  const server = http.createServer(createApp());
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  // 1. Upload a test image to S3
  const key = await s3.putImage(TINY_WEBP, "image/webp");
  const filename = key.replace(/^members\//, "");

  try {
    // 2. GET /api/images/members/:filename -> 200
    let res = await fetch(`${base}/api/images/members/${filename}`);
    check("GET /api/images/members/:filename → 200", res.status === 200, `got ${res.status}`);
    check("Content-Type is image/webp", res.headers.get("content-type") === "image/webp", res.headers.get("content-type"));
    check("Cache-Control is immutable", res.headers.get("cache-control") === "public, max-age=31536000, immutable", res.headers.get("cache-control"));
    const etag = res.headers.get("etag");
    check("ETag header is present", Boolean(etag), etag);
    const bodyBuf = Buffer.from(await res.arrayBuffer());
    check("Image body matches uploaded buffer", bodyBuf.equals(TINY_WEBP), `length ${bodyBuf.length}`);

    // 3. GET /api/images/:key(*) -> 200
    res = await fetch(`${base}/api/images/${key}`);
    check("GET /api/images/:key(*) → 200", res.status === 200, `got ${res.status}`);

    // 4. Conditional GET with If-None-Match -> 304
    res = await fetch(`${base}/api/images/members/${filename}`, {
      headers: { "if-none-match": etag },
    });
    check("GET with matching If-None-Match → 304 Not Modified", res.status === 304, `got ${res.status}`);
    const emptyBody = await res.text();
    check("304 response has empty body", emptyBody === "", `body length ${emptyBody.length}`);

    // 5. GET non-existent image -> 404
    res = await fetch(`${base}/api/images/members/00000000-0000-0000-0000-000000000000.webp`);
    check("GET non-existent image → 404", res.status === 404, `got ${res.status}`);

    // 6. Security: Path traversal & invalid keys -> 404
    res = await fetch(`${base}/api/images/members/%2e%2e%2fpackage.json`);
    check("Path traversal attempt → 404", res.status === 404, `got ${res.status}`);

    res = await fetch(`${base}/api/images/other/file.webp`);
    check("Non-members prefix → 404", res.status === 404, `got ${res.status}`);
  } finally {
    await s3.removeImage(key);
    await new Promise((resolve) => server.close(resolve));
  }

  console.log(`\nverify-images: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error("verify-images failed:", err);
  process.exit(1);
});
