const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { HOST, FILES_BASE } = require("../config/constants");
const { uploadApk } = require("../middleware/upload");

// Subir APK
router.post("/upload", uploadApk.single("apk"), (req, res) => {
  console.log("Solicitud recibida para subir APK");

  if (!req.file) {
    console.warn("Archivo APK no recibido o formato incorrecto");
    return res
      .status(400)
      .json({ error: "Archivo APK no recibido o formato incorrecto" });
  }

  console.log(`APK subida correctamente: ${req.file.filename}`);
  res.status(201).json({
    message: `APK subida correctamente como ${req.file.filename}`,
    file: req.file.filename,
  });
});

// Descargar APK
router.get("/download/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(FILES_BASE, "apks", filename);

  console.log(`Ruta absoluta del archivo: ${filePath}`);

  if (!fs.existsSync(filePath)) {
    console.warn(`Archivo APK no encontrado: ${filename}`);
    return res.status(404).json({ error: "Archivo APK no encontrado" });
  }

  res.download(filePath, filename, (err) => {
    if (err) {
      console.error(`Error al descargar APK ${filename}:`, err);
      res.status(500).json({ error: "Error al descargar APK" });
    } else {
      console.log(`APK descargada correctamente: ${filename}`);
    }
  });
});

// Listar todas las APKs
router.get("/list", (req, res) => {
  console.log("Solicitud recibida para listar todas las APKs");

  const apkFolder = path.join(FILES_BASE, "apks");

  if (!fs.existsSync(apkFolder)) {
    console.warn("Carpeta de APKs no encontrada");
    return res.status(404).json({ error: "Carpeta de APKs no encontrada" });
  }

  const files = fs
    .readdirSync(apkFolder)
    .filter((file) => file.endsWith(".apk"));
  console.log(`Archivos APK encontrados: ${files.join(", ")}`);

  if (files.length === 0) {
    console.warn("No hay APKs disponibles");
    return res.status(404).json({ error: "No hay APKs disponibles" });
  }

  // Devolver lista de archivos con URL para descarga
  const apkList = files.map((file) => ({
    name: file,
    url: `${HOST}/apk/${file}`,
  }));

  console.log("Lista de APKs enviada correctamente");
  res.json(apkList);
});

// Endpoint de versión de la app
router.get("/version", (req, res) => {
  const apkFolder = path.join(FILES_BASE, "apks");

  if (!fs.existsSync(apkFolder))
    return res.status(404).json({ error: "Carpeta de APK no encontrada" });

  const files = fs.readdirSync(apkFolder).filter((f) => f.endsWith(".apk"));
  if (files.length === 0)
    return res.status(404).json({ error: "No hay APKs disponibles" });

  files.sort((a, b) => {
    const versionA = a
      .replace("echoplay-", "")
      .replace(".apk", "")
      .split(".")
      .map(Number);
    const versionB = b
      .replace("echoplay-", "")
      .replace(".apk", "")
      .split(".")
      .map(Number);
    for (let i = 0; i < Math.max(versionA.length, versionB.length); i++) {
      const diff = (versionB[i] || 0) - (versionA[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  });

  const latestApk = files[0];
  res.json({
    latest_version: latestApk.replace("echoplay-", "").replace(".apk", ""),
    apk_url: `${HOST}/apk/${latestApk}`,
  });
});

module.exports = router;
