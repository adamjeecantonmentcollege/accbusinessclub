const fs = require("fs");
const path = require("path");
const { supabase } = require("../client");
const { MEMBERS_TABLE } = require("../../config/env");
const s3 = require("../../storage/s3");

const MIME_MAP = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

async function uploadMemberImages() {
  if (!supabase) {
    console.error("Supabase client is not configured. Check .env.");
    process.exit(1);
  }

  const { data: members, error } = await supabase
    .from(MEMBERS_TABLE)
    .select("id, panel, name, image")
    .order("panel", { ascending: true })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Error fetching members:", error);
    throw error;
  }

  console.log(`Fetched ${members.length} members from "${MEMBERS_TABLE}".`);

  let uploadedCount = 0;
  let skippedCount = 0;
  let missingCount = 0;

  for (const m of members) {
    if (!m.image) {
      skippedCount++;
      continue;
    }

    // If already an S3 key, skip
    if (m.image.startsWith("members/")) {
      console.log(`  [SKIP] Already in S3: ${m.name} (${m.image})`);
      skippedCount++;
      continue;
    }

    // Resolve file path in docs/
    const relPath = m.image.replace(/^\//, "");
    const fullPath = path.resolve(__dirname, "../../../docs", relPath);

    if (!fs.existsSync(fullPath)) {
      console.warn(`  [MISSING] Local file not found for ${m.name}: ${fullPath}`);
      missingCount++;
      continue;
    }

    const ext = path.extname(fullPath).toLowerCase();
    const mimeType = MIME_MAP[ext] || "image/webp";
    const fileBuffer = fs.readFileSync(fullPath);

    try {
      const s3Key = await s3.putImage(fileBuffer, mimeType);
      const { error: updateErr } = await supabase
        .from(MEMBERS_TABLE)
        .update({ image: s3Key, updated_at: new Date().toISOString() })
        .eq("id", m.id);

      if (updateErr) {
        console.error(`  [ERROR] Failed to update DB for ${m.name}:`, updateErr);
        await s3.removeImage(s3Key);
        throw updateErr;
      }

      uploadedCount++;
      console.log(`  [OK] Uploaded ${m.name} (${m.panel}): ${m.image} -> ${s3Key}`);
    } catch (err) {
      console.error(`  [FAIL] Error processing ${m.name}:`, err);
      throw err;
    }
  }

  console.log("\n--- S3 Image Migration Summary ---");
  console.log(`Successfully uploaded & updated: ${uploadedCount}`);
  console.log(`Skipped (no image or already S3): ${skippedCount}`);
  console.log(`Missing local files: ${missingCount}`);
  console.log(`Total members: ${members.length}`);
}

if (require.main === module) {
  uploadMemberImages()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}

module.exports = { uploadMemberImages };
