const http = require("http");
const { createApp } = require("../app");
const {
  getClientFingerprint,
  createRateLimiter,
} = require("../middleware/rate-limit.middleware");

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

async function runUnitTests() {
  console.log("Running rate-limiter & fingerprint unit tests...");

  // 1. Fingerprint consistency & variation
  const mockReq1 = {
    headers: {
      "x-forwarded-for": "198.51.100.1",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "accept-language": "en-US,en;q=0.9",
      "accept-encoding": "gzip, deflate, br",
      "sec-ch-ua": '"Chromium";v="120"',
      "sec-ch-ua-platform": '"Windows"',
    },
  };

  const mockReqSame = {
    headers: {
      "x-forwarded-for": "198.51.100.1",
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "accept-language": "en-US,en;q=0.9",
      "accept-encoding": "gzip, deflate, br",
      "sec-ch-ua": '"Chromium";v="120"',
      "sec-ch-ua-platform": '"Windows"',
    },
  };

  const mockReqDiffIp = {
    headers: {
      ...mockReq1.headers,
      "x-forwarded-for": "198.51.100.2",
    },
  };

  const mockReqDiffUa = {
    headers: {
      ...mockReq1.headers,
      "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
    },
  };

  const mockReqDiffLang = {
    headers: {
      ...mockReq1.headers,
      "accept-language": "bn-BD,bn;q=0.9,en-US;q=0.8",
    },
  };

  const fp1 = getClientFingerprint(mockReq1);
  const fpSame = getClientFingerprint(mockReqSame);
  const fpDiffIp = getClientFingerprint(mockReqDiffIp);
  const fpDiffUa = getClientFingerprint(mockReqDiffUa);
  const fpDiffLang = getClientFingerprint(mockReqDiffLang);

  check("Fingerprint is a 64-char SHA-256 hex string", typeof fp1 === "string" && fp1.length === 64);
  check("Identical headers produce identical fingerprint", fp1 === fpSame);
  check("Different IP produces different fingerprint", fp1 !== fpDiffIp);
  check("Different User-Agent produces different fingerprint", fp1 !== fpDiffUa);
  check("Different Accept-Language produces different fingerprint", fp1 !== fpDiffLang);

  // 2. Custom rate limiter threshold & headers
  const limiter = createRateLimiter({
    name: "test_limiter",
    windowMs: 10000,
    max: 2,
    message: "Rate limit exceeded for test.",
  });

  const testApp = require("express")();
  testApp.use(limiter);
  testApp.get("/test", (req, res) => res.json({ ok: true }));

  const testServer = http.createServer(testApp);
  await new Promise((resolve) => testServer.listen(0, "127.0.0.1", resolve));
  const testBase = `http://127.0.0.1:${testServer.address().port}`;

  try {
    const clientAHeaders = {
      "user-agent": "ClientA",
      "accept-language": "en",
    };
    const clientBHeaders = {
      "user-agent": "ClientB",
      "accept-language": "fr",
    };

    // Client A: Request 1 -> 200 (Remaining: 1)
    let res = await fetch(`${testBase}/test`, { headers: clientAHeaders });
    check("Client A req 1 → 200", res.status === 200);
    check("RateLimit-Limit header is 2", res.headers.get("ratelimit-limit") === "2");
    check("RateLimit-Remaining header is 1", res.headers.get("ratelimit-remaining") === "1");
    check("RateLimit-Reset header is present", Boolean(res.headers.get("ratelimit-reset")));

    // Client A: Request 2 -> 200 (Remaining: 0)
    res = await fetch(`${testBase}/test`, { headers: clientAHeaders });
    check("Client A req 2 → 200", res.status === 200);
    check("RateLimit-Remaining header is 0", res.headers.get("ratelimit-remaining") === "0");

    // Client A: Request 3 -> 429
    res = await fetch(`${testBase}/test`, { headers: clientAHeaders });
    check("Client A req 3 → 429 Too Many Requests", res.status === 429);
    check("Retry-After header is present on 429", Boolean(res.headers.get("retry-after")));
    const body = await res.json();
    check("429 error message matches configured message", body.error === "Rate limit exceeded for test.");

    // Client B: Request 1 -> 200 (isolated bucket)
    res = await fetch(`${testBase}/test`, { headers: clientBHeaders });
    check("Client B req 1 → 200 (isolated fingerprint bucket)", res.status === 200);
    check("Client B RateLimit-Remaining is 1", res.headers.get("ratelimit-remaining") === "1");
  } finally {
    await new Promise((resolve) => testServer.close(resolve));
  }
}

async function runIntegrationTests() {
  console.log("\nRunning rate-limiting integration tests on application endpoints...");
  const server = http.createServer(createApp());
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;

  try {
    // 1. GET /api/public/members -> should have RateLimit headers (max 60)
    let res = await fetch(`${base}/api/public/members`);
    check("GET /api/public/members returns 200", res.status === 200);
    check("RateLimit-Limit is 60 on /api/public/members", res.headers.get("ratelimit-limit") === "60");
    check("RateLimit-Remaining header is present", Boolean(res.headers.get("ratelimit-remaining")));

    // 2. GET /api/members -> alias has same rate limit header
    res = await fetch(`${base}/api/members`);
    check("GET /api/members returns 200", res.status === 200);
    check("RateLimit-Limit is 60 on /api/members", res.headers.get("ratelimit-limit") === "60");

    // 3. GET /api/images/members/dummy.webp -> should have RateLimit headers (max 120)
    res = await fetch(`${base}/api/images/members/00000000-0000-0000-0000-000000000000.webp`);
    check("RateLimit-Limit is 120 on /api/images/members/:filename", res.headers.get("ratelimit-limit") === "120");

    // 4. GET /api/health -> must NOT be throttled / no ratelimit headers
    res = await fetch(`${base}/api/health`);
    check("GET /api/health returns 200", res.status === 200);
    check("GET /api/health has NO RateLimit-Limit header (unthrottled)", res.headers.get("ratelimit-limit") === null);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function main() {
  await runUnitTests();
  await runIntegrationTests();
  console.log(`\nverify-rate-limit: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error("verify-rate-limit failed:", err);
  process.exit(1);
});
