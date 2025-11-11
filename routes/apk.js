const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { uploadFile } = require("../config/googleDrive");
const { uploadApk } = require("../middleware/upload");

router.post("/upload", uploadApk, async (req, res) => {
  try {
    const { version } = req.body;

    // Verificar que se recibió el archivo
    if (!req.file) {
      return res.status(400).json({ error: "Se requiere un archivo APK" });
    }

    if (!version) {
      return res.status(400).json({ error: "Se requiere 'version'" });
    }

    const apkFile = req.file;

    // Subir APK a Google Drive
    const apkUrl = await uploadFile(
      apkFile.buffer,
      `echoplay_v${version}_${Date.now()}.apk`,
      apkFile.mimetype,
      "apks"
    );

    // Guardar en base de datos (actualiza si la versión ya existe)
    const result = await pool.query(
      "INSERT INTO apks (version, url) VALUES ($1, $2) ON CONFLICT (version) DO UPDATE SET url = $2 RETURNING *",
      [version, apkUrl]
    );

    res.status(201).json({
      message: "APK registrada exitosamente",
      apk: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al registrar APK: " + err.message });
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
