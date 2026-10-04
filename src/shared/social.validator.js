/**
 * WhatsApp + Facebook validation shared by endpoints (registration, members, ...).
 * Pure functions — no I/O. Moved out of registration.validator.js per plan 1
 * shared/ rule (2+ consumers).
 */

const WP_RE = /^\+[1-9][0-9]{7,14}$/;
const FB_USERNAME_RE = /^[A-Za-z0-9._-]{1,64}$/;
const FB_RESERVED = new Set([
  "profile.php", "groups", "events", "pages", "photo", "photos", "videos", "watch",
  "marketplace", "sharer", "login", "help", "about", "settings"
]);

// --- WhatsApp normalization + validation ---
function normalizeWp(raw) {
  let s = String(raw || "").replace(/[\s.\-()]/g, "");
  if (s.startsWith("+")) return s;
  if (s.startsWith("00")) return "+" + s.slice(2);
  if (s.startsWith("0") && /^\d{11}$/.test(s)) return "+880" + s.slice(1); // BD national
  if (/^\d{12}$/.test(s) && s.startsWith("880")) return "+" + s; // 880 prefix w/o +
  if (/^\d{9,15}$/.test(s)) return "+" + s;
  return s;
}

function validateWp(raw) {
  const s = String(raw || "").trim();
  if (!s) return { ok: false, err: "WhatsApp number is required.", field: "wpNumber" };
  const norm = normalizeWp(s);
  if (!norm.startsWith("+")) return { ok: false, err: "Add country code, e.g. +8801712345678.", field: "wpNumber" };
  if (!WP_RE.test(norm)) return { ok: false, err: "Enter 8–15 digits after the country code (e.g. +8801712345678).", field: "wpNumber" };
  // Bangladesh-specific tighter check when country code is 880
  if (norm.startsWith("+880")) {
    const bdMatch = norm.match(/^\+8801[3-9]\d{8}$/);
    if (!bdMatch) return { ok: false, err: "Enter a valid Bangladeshi mobile number (01[3-9]XXXXXXXX).", field: "wpNumber" };
  }
  return { ok: true, value: norm };
}

/** Optional variant: empty → { ok: true, value: null }; otherwise same rules as validateWp. */
function validateOptionalWp(raw) {
  const s = String(raw || "").trim();
  if (!s) return { ok: true, value: null };
  return validateWp(s);
}

// --- Facebook URL verifier ---
function validateFb(raw) {
  const s = String(raw || "").trim();
  if (!s) return { ok: true, value: null }; // optional
  if (s.length > 200) return { ok: false, err: "Facebook link must be 200 characters or fewer.", field: "fbID" };
  if (/\s/.test(s)) return { ok: false, err: "Facebook links can't contain spaces.", field: "fbID" };
  let url;
  try { url = new URL(s); } catch { return { ok: false, err: "Invalid URL — include https://, e.g. https://facebook.com/yourname.", field: "fbID" }; }
  if (url.protocol !== "https:")
    return { ok: false, err: "Only https:// links are accepted.", field: "fbID" };
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const root = host === "facebook.com" || host === "m.facebook.com" || host === "fb.com" || host === "www.fb.com";
  if (!root) return { ok: false, err: "This must be a Facebook link — domain has to be facebook.com or fb.com.", field: "fbID" };
  const path = url.pathname.replace(/^\//, "").replace(/\/+$/, "");
  const seg = path.split("/").filter(Boolean);
  if (!seg.length) return { ok: false, err: "Your link is missing a username — it should end with your profile name, e.g. https://facebook.com/yourname.", field: "fbID" };
  if (seg.length > 1) return { ok: false, err: "Use your profile link only — not a group, page, event, or photo link.", field: "fbID" };
  const last = seg[seg.length - 1];
  if (FB_RESERVED.has(last)) return { ok: false, err: "Use your profile link — not a group, page, event, or photo link.", field: "fbID" };
  if (!FB_USERNAME_RE.test(last))
    return { ok: false, err: "Profile names allow only letters, numbers, periods (.), hyphens (-) and underscores (_).", field: "fbID" };
  return { ok: true, value: "https://" + (host === "www.fb.com" || host === "m.facebook.com" ? "facebook.com" : host) + "/" + last };
}

module.exports = { normalizeWp, validateWp, validateOptionalWp, validateFb };
