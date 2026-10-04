const { validateFb, validateOptionalWp } = require("../../shared/social.validator");

const PANELS = new Set(["executive", "teacher", "advisor", "alumni"]);
const NAME_RE = /^[\p{L}\p{M}\s.'\-()]+$/u;
const HANDLE_RE = /^[A-Za-z0-9._-]{1,64}$/;
const FIELDS = ["panel", "name", "role", "year", "sort_order", "quote", "achievements",
  "facebook", "instagram", "whatsapp", "phone_number", "linkedin_url"];

const str = (v) => (typeof v === "string" ? v.trim() : "");

function optStr(v) {
  const s = str(v);
  if (s === "" || s.toLowerCase() === "null") return null;
  return s;
}

function isIntInRange(v, min, max) {
  return Number.isInteger(v) && v >= min && v <= max;
}

function checkAchievements(raw, errors, out) {
  if (raw === null) { out.achievements = null; return; }
  if (!Array.isArray(raw) || raw.length > 10) {
    errors.push({ field: "achievements", err: "Achievements must be an array of at most 10 items." });
    return;
  }
  const clean = [];
  for (const item of raw) {
    if (typeof item === "string") {
      const s = item.trim();
      if (!s || s.length > 200) {
        errors.push({ field: "achievements", err: "Each achievement must be 1–200 characters." });
        return;
      }
      clean.push(s);
    } else if (item && typeof item === "object" && typeof item.text === "string") {
      const s = item.text.trim();
      if (!s || s.length > 200) {
        errors.push({ field: "achievements", err: "Each achievement must be 1–200 characters." });
        return;
      }
      clean.push({ ...item, text: s });
    } else {
      errors.push({ field: "achievements", err: "Each achievement must be a string or {text: string}." });
      return;
    }
  }
  out.achievements = clean;
}

function checkSocial(key, raw, errors, out) {
  const s = optStr(raw);
  if (s === null) { out[key] = null; return; }
  if (s.length > 200) {
    errors.push({ field: key, err: "Must be 200 characters or fewer." });
    return;
  }
  if (key === "facebook") {
    if (s.startsWith("http")) {
      const r = validateFb(s);
      if (!r.ok) errors.push({ field: key, err: r.err });
      else out[key] = r.value;
    } else if (HANDLE_RE.test(s)) {
      out[key] = `https://facebook.com/${s}`;
    } else {
      errors.push({ field: key, err: "Use a Facebook URL (https://facebook.com/…) or a username (letters, numbers, . _ -)." });
    }
    return;
  }
  if (key === "instagram") {
    if (s.startsWith("http")) {
      let url;
      try { url = new URL(s); } catch { errors.push({ field: key, err: "Invalid URL." }); return; }
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      if (url.protocol !== "https:" || (host !== "instagram.com" && host !== "linktr.ee")) {
        errors.push({ field: key, err: "Instagram link must be an https://instagram.com URL." });
        return;
      }
      out[key] = s;
    } else if (/^@?[A-Za-z0-9._-]{1,64}$/.test(s)) {
      out[key] = s;
    } else {
      errors.push({ field: key, err: "Use an Instagram URL or a handle (letters, numbers, . _ -)." });
    }
    return;
  }
  if (key === "linkedin_url") {
    if (s.startsWith("http")) {
      let url;
      try { url = new URL(s); } catch { errors.push({ field: key, err: "Invalid URL." }); return; }
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      if (url.protocol !== "https:" || !host.endsWith("linkedin.com")) {
        errors.push({ field: key, err: "LinkedIn link must be an https://linkedin.com URL." });
        return;
      }
      out[key] = s;
    } else if (HANDLE_RE.test(s)) {
      out[key] = `https://www.linkedin.com/in/${s}`;
    } else {
      errors.push({ field: key, err: "Use a LinkedIn URL (https://linkedin.com/in/…) or a username." });
    }
    return;
  }
}

function checkPhone(key, raw, errors, out) {
  const r = validateOptionalWp(raw);
  if (!r.ok) errors.push({ field: key, err: r.err });
  else out[key] = r.value;
}

function validateMemberWrite(body, { partial }) {
  const errors = [];
  const out = {};

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, errors: [{ field: "_", err: "JSON body required." }] };
  }

  if (partial) {
    const keys = Object.keys(body);
    if (!keys.length) return { ok: false, errors: [{ field: "_", err: "Provide at least one field to update." }] };
    const unknown = keys.filter((k) => !FIELDS.includes(k));
    if (unknown.length) return { ok: false, errors: unknown.map((k) => ({ field: k, err: "Unknown field." })) };
  }

  for (const key of FIELDS) {
    if (!(key in body)) continue;
    const raw = body[key];

    if (key === "panel" || key === "name") {
      const s = str(raw);
      if (!s) {
        if (!partial) errors.push({ field: key, err: `${key === "panel" ? "Panel" : "Name"} is required.` });
        continue;
      }
      if (key === "panel") {
        if (!PANELS.has(s)) errors.push({ field: key, err: "Panel must be executive, teacher, advisor or alumni." });
        else out.panel = s;
      } else {
        if (s.length > 64) errors.push({ field: key, err: "Name must be 64 characters or fewer." });
        else if (!NAME_RE.test(s)) errors.push({ field: key, err: "Name contains invalid characters." });
        else out.name = s;
      }
      continue;
    }

    if (key === "role") {
      const s = optStr(raw);
      if (s !== null && s.length > 64) errors.push({ field: key, err: "Role must be 64 characters or fewer." });
      else out.role = s;
      continue;
    }

    if (key === "year") {
      if (raw === null || raw === "") { out.year = null; continue; }
      const n = Number(raw);
      if (!isIntInRange(n, 2000, 2100)) errors.push({ field: key, err: "Year must be a whole number between 2000 and 2100." });
      else out.year = n;
      continue;
    }

    if (key === "sort_order") {
      const n = Number(raw);
      if (!isIntInRange(n, 0, 9999)) errors.push({ field: key, err: "Sort order must be a whole number between 0 and 9999." });
      else out.sort_order = n;
      continue;
    }

    if (key === "quote") {
      const s = optStr(raw);
      if (s !== null && s.length > 500) errors.push({ field: key, err: "Quote must be 500 characters or fewer." });
      else out.quote = s;
      continue;
    }

    if (key === "achievements") { checkAchievements(raw, errors, out); continue; }
    if (key === "facebook" || key === "instagram" || key === "linkedin_url") { checkSocial(key, raw, errors, out); continue; }
    if (key === "whatsapp" || key === "phone_number") { checkPhone(key, raw, errors, out); continue; }
  }

  if (!partial) {
    if (!("panel" in out)) errors.push({ field: "panel", err: "Panel is required." });
    if (!("name" in out)) errors.push({ field: "name", err: "Name is required." });
    if (out.panel === "alumni" && !out.year) errors.push({ field: "year", err: "Graduation year is required for alumni." });
  }

  if (errors.length) return { ok: false, errors, value: out };
  return { ok: true, value: out };
}

module.exports = { validateMemberWrite, FIELDS };
