const fs = require("fs");
const path = require("path");
const { supabase } = require("../client");
const { MEMBERS_TABLE } = require("../../config/env");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const crypto = require("crypto");

function cleanString(val) {
  if (val === undefined || val === null) return null;
  const s = String(val).trim();
  return s === "" ? null : s;
}

function loadJson(relPath) {
  const fullPath = path.resolve(__dirname, "../../../", relPath);
  return JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

function prepareRows() {
  const rows = [];

  // 1. Executives
  const executives = loadJson("docs/executives.json");
  executives.forEach((m, idx) => {
    rows.push({
      id: crypto.randomUUID(),
      panel: "executive",
      name: cleanString(m.name),
      role: cleanString(m.role),
      year: null,
      sort_order: idx + 1,
      image: cleanString(m.image),
      facebook: cleanString(m.facebook),
      instagram: cleanString(m.instagram),
      linkedin_url: cleanString(m.linkedin_url),
      whatsapp: cleanString(m.whatsapp),
      phone_number: cleanString(m.phone_number),
      quote: cleanString(m.quote),
      achievements: Array.isArray(m.achievements) ? m.achievements : [],
      created_at: new Date().toISOString()
    });
  });

  // 2. Teachers
  const teachers = loadJson("docs/teachers.json");
  teachers.forEach((m, idx) => {
    rows.push({
      id: crypto.randomUUID(),
      panel: "teacher",
      name: cleanString(m.name),
      role: cleanString(m.role),
      year: null,
      sort_order: idx + 1,
      image: cleanString(m.image),
      facebook: cleanString(m.facebook),
      instagram: cleanString(m.instagram),
      linkedin_url: cleanString(m.linkedin_url),
      whatsapp: cleanString(m.whatsapp),
      phone_number: cleanString(m.phone_number),
      quote: cleanString(m.quote),
      achievements: Array.isArray(m.achievements) ? m.achievements : [],
      created_at: new Date().toISOString()
    });
  });

  // 3. Advisors
  const advisors = loadJson("docs/advisors.json");
  advisors.forEach((m, idx) => {
    rows.push({
      id: crypto.randomUUID(),
      panel: "advisor",
      name: cleanString(m.name),
      role: cleanString(m.role),
      year: null,
      sort_order: idx + 1,
      image: cleanString(m.image),
      facebook: cleanString(m.facebook),
      instagram: cleanString(m.instagram),
      linkedin_url: cleanString(m.linkedin_url),
      whatsapp: cleanString(m.whatsapp),
      phone_number: cleanString(m.phone_number),
      quote: cleanString(m.quote),
      achievements: Array.isArray(m.achievements) ? m.achievements : [],
      created_at: new Date().toISOString()
    });
  });

  // 4. Alumni
  const alumni = loadJson("docs/alumni.json");
  alumni.forEach((m, idx) => {
    const rawId = m.id ? String(m.id).trim() : null;
    const row = {
      id: (rawId && UUID_RE.test(rawId)) ? rawId : crypto.randomUUID(),
      panel: "alumni",
      name: cleanString(m.name),
      role: cleanString(m.panel_name || m.role),
      year: m.year ? parseInt(m.year, 10) : null,
      sort_order: typeof m.sort_order === "number" ? m.sort_order : idx + 1,
      image: cleanString(m.image_url || m.image),
      facebook: cleanString(m.facebook),
      instagram: cleanString(m.instagram),
      linkedin_url: cleanString(m.linkedin_url),
      whatsapp: cleanString(m.whatsapp),
      phone_number: cleanString(m.phone_number),
      quote: cleanString(m.quote),
      achievements: Array.isArray(m.achievements) ? m.achievements : [],
      created_at: m.created_at || new Date().toISOString()
    };
    rows.push(row);
  });

  return rows;
}

async function seed() {
  if (!supabase) {
    console.error("Supabase client is not configured. Check .env variables.");
    process.exit(1);
  }

  const rows = prepareRows();
  console.log(`Starting seed of ${rows.length} members into table "${MEMBERS_TABLE}"...`);

  // Insert in chunks of 50 to stay well within Supabase request limits
  const CHUNK_SIZE = 50;
  let insertedTotal = 0;

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { data, error } = await supabase.from(MEMBERS_TABLE).insert(chunk).select("id, panel, name");
    if (error) {
      console.error(`Error inserting chunk starting at index ${i}:`, error);
      throw error;
    }
    insertedTotal += data.length;
    console.log(`  Inserted batch ${Math.floor(i / CHUNK_SIZE) + 1} (${data.length} rows)`);
  }

  console.log(`\nSuccessfully inserted all ${insertedTotal} members.`);

  // Verify counts by panel in database
  const { data: counts, error: countErr } = await supabase
    .from(MEMBERS_TABLE)
    .select("panel");

  if (countErr) {
    console.error("Error fetching verification counts:", countErr);
  } else {
    const summary = counts.reduce((acc, row) => {
      acc[row.panel] = (acc[row.panel] || 0) + 1;
      return acc;
    }, {});
    console.log("\nDatabase verification summary by panel:", summary);
    console.log("Total rows in DB:", counts.length);
  }
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Seed failed:", err);
      process.exit(1);
    });
}

module.exports = { seed, prepareRows };
