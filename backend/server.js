// server.js
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const db = require("./db");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// uploads static
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// routes
const bullRoutes = require("./routes/bullRoutes");
const authRoutes = require("./routes/authRoutes");

app.use("/api/bulls", bullRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Bail Market API running ✅");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
