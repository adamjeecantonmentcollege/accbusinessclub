/**
 * Pure validation rules for the join registration form.
 * No I/O, no network — importable by the service AND the verification script.
 * Each check returns { ok, value?, err? }.
 * WhatsApp + Facebook rules live in shared/social.validator.js (also used by members).
 */

const { validateWp, validateFb } = require("../../shared/social.validator");

const NAME_RE = /^[A-Za-z.()\s]+$/;
const ID_RE = /^[0-9]{6}$/;
const CHARS = "A-Z a-z 0-9 spaces ().,: max 256";
const CLUB_NAME_RE = /^[A-Za-z0-9 ().,:]+$/;

function sanitizeWhitespace(s) {
  return s.replace(/\s+/g, " ").trim();
}

function isBinary(v) {
  return typeof v === "boolean" || v === 0 || v === 1 || v === "0" || v === "1";
}
function toBool(v) {
  if (typeof v === "boolean") return v;
  return v === 1 || v === "1" || String(v).toLowerCase() === "true";
}

// --- Free-text club names (A-Z a-z 0-9 spaces ().,: max 256) ---
function validateClubName(raw, label) {
  const s = typeof raw === "string" ? raw : "";
  const collapsed = sanitizeWhitespace(s);
  if (!collapsed) return { ok: false, err: `${label} is required when answered "Yes".`, field: label };
  if (collapsed.length > 256) return { ok: false, err: `${label} must be 256 characters or fewer.`, field: label };
  if (!CLUB_NAME_RE.test(collapsed)) return { ok: false, err: CHARS + ` — ${label} contains invalid characters.`, field: label };
  return { ok: true, value: collapsed };
}

// --- Main entry ---
function validateRegistration(body) {
  const out = {};
  const errors = [];

  // fullName
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  if (!fullName) errors.push({ field: "fullName", err: "Please enter your full name." });
  else if (fullName.length > 64) errors.push({ field: "fullName", err: "Full name must be 64 characters or fewer." });
  else if (!NAME_RE.test(fullName)) errors.push({ field: "fullName", err: "Only letters (A-Z, a-z), spaces, dots, and parentheses allowed." });
  else out.fullName = fullName;

  // collegeId
  const collegeId = typeof body.collegeId === "string" ? body.collegeId.trim() : "";
  if (!collegeId) errors.push({ field: "collegeId", err: "Please enter your College ID." });
  else if (!ID_RE.test(collegeId)) errors.push({ field: "collegeId", err: "College ID must be exactly 6 numeric digits." });
  else out.collegeId = collegeId;

  // section
  const ALLOWED_SECTIONS = new Set(["S1","S2","S3","S4","S5","S6","S7","S8","S9","S10","S11","S12","S13","S14","S15","S16","S17","S18","B1","B2","B3","B4","B5","H"]);
  const section = typeof body.section === "string" ? body.section.trim() : "";
  if (!section) errors.push({ field: "section", err: "Select your section." });
  else if (!ALLOWED_SECTIONS.has(section)) errors.push({ field: "section", err: "Invalid section." });
  else out.section = section;

  // house
  const ALLOWED_HOUSES = new Set(["MAR", "MK", "MR", "MJ"]);
  const house = typeof body.house === "string" ? body.house.trim() : "";
  if (!house) errors.push({ field: "house", err: "Select your house." });
  else if (!ALLOWED_HOUSES.has(house)) errors.push({ field: "house", err: "Invalid house." });
  else out.house = house;

  // interests
  if (!Array.isArray(body.interests) || body.interests.length === 0)
    errors.push({ field: "interests", err: "Pick at least one interest." });
  else {
    const ALLOWED_INTERESTS = new Set(["Networking","Leadership","Marketing","Finance","Strategy","FinTech","Public Speaking","Event Management","Content Creation","Design","Research","Debate"]);
    const bad = body.interests.filter((i) => typeof i !== "string" || !ALLOWED_INTERESTS.has(i.trim()));
    if (bad.length) errors.push({ field: "interests", err: "Invalid interest selected." });
    else out.interests = body.interests.map((i) => i.trim());
  }

  // likeCookies
  if (!isBinary(body.likeCookies)) errors.push({ field: "likeCookies", err: "Answer the cookies question." });
  else out.likeCookies = toBool(body.likeCookies);

  // --- NEW FIELDS ---
  // prevClub
  if (!isBinary(body.prevClub)) errors.push({ field: "prevClub", err: "Answer whether you have previous clubbing experience." });
  else out.prevClub = toBool(body.prevClub);

  // joinedClubs
  if (!isBinary(body.joinedClubs)) errors.push({ field: "joinedClubs", err: "Answer whether you joined any other ACC club." });
  else out.joinedClubs = toBool(body.joinedClubs);

  // nameOfClubs (required iff joinedClubs === true)
  if (out.joinedClubs === true) {
    const cn = validateClubName(body.nameOfClubs, "Club names");
    if (!cn.ok) errors.push({ field: "nameOfClubs", err: cn.err });
    else out.nameOfClubs = cn.value;
  } else {
    out.nameOfClubs = null;
  }

  // wpNumber (required)
  const wp = validateWp(body.wpNumber);
  if (!wp.ok) errors.push({ field: "wpNumber", err: wp.err });
  else out.wpNumber = wp.value;

  // fbID (optional)
  const fb = validateFb(body.fbID);
  if (!fb.ok) errors.push({ field: "fbID", err: fb.err });
  else out.fbID = fb.value;

  // cf_token
  const cf_token = typeof body.cf_token === "string" ? body.cf_token.trim() : "";
  if (!cf_token) errors.push({ field: "cf_token", err: "Security token missing — retry." });
  else out.cf_token = cf_token;

  if (errors.length) return { ok: false, errors: errors, value: out };
  return { ok: true, value: out };
}

module.exports = { validateRegistration, validateWp, validateFb, validateClubName, isBinary, toBool };
