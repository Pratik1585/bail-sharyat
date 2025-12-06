// routes/bullRoutes.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const multer = require("multer");
const path = require("path");
const requireAuth = require("../middleware/auth");

// ---------- Multer setup (multiple photos) ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName =
      Date.now() + "-" + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
});

// ---------- GET: सर्व बैल ----------
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM bulls ORDER BY created_at DESC"
    );
    return res.json({ ok: true, data: rows });
  } catch (err) {
    console.error("Error fetching bulls:", err.message);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// ---------- GET: एकच बैल ----------
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM bulls WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Bull not found" });
    }

    return res.json({ ok: true, data: rows[0] });
  } catch (err) {
    console.error("Error fetching bull:", err.message);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// ---------- POST: नवीन बैल (LOGIN REQUIRED, multiple photos) ----------
router.post("/", requireAuth, upload.array("photos", 6), async (req, res) => {
  try {
    const body = req.body;
    const userId = req.user.id; // JWT मधून आलेले

    const name = body.name;
    const age_years = body.age_years ? Number(body.age_years) : null;
    const weight_kg = body.weight_kg ? Number(body.weight_kg) : null;
    const color = body.color || null;
    const price = body.price ? Number(body.price) : null;
    const district = body.district;
    const taluka = body.taluka || null;
    const village = body.village || null;

    const has_race_exp =
      body.has_race_exp === "true" ||
      body.has_race_exp === "1" ||
      body.has_race_exp === 1 ||
      body.has_race_exp === "on" ||
      body.has_race_exp === true;

    const races_count = body.races_count ? Number(body.races_count) : 0;
    const best_position = body.best_position || null;
    const description = body.description || null;
    const contact_phone = body.contact_phone;
    const video_url = body.video_url || null; // video link

    if (!name || !price || !district || !contact_phone) {
      return res.status(400).json({
        ok: false,
        error: "name, price, district, contact_phone हे आवश्यक आहेत.",
      });
    }

    // multiple photos → first main_photo, बाकी सर्व photos_json मध्ये
    let main_photo = null;
    let photos = [];

    if (req.files && req.files.length > 0) {
      photos = req.files.map((f) => "uploads/" + f.filename);
      main_photo = photos[0]; // पहिला फोटो main
    }

    const photos_json = photos.length ? JSON.stringify(photos) : null;

    const [result] = await db.query(
      `INSERT INTO bulls 
       (user_id, name, age_years, weight_kg, color, price, district, taluka, village,
        has_race_exp, races_count, best_position, description, contact_phone,
        main_photo, video_url, photos_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name,
        age_years,
        weight_kg,
        color,
        price,
        district,
        taluka,
        village,
        has_race_exp ? 1 : 0,
        races_count,
        best_position,
        description,
        contact_phone,
        main_photo,
        video_url,
        photos_json,
      ]
    );

    return res.json({
      ok: true,
      message: "Bail successfully added",
      id: result.insertId,
    });
  } catch (err) {
    console.error("Error adding bull:", err.message);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// ---------- PUT: Bail edit (फोटो बदलत नाही, बाकी details update) ----------
router.put("/:id", requireAuth, async (req, res) => {
  try {
    const bullId = req.params.id;
    const userId = req.user.id;

    const [rows] = await db.query(
      "SELECT id, user_id FROM bulls WHERE id = ?",
      [bullId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Bull not found" });
    }
    if (rows[0].user_id !== userId) {
      return res
        .status(403)
        .json({ ok: false, error: "तुम्ही इतरांचा bail edit करू शकत नाही." });
    }

    const body = req.body;

    const name = body.name;
    const age_years = body.age_years ? Number(body.age_years) : null;
    const weight_kg = body.weight_kg ? Number(body.weight_kg) : null;
    const color = body.color || null;
    const price = body.price ? Number(body.price) : null;
    const district = body.district;
    const taluka = body.taluka || null;
    const village = body.village || null;
    const has_race_exp =
      body.has_race_exp === "true" ||
      body.has_race_exp === "1" ||
      body.has_race_exp === 1 ||
      body.has_race_exp === true;
    const races_count = body.races_count ? Number(body.races_count) : 0;
    const best_position = body.best_position || null;
    const description = body.description || null;
    const contact_phone = body.contact_phone;
    const video_url = body.video_url || null;

    if (!name || !price || !district || !contact_phone) {
      return res.status(400).json({
        ok: false,
        error: "name, price, district, contact_phone हे आवश्यक आहेत.",
      });
    }

    await db.query(
      `UPDATE bulls
       SET name = ?, age_years = ?, weight_kg = ?, color = ?, price = ?,
           district = ?, taluka = ?, village = ?,
           has_race_exp = ?, races_count = ?, best_position = ?,
           description = ?, contact_phone = ?, video_url = ?
       WHERE id = ?`,
      [
        name,
        age_years,
        weight_kg,
        color,
        price,
        district,
        taluka,
        village,
        has_race_exp ? 1 : 0,
        races_count,
        best_position,
        description,
        contact_phone,
        video_url,
        bullId,
      ]
    );

    return res.json({ ok: true, message: "Bail updated successfully" });
  } catch (err) {
    console.error("Error updating bull:", err.message);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

// ---------- DELETE: Bail delete ----------
router.delete("/:id", requireAuth, async (req, res) => {
  try {
    const bullId = req.params.id;
    const userId = req.user.id;

    const [rows] = await db.query(
      "SELECT id, user_id FROM bulls WHERE id = ?",
      [bullId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ ok: false, error: "Bull not found" });
    }
    if (rows[0].user_id !== userId) {
      return res
        .status(403)
        .json({ ok: false, error: "तुम्ही इतरांचा bail delete करू शकत नाही." });
    }

    await db.query("DELETE FROM bulls WHERE id = ?", [bullId]);

    return res.json({ ok: true, message: "Bail deleted successfully" });
  } catch (err) {
    console.error("Error deleting bull:", err.message);
    return res.status(500).json({ ok: false, error: "Server error" });
  }
});

module.exports = router;
