require("dotenv").config();

const PORT = parseInt(process.env.PORT || "3000", 10);
const CF_SECRET = process.env.CF_SECRET || "1x000000000000000000000000000000AA";
const RAW_ORIGINS = process.env.ORIGINS || "http://localhost:3000,https://accbusinessclub.asayman.xyz";
const ALLOWED_ORIGINS = RAW_ORIGINS.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
const SUPABASE_URL = process.env.SUPABASE_BASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_SECRET || "";
const REGISTRATION_TABLE = process.env.SUPABASE_REGISTRATION_TABLE_NAME || "registrations";
const SUPABASE_ENABLED = Boolean(SUPABASE_URL && SUPABASE_KEY);

const RAW_PING_TARGETS = process.env.AUTO_PING_TARGETS || "";
const AUTO_PING_TARGETS = RAW_PING_TARGETS.split(",")
  .map((entry) => entry.trim())
  .filter(Boolean)
  .map((entry) => (/^[a-z][a-z0-9+.-]*:\/\//i.test(entry) ? entry : `https://${entry}`));

const MEMBERS_TABLE = process.env.SUPABASE_MEMBERS_TABLE_NAME || "members";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "";
const S3_ENDPOINT = (process.env.S3_ENDPOINT || "").replace(/\/$/, "");
const S3_REGION = process.env.S3_REGION || "ap-northeast-1";
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID || "";
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY || "";
const S3_BUCKET = process.env.S3_BUCKET || "";
const S3_PUBLIC_BASE_URL = (process.env.S3_PUBLIC_BASE_URL || "").replace(/\/$/, "");

module.exports = {
  PORT,
  CF_SECRET,
  ALLOWED_ORIGINS,
  SUPABASE_URL,
  SUPABASE_KEY,
  REGISTRATION_TABLE,
  SUPABASE_ENABLED,
  AUTO_PING_TARGETS,
  MEMBERS_TABLE,
  ADMIN_TOKEN,
  S3_ENDPOINT,
  S3_REGION,
  S3_ACCESS_KEY_ID,
  S3_SECRET_ACCESS_KEY,
  S3_BUCKET,
  S3_PUBLIC_BASE_URL,
};
