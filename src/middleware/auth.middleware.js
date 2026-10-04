/**
 * Bearer-token guard for admin-only write endpoints.
 * Compares Authorization: Bearer <ADMIN_TOKEN> in constant time (sha256 + timingSafeEqual).
 * Fails closed: missing config, missing header or mismatch → 401, no body.
 */
const crypto = require("crypto");
const { ADMIN_TOKEN } = require("../config/env");

function digest(s) {
  return crypto.createHash("sha256").update(s).digest();
}

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const spaceIdx = header.indexOf(" ");
  const scheme = spaceIdx > 0 ? header.slice(0, spaceIdx) : "";
  const token = spaceIdx > 0 ? header.slice(spaceIdx + 1).trim() : "";

  if (scheme.toLowerCase() !== "bearer" || !token || !ADMIN_TOKEN) {
    return res.status(401).end();
  }
  if (!crypto.timingSafeEqual(digest(token), digest(ADMIN_TOKEN))) {
    return res.status(401).end();
  }
  return next();
}

module.exports = { requireAdmin };
