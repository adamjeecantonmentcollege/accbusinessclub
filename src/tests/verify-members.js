const http = require("http");
const crypto = require("crypto");
const { createApp } = require("../app");
const { ADMIN_TOKEN } = require("../config/env");

const TINY_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64"
);

let passed = 0;
let failed = 0;
const created = [];

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
  const auth = { authorization: `Bearer ${ADMIN_TOKEN}` };
  const jsonH = { "content-type": "application/json", ...auth };
  const j = (r) => r.json().catch(() => null);

  let r = await fetch(base + "/api/members", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  check("POST without token → 401", r.status === 401, `got ${r.status}`);

  r = await fetch(base + "/api/members", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: "Bearer wrong-token" },
    body: "{}",
  });
  check("POST with wrong token → 401", r.status === 401, `got ${r.status}`);

  r = await fetch(base + "/api/members", { method: "POST", headers: jsonH, body: "{}" });
  let b = await j(r);
  check("POST empty body → 400 with panel+name errors", r.status === 400 && b?.errors?.some((e) => e.field === "panel") && b?.errors?.some((e) => e.field === "name"), `got ${r.status} ${JSON.stringify(b)}`);

  r = await fetch(base + "/api/members", {
    method: "POST", headers: jsonH,
    body: JSON.stringify({ panel: "god", name: "X" }),
  });
  b = await j(r);
  check("POST invalid panel → 400", r.status === 400 && b?.errors?.some((e) => e.field === "panel"), `got ${r.status}`);

  r = await fetch(base + "/api/members", {
    method: "POST", headers: jsonH,
    body: JSON.stringify({ panel: "alumni", name: "No Year" }),
  });
  b = await j(r);
  check("POST alumni without year → 400", r.status === 400 && b?.errors?.some((e) => e.field === "year"), `got ${r.status}`);

  r = await fetch(base + "/api/members", {
    method: "POST", headers: jsonH,
    body: JSON.stringify({
      panel: "executive", name: "API Test Exec", role: "Verifier",
      sort_order: 9999, quote: "smoke test", instagram: "@api.test",
      achievements: ["Verified once", { text: "Verified twice" }],
    }),
  });
  b = await j(r);
  check("POST valid executive → 201 with id", r.status === 201 && typeof b?.id === "string", `got ${r.status} ${JSON.stringify(b)}`);
  if (b?.id) created.push(b.id);
  const execId = b?.id;
  check("create echoes panel/name/sort_order", b?.panel === "executive" && b?.name === "API Test Exec" && b?.sort_order === 9999, JSON.stringify(b));
  check("create keeps instagram handle + achievements jsonb", b?.instagram === "@api.test" && Array.isArray(b?.achievements) && b.achievements.length === 2, JSON.stringify(b));

  r = await fetch(base + "/api/members", {
    method: "POST", headers: jsonH,
    body: JSON.stringify({ panel: "alumni", name: "API Test Alum", year: 2020, facebook: "api.alum", whatsapp: "01712345678" }),
  });
  b = await j(r);
  check("POST valid alumni → 201", r.status === 201 && b?.year === 2020, `got ${r.status} ${JSON.stringify(b)}`);
  if (b?.id) created.push(b.id);
  const alumId = b?.id;
  check("facebook username normalized to URL", b?.facebook === "https://facebook.com/api.alum", b?.facebook);
  check("whatsapp normalized to E.164", b?.whatsapp === "+8801712345678", b?.whatsapp);

  r = await fetch(base + "/api/members", {
    method: "POST", headers: jsonH,
    body: JSON.stringify({ name: "Missing Panel" }),
  });
  check("POST without panel → 400", r.status === 400, `got ${r.status}`);

  r = await fetch(base + "/api/members/not-a-uuid", {
    method: "PUT", headers: jsonH, body: JSON.stringify({ role: "x" }),
  });
  check("PUT non-uuid id → 404", r.status === 404, `got ${r.status}`);

  r = await fetch(base + "/api/members/" + crypto.randomUUID(), {
    method: "PUT", headers: jsonH, body: JSON.stringify({ role: "x" }),
  });
  check("PUT unknown uuid → 404", r.status === 404, `got ${r.status}`);

  r = await fetch(base + "/api/members/" + execId, {
    method: "PUT", headers: jsonH, body: JSON.stringify({ hacker: "x" }),
  });
  check("PUT unknown field → 400", r.status === 400, `got ${r.status}`);

  r = await fetch(base + "/api/members/" + execId, {
    method: "PUT", headers: jsonH, body: JSON.stringify({}),
  });
  check("PUT empty object → 400", r.status === 400, `got ${r.status}`);

  r = await fetch(base + "/api/members/" + execId, {
    method: "PUT", headers: jsonH,
    body: JSON.stringify({ role: "Lead Verifier", quote: null }),
  });
  const putBody = await r.text();
  check("PUT partial update → 200 with empty body", r.status === 200 && putBody === "", `got ${r.status} "${putBody}"`);

  r = await fetch(base + "/api/members/" + execId, {
    method: "PUT", headers: jsonH, body: JSON.stringify({ panel: "alumni" }),
  });
  b = await j(r);
  check("PUT switching to alumni without year → 400 (merged rule)", r.status === 400 && b?.errors?.some((e) => e.field === "year"), `got ${r.status} ${JSON.stringify(b)}`);

  // Public read endpoint checks
  r = await fetch(base + "/api/public/members");
  b = await j(r);
  check("GET /api/public/members → 200 array", r.status === 200 && Array.isArray(b) && b.length >= 100, `got ${r.status}, length ${b?.length}`);

  r = await fetch(base + "/api/public/members?panel=executive");
  b = await j(r);
  check("GET /api/public/members?panel=executive → 200 with 21+ items", r.status === 200 && Array.isArray(b) && b.every((m) => m.panel === "executive"), `got ${r.status}, count ${b?.length}`);

  r = await fetch(base + "/api/public/members?panel=alumni&limit=3");
  b = await j(r);
  check("GET /api/public/members?panel=alumni&limit=3 → 200 with 3 items", r.status === 200 && Array.isArray(b) && b.length === 3, `got ${r.status}, count ${b?.length}`);

  r = await fetch(base + "/api/public/members?panel=invalid");
  b = await j(r);
  check("GET /api/public/members?panel=invalid → 400", r.status === 400 && b?.errors?.some((e) => e.field === "panel"), `got ${r.status}`);

  const badForm = new FormData();
  badForm.append("image", new Blob(["plain text"], { type: "text/plain" }), "note.txt");
  r = await fetch(base + "/api/members/" + execId + "/image", { method: "POST", headers: auth, body: badForm });
  check("image upload wrong mime → 400", r.status === 400, `got ${r.status}`);

  r = await fetch(base + "/api/members/" + execId + "/image", { method: "POST", headers: auth });
  check("image upload missing file → 400", r.status === 400, `got ${r.status}`);

  const form = new FormData();
  form.append("image", new Blob([TINY_PNG], { type: "image/png" }), "pixel.png");
  r = await fetch(base + "/api/members/" + execId + "/image", { method: "POST", headers: auth, body: form });
  b = await j(r);
  check("image upload happy path → 200 with members/ key (real S3)", r.status === 200 && typeof b?.image === "string" && b.image.startsWith("members/"), `got ${r.status} ${JSON.stringify(b)}`);
  const firstImage = b?.image;

  const form2 = new FormData();
  form2.append("image", new Blob([TINY_PNG], { type: "image/webp" }), "pixel.webp");
  r = await fetch(base + "/api/members/" + execId + "/image", { method: "POST", headers: auth, body: form2 });
  b = await j(r);
  check("second upload replaces key", r.status === 200 && b?.image && b.image !== firstImage, `got ${r.status} ${JSON.stringify(b)}`);

  r = await fetch(base + "/api/members/" + execId, { method: "DELETE", headers: auth });
  check("DELETE member → 204", r.status === 204, `got ${r.status}`);

  r = await fetch(base + "/api/members/" + execId, { method: "DELETE", headers: auth });
  check("DELETE again → 404", r.status === 404, `got ${r.status}`);

  r = await fetch(base + "/api/members/" + alumId, { method: "DELETE", headers: auth });
  check("DELETE alumni → 204", r.status === 204, `got ${r.status}`);

  for (const id of created) {
    await fetch(base + "/api/members/" + id, { method: "DELETE", headers: auth }).catch(() => {});
  }

  await new Promise((resolve) => server.close(resolve));
  console.log(`\nverify-members: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
