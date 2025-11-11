const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const { getAuthClient } = require("../config/oauth");

// Endpoint para servir archivos de audio desde Google Drive
router.get("/audio/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    console.log("Solicitando audio:", fileId);

    const auth = await getAuthClient();
    const drive = google.drive({ version: "v3", auth });

    // Obtener metadatos del archivo para conocer el tipo MIME y tamaño
    const metadata = await drive.files.get({
      fileId: fileId,
      fields: "mimeType, name, size",
    });

    console.log(
      "Archivo:",
      metadata.data.name,
      "Tipo:",
      metadata.data.mimeType,
      "Tamaño:",
      metadata.data.size
    );

    // Establecer headers apropiados para streaming de audio
    res.setHeader("Content-Type", metadata.data.mimeType || "audio/mpeg");
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Range");

    // Importante: enviar el tamaño del archivo
    if (metadata.data.size) {
      res.setHeader("Content-Length", metadata.data.size);
    }

    // Obtener el archivo como stream
    const file = await drive.files.get(
      { fileId: fileId, alt: "media" },
      { responseType: "stream" }
    );

    // Pipe el stream directamente a la respuesta
    file.data
      .on("error", (err) => {
        console.error("Error al transmitir audio:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error al obtener el archivo" });
        }
      })
      .pipe(res);
  } catch (error) {
    console.error("Error al obtener audio de Drive:", error);
    res.status(500).json({ error: "Error al obtener el archivo de audio" });
  }
});

// Endpoint para servir imágenes desde Google Drive
router.get("/image/:fileId", async (req, res) => {
  try {
    const { fileId } = req.params;
    console.log("Solicitando imagen:", fileId);

    const auth = await getAuthClient();
    const drive = google.drive({ version: "v3", auth });

    // Obtener metadatos del archivo
    const metadata = await drive.files.get({
      fileId: fileId,
      fields: "mimeType, name, size",
    });

    // Establecer headers para imagen
    res.setHeader("Content-Type", metadata.data.mimeType || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400"); // Cache por 1 día
    res.setHeader("Access-Control-Allow-Origin", "*");

    if (metadata.data.size) {
      res.setHeader("Content-Length", metadata.data.size);
    }

    // Obtener el archivo como stream
    const file = await drive.files.get(
      { fileId: fileId, alt: "media" },
      { responseType: "stream" }
    );

    // Pipe el stream a la respuesta
    file.data
      .on("error", (err) => {
        console.error("Error al transmitir imagen:", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "Error al obtener la imagen" });
        }
      })
      .pipe(res);
  } catch (error) {
    console.error("Error al obtener imagen de Drive:", error);
    res.status(500).json({ error: "Error al obtener la imagen" });
  }
});

module.exports = router;
