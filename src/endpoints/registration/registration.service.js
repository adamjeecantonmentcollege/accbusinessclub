const { validateRegistration } = require("./registration.validator");
const { supabase, table } = require("../../db/client");
const { verifyTurnstileToken } = require("./turnstile.service");

async function submitRegistration(rawBody, clientIp) {
  const v = validateRegistration(rawBody || {});
  if (!v.ok) return { status: 400, field: v.errors[0].field };

  // Turnstile
  const clientIpVal = clientIp || "";
  const cfOk = await verifyTurnstileToken(v.value.cf_token, clientIpVal);
  if (!cfOk) return { status: 403, field: "cf_token" };

  // Supabase dup check + insert
  if (supabase) {
    try {
      const t = table();
      const { data: existing } = await supabase.from(t).select("college_id").eq("college_id", v.value.collegeId).maybeSingle();
      if (existing) return { status: 409, field: "collegeId" };
      const { error: insErr } = await supabase.from(t).insert({
        full_name: v.value.fullName,
        college_id: v.value.collegeId,
        section: v.value.section,
        house_name: v.value.house,
        interests: v.value.interests,
        like_cookies: v.value.likeCookies,
        prev_club: v.value.prevClub,
        joined_clubs: v.value.joinedClubs,
        name_of_clubs: v.value.nameOfClubs,
        wp_number: v.value.wpNumber,
        fb_id: v.value.fbID,
      });
      if (insErr) {
        console.error("Supabase insert error:", insErr);
        if (insErr.code === "23505") return { status: 409, field: "collegeId" };
        return { status: 500, field: "db" };
      }
    } catch (dbErr) {
      console.error("Database execution error:", dbErr);
      return { status: 500, field: "db" };
    }
  }
  console.log("ok");
  return { status: 200 };
}

module.exports = { submitRegistration };
