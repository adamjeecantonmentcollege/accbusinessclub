const express = require("express");

// Registered BEFORE the CORS middleware so the response carries no
// Access-Control-* headers and no preflight handling — plain GET only.
const router = express.Router();

router.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

module.exports = router;
