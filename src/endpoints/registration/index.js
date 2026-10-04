const express = require("express");
const { submitRegistration } = require("./registration.service");

const router = express.Router();

router.post("/api/public/registration", async (req, res) => {
  const clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const result = await submitRegistration(req.body, clientIp);
  if (result.status !== 200) {
    console.error("registration failed:", result.field, "status:", result.status);
  }
  return res.status(result.status).end();
});

module.exports = router;
