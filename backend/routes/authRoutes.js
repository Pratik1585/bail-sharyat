// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// helper: token तयार करणे
function createToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, mobile: user.mobile },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  try {
    const { name, mobile, password } = req.body;

    if (!name || !mobile || !password) {
      return res
        .status(400)
        .json({ ok: false, error: "name, mobile, password आवश्यक आहेत." });
    }

    // mobile unique आहे का बघ
    const [existing] = await db.query(
      "SELECT id FROM users WHERE mobile = ?",
      [mobile]
    );
    if (existing.length > 0) {
      return res
        .status(400)
        .json({ ok: false, error: "या mobile वर account आधीच आहे." });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "INSERT INTO users (name, mobile, password_hash) VALUES (?, ?, ?)",
      [name, mobile, hash]
    );

    const user = { id: result.insertId, name, mobile };
    const token = createToken(user);

    return res.json({ ok: true, token, user });
  } catch (err) {
    console.error("Signup error:", err.message);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res
        .status(400)
        .json({ ok: false, error: "mobile आणि password द्या." });
    }

    const [rows] = await db.query(
      "SELECT * FROM users WHERE mobile = ?",
      [mobile]
    );
    if (rows.length === 0) {
      return res
        .status(400)
        .json({ ok: false, error: "हा mobile नोंदणीकृत नाही." });
    }

    const userRow = rows[0];
    const match = await bcrypt.compare(password, userRow.password_hash);
    if (!match) {
      return res
        .status(400)
        .json({ ok: false, error: "Password चुकीचा आहे." });
    }

    const user = { id: userRow.id, name: userRow.name, mobile: userRow.mobile };
    const token = createToken(user);

    return res.json({ ok: true, token, user });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

module.exports = router;
