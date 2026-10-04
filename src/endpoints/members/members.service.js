const repo = require("../../db/repositories/members.repo");
const s3 = require("../../storage/s3");
const { validateMemberWrite } = require("./members.validator");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function e400(errors) { return { status: 400, errors }; }
function e404() { return { status: 404 }; }

async function create(body) {
  const v = validateMemberWrite(body, { partial: false });
  if (!v.ok) return e400(v.errors);
  const member = await repo.insert(v.value);
  return { status: 201, member };
}

async function update(id, body) {
  if (!UUID_RE.test(String(id))) return e404();
  const v = validateMemberWrite(body, { partial: true });
  if (!v.ok) return e400(v.errors);
  const existing = await repo.getById(id);
  if (!existing) return e404();
  const merged = { ...existing, ...v.value };
  if (merged.panel === "alumni" && !merged.year) {
    return e400([{ field: "year", err: "Graduation year is required for alumni." }]);
  }
  await repo.update(id, v.value);
  return { status: 200 };
}

async function remove(id) {
  if (!UUID_RE.test(String(id))) return e404();
  const existing = await repo.getById(id);
  if (!existing) return e404();
  await s3.removeImage(existing.image);
  await repo.remove(id);
  return { status: 204 };
}

async function setImage(id, file) {
  if (!UUID_RE.test(String(id))) return e404();
  if (!file) {
    return e400([{ field: "image", err: "Upload a webp/jpeg/png file (≤5 MB) as multipart form field 'image'." }]);
  }
  if (!s3.EXT[file.mimetype]) {
    return e400([{ field: "image", err: "Only webp, jpeg and png images are accepted." }]);
  }
  const existing = await repo.getById(id);
  if (!existing) return e404();
  const key = await s3.putImage(file.buffer, file.mimetype);
  try {
    await repo.update(id, { image: key });
  } catch (e) {
    await s3.removeImage(key);
    throw e;
  }
  await s3.removeImage(existing.image);
  return { status: 200, image: key };
}

const PANELS = new Set(["executive", "teacher", "advisor", "alumni"]);

async function list(query = {}) {
  const { panel, year, limit } = query;
  if (panel && !PANELS.has(panel)) {
    return e400([{ field: "panel", err: "Panel must be executive, teacher, advisor or alumni." }]);
  }
  if (year) {
    const y = Number(year);
    if (!Number.isInteger(y) || y < 2000 || y > 2100) {
      return e400([{ field: "year", err: "Year must be a whole number between 2000 and 2100." }]);
    }
  }
  const members = await repo.list({ panel, year, limit });
  return { status: 200, members };
}

module.exports = { list, create, update, remove, setImage };
