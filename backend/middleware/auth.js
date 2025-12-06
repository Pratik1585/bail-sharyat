// middleware/auth.js
const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ ok: false, error: "Login required" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // payload मध्ये { id, name, mobile } असेल
    req.user = payload;
    next();
  } catch (err) {
    console.error("JWT error:", err.message);
    return res.status(401).json({ ok: false, error: "Invalid token" });
  }
}

module.exports = requireAuth;
