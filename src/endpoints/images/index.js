const express = require("express");
const s3 = require("../../storage/s3");
const { publicImagesRateLimit } = require("../../middleware/rate-limit.middleware");

const router = express.Router();
const KEY_RE = /^members\/[a-zA-Z0-9._-]+\.(webp|jpg|jpeg|png)$/i;

async function handleGetImage(req, res, key) {
  if (!KEY_RE.test(key)) {
    return res.status(404).end();
  }

  try {
    const item = await s3.getImageStream(key);
    if (!item) {
      return res.status(404).end();
    }

    // Set cache & content headers
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    if (item.contentType) res.setHeader("Content-Type", item.contentType);
    if (item.contentLength) res.setHeader("Content-Length", item.contentLength);
    if (item.etag) res.setHeader("ETag", item.etag);
    if (item.lastModified) res.setHeader("Last-Modified", item.lastModified.toUTCString());

    // Check If-None-Match (ETag)
    const clientEtag = req.headers["if-none-match"];
    if (clientEtag && item.etag) {
      const cleanClient = clientEtag.replace(/^W\//, "").trim();
      const cleanServer = item.etag.replace(/^W\//, "").trim();
      if (cleanClient === cleanServer || cleanClient === cleanServer.replace(/^"|"$/g, "")) {
        if (typeof item.stream?.destroy === "function") item.stream.destroy();
        return res.status(304).end();
      }
    }

    // Check If-Modified-Since
    const ifModifiedSince = req.headers["if-modified-since"];
    if (ifModifiedSince && item.lastModified) {
      const clientTime = new Date(ifModifiedSince).getTime();
      const serverTime = Math.floor(item.lastModified.getTime() / 1000) * 1000;
      if (!isNaN(clientTime) && serverTime <= clientTime) {
        if (typeof item.stream?.destroy === "function") item.stream.destroy();
        return res.status(304).end();
      }
    }

    // Stream image bytes
    item.stream.on("error", (err) => {
      console.error("image stream error:", key, err);
      if (!res.headersSent) res.status(500).end();
    });

    item.stream.pipe(res);
  } catch (err) {
    console.error("fetch image error:", key, err);
    if (!res.headersSent) {
      res.status(typeof err.status === "number" ? err.status : 500).end();
    }
  }
}

// Support /api/images/members/:filename and regex match for /api/images/*
router.get("/api/images/members/:filename", publicImagesRateLimit, (req, res) => {
  const key = `members/${req.params.filename}`;
  return handleGetImage(req, res, key);
});

router.get(/^\/api\/images\/(.+)$/, publicImagesRateLimit, (req, res) => {
  const key = req.params[0] || "";
  return handleGetImage(req, res, key);
});

module.exports = router;
