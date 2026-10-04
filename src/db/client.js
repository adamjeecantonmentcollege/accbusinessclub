const { createClient } = require("@supabase/supabase-js");
const { SUPABASE_URL, SUPABASE_KEY, REGISTRATION_TABLE, SUPABASE_ENABLED } = require("../config/env");

let supabase = null;
if (SUPABASE_ENABLED) {
  supabase = createClient(SUPABASE_URL.replace(/\/$/, ""), SUPABASE_KEY);
}

module.exports = { supabase, table: () => REGISTRATION_TABLE };
