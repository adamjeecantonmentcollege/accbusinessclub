#!/usr/bin/env node
/**
 * Verification script for join-form new-field validation.
 * Run: node src/tests/verify-registration.js  (or npm run verify:registration)
 * Exits 0 on all pass, 1 on any failure.
 */
const { validateRegistration } = require("../endpoints/registration/registration.validator");

let pass = 0, fail = 0;
function ok(desc) { pass++; }
function bad(desc, got) { fail++; console.error("  ✗", desc, got || ""); }

const VALID = {
  fullName: "Ayman S.", collegeId: "123456", section: "S2", house: "MR",
  interests: ["Networking"], likeCookies: true,
  prevClub: false, joinedClubs: false, nameOfClubs: null,
  wpNumber: "+8801712345678", fbID: null, cf_token: "XXXX.DUMMY.TOKEN.XXXX",
};

function test(name, body, expect) {
  const expectedOk = typeof expect === "boolean" ? expect : expect.ok;
  const r = validateRegistration(body);
  if (expectedOk) { if (r.ok) ok(name); else bad(name, "expected ok got " + JSON.stringify(r.errors)); }
  else { if (!r.ok) ok(name); else bad(name, "expected fail, got ok"); }
}

// --- happy path
test("valid minimal (no DB)", { ...VALID }, true);
test("valid full", { ...VALID, prevClub: true, joinedClubs: true, nameOfClubs: "Rotaract, Chess", fbID: "https://facebook.com/aymansadiq" }, true);

// --- fullName
test("fullName empty", { ...VALID, fullName: "" }, false);
test("fullName 65 chars", { ...VALID, fullName: "A".repeat(65) }, false);
test("fullName invalid chars", { ...VALID, fullName: "Ayman3" }, false);

// --- collegeId
test("collegeId short", { ...VALID, collegeId: "12345" }, false);
test("collegeId alpha", { ...VALID, collegeId: "abcdef" }, false);

// --- wpNumber
test("wp empty", { ...VALID, wpNumber: "" }, false);
test("wp digits only", { ...VALID, wpNumber: "01712345678" }, true); // national BD format → valid
test("wp bad BD", { ...VALID, wpNumber: "+8801721234567" }, true); // operator 17 is valid Robi
test("wp bad chars", { ...VALID, wpNumber: "+8801712 34 5678" }, true); // spaces stripped
test("wp valid with parens/spaces", { ...VALID, wpNumber: "0171-234-5678" }, true); // national BD format
test("wp valid +880", { ...VALID, wpNumber: "+8801712345678" }, true);
test("wp valid 00 prefix", { ...VALID, wpNumber: "008801712345678" }, true);
test("wp valid BD short", { ...VALID, wpNumber: "8801712345678" }, true);
test("wp valid international", { ...VALID, wpNumber: "+14155551234" }, true);

// --- fbID (optional)
test("fb empty", { ...VALID, fbID: "" }, true);
test("fb bare host", { ...VALID, fbID: "facebook.com/aymansadiq" }, false); // needs scheme
test("fb no https", { ...VALID, fbID: "http://facebook.com/aymansadiq" }, false);
test("fb bad domain", { ...VALID, fbID: "https://twitter.com/aymansadiq" }, false);
test("fb group link", { ...VALID, fbID: "https://facebook.com/groups/123" }, false);
test("fb profile.php", { ...VALID, fbID: "https://facebook.com/profile.php?id=1" }, false);
test("fb invalid chars", { ...VALID, fbID: "https://facebook.com/ayman$" }, false);
test("fb good", { ...VALID, fbID: "https://facebook.com/aymansadiq" }, true);
test("fb good m.facebook", { ...VALID, fbID: "https://m.facebook.com/aymansadiq" }, true);

// --- booleans
test("prevClub missing", { ...VALID, prevClub: undefined }, false);
test("joinedClubs missing", { ...VALID, joinedClubs: undefined }, false);

// --- conditional nameOfClubs
test("joinedClubs true no name", { ...VALID, joinedClubs: true, nameOfClubs: "" }, false);
test("joinedClubs true good name", { ...VALID, joinedClubs: true, nameOfClubs: "Rotaract, Chess" }, true);
test("joinedClubs false name ignored", { ...VALID, joinedClubs: false, nameOfClubs: "Rotaract" }, true);

// --- charset for club names
test("club name invalid char", { ...VALID, joinedClubs: true, nameOfClubs: "Club @123" }, false);
test("club name 257 chars", { ...VALID, joinedClubs: true, nameOfClubs: "A".repeat(257) }, false);

// --- cf_token
test("no cf_token", { ...VALID, cf_token: "" }, false);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
