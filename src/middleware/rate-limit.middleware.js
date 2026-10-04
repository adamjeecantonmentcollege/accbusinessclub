const crypto = require("crypto");

/**
 * Generates a privacy-preserving browser/client fingerprint based on IP and standard HTTP headers.
 * @param {import("express").Request} req
 * @returns {string} SHA-256 hex digest
 */
function getClientFingerprint(req) {
  const ip = req.headers["x-forwarded-for"]
    ? req.headers["x-forwarded-for"].split(",")[0].trim()
    : (req.socket?.remoteAddress || req.ip || "127.0.0.1");

  const userAgent = req.headers["user-agent"] || "";
  const acceptLang = req.headers["accept-language"] || "";
  const acceptEnc = req.headers["accept-encoding"] || "";
  const chUa = req.headers["sec-ch-ua"] || "";
  const chPlatform = req.headers["sec-ch-ua-platform"] || "";

  const raw = `${ip}|${userAgent}|${acceptLang}|${acceptEnc}|${chUa}|${chPlatform}`;
  return crypto.createHash("sha256").update(raw).digest("hex");
}

/**
 * Creates an in-memory sliding-window rate limiter middleware with browser fingerprinting.
 * @param {object} options
 * @param {string} [options.name="default"] - Bucket identifier
 * @param {number} [options.windowMs=60000] - Window duration in milliseconds (default: 1 min)
 * @param {number} [options.max=60] - Maximum allowed requests per window
 * @param {string} [options.message="Too many requests. Please slow down."] - Error message on 429
 * @returns {import("express").RequestHandler}
 */
function createRateLimiter(options = {}) {
  const name = options.name || "default";
  const windowMs = Number(options.windowMs) || 60 * 1000;
  const max = Number(options.max) || 60;
  const message = options.message || "Too many requests. Please slow down.";

  // Store: Map<fingerprintKey, { count: number, resetTime: number }>
  const hits = new Map();

  // Periodic cleanup of expired entries
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [k, entry] of hits.entries()) {
      if (now > entry.resetTime) {
        hits.delete(k);
      }
    }
  }, Math.min(windowMs, 60000));

  if (cleanupTimer.unref) cleanupTimer.unref();

  return function rateLimitMiddleware(req, res, next) {
    const now = Date.now();
    const fingerprint = getClientFingerprint(req);
    const key = `${name}:${fingerprint}`;

    let entry = hits.get(key);
    if (!entry || now > entry.resetTime) {
      entry = { count: 1, resetTime: now + windowMs };
      hits.set(key, entry);
    } else {
      entry.count += 1;
    }

    const remaining = Math.max(0, max - entry.count);
    const resetSeconds = Math.max(1, Math.ceil((entry.resetTime - now) / 1000));

    res.setHeader("RateLimit-Limit", max);
    res.setHeader("RateLimit-Remaining", remaining);
    res.setHeader("RateLimit-Reset", resetSeconds);

    if (entry.count > max) {
      res.setHeader("Retry-After", resetSeconds);
      return res.status(429).json({ error: message });
    }

    return next();
  };
}

// Pre-configured rate limiters for public endpoints
const publicMembersRateLimit = createRateLimiter({
  name: "public_members",
  windowMs: 60 * 1000,
  max: 60, // 60 requests/minute per browser fingerprint
});

const publicImagesRateLimit = createRateLimiter({
  name: "public_images",
  windowMs: 60 * 1000,
  max: 120, // 120 image requests/minute per browser fingerprint
});

module.exports = {
  createRateLimiter,
  getClientFingerprint,
  publicMembersRateLimit,
  publicImagesRateLimit,
};
