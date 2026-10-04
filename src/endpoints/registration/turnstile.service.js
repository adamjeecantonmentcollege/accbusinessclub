const { CF_SECRET } = require("../../config/env");

async function verifyTurnstileToken(token, remoteIp) {
  if (!token || typeof token !== "string" || !token.trim()) return false;
  if (CF_SECRET === "1x000000000000000000000000000000AA" || CF_SECRET.startsWith("1x00000") || token === "XXXX.DUMMY.TOKEN.XXXX" || token.startsWith("XXXX.")) return true;
  try {
    const formData = new URLSearchParams();
    formData.append("secret", CF_SECRET);
    formData.append("response", token.trim());
    if (remoteIp) formData.append("remoteip", remoteIp);
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: formData, headers: { "Content-Type": "application/x-www-form-urlencoded" } });
    if (!response.ok) return false;
    const data = await response.json();
    return Boolean(data.success);
  } catch (err) {
    console.error("Turnstile verification error:", err.message);
    return false;
  }
}

module.exports = { verifyTurnstileToken };
