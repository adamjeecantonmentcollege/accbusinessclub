const express = require("express");
const multer = require("multer");
const { requireAdmin } = require("../../middleware/auth.middleware");
const { publicMembersRateLimit } = require("../../middleware/rate-limit.middleware");
const service = require("./members.service");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

function send(res, r) {
  if (r.errors) return res.status(r.status).json({ errors: r.errors });
  if (r.members) return res.status(r.status).json(r.members);
  if (r.member) return res.status(r.status).json(r.member);
  if (r.image) return res.status(r.status).json({ image: r.image });
  return res.status(r.status).end();
}

function handle(fn) {
  return (req, res) => {
    fn(req)
      .then((r) => send(res, r))
      .catch((e) => {
        console.error("members error:", e);
        res.status(typeof e.status === "number" ? e.status : 500).end();
      });
  };
}

// Public read endpoints (rate limited with browser fingerprinting)
router.get("/api/public/members", publicMembersRateLimit, handle((req) => service.list(req.query)));
router.get("/api/members", publicMembersRateLimit, handle((req) => service.list(req.query)));

// Protected write endpoints
router.post("/api/members", requireAdmin, handle((req) => service.create(req.body)));
router.put("/api/members/:id", requireAdmin, handle((req) => service.update(req.params.id, req.body)));
router.delete("/api/members/:id", requireAdmin, handle((req) => service.remove(req.params.id)));

router.post("/api/members/:id/image", requireAdmin, (req, res) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      const msg = err.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5 MB or smaller."
        : "Invalid upload — send multipart form data with field 'image'.";
      return res.status(400).json({ errors: [{ field: "image", err: msg }] });
    }
    service.setImage(req.params.id, req.file)
      .then((r) => send(res, r))
      .catch((e) => {
        console.error("members image error:", e);
        res.status(typeof e.status === "number" ? e.status : 500).end();
      });
  });
});

module.exports = router;
