const express = require("express");
const router = express.Router();
const pool = require("../config/database");

router.post("/upload", async (req, res) => {
  try {
    const { version, apkUrl } = req.body;
    if (!version || !apkUrl) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }
    const result = await pool.query(
      "INSERT INTO apks (version, url) VALUES ($1, $2) ON CONFLICT (version) DO UPDATE SET url = $2 RETURNING *",
      [version, apkUrl]
    );
    res.status(201).json({ message: "APK registrada", apk: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar APK" });
  }
});

router.get("/download/:version", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM apks WHERE version = $1", [
      req.params.version,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "APK no encontrada" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error" });
  }
});

router.get("/list", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM apks ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al listar APKs" });
  }
});

router.get("/version", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM apks ORDER BY id DESC LIMIT 1"
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "No hay APKs" });
    }
    res.json({
      latest_version: result.rows[0].version,
      url: result.rows[0].url,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error" });
  }
});

module.exports = router;
