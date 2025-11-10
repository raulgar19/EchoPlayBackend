const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { uploadFile } = require("../config/googleDrive");
const { uploadSong } = require("../middleware/upload");

// Función para asegurar formato correcto de URL de Google Drive
function formatGDriveUrl(url) {
  if (!url) return null;

  // Si ya está en formato correcto
  if (url.includes("uc?export=view&id=")) return url;

  // Extraer ID de diferentes formatos de URL de Google Drive
  let fileId = null;

  // Formato: https://drive.google.com/file/d/FILE_ID/view
  const match1 = url.match(/\/file\/d\/([^\/]+)/);
  if (match1) fileId = match1[1];

  // Formato: https://drive.google.com/open?id=FILE_ID
  const match2 = url.match(/[?&]id=([^&]+)/);
  if (match2) fileId = match2[1];

  // Si encontramos el ID, devolver formato correcto
  if (fileId) {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  // Si no se pudo convertir, devolver original
  return url;
}

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM songs");
    const songs = result.rows.map((song) => ({
      id: song.id,
      name: song.name,
      artist: song.artist,
      cover: formatGDriveUrl(song.cover),
      file: formatGDriveUrl(song.file),
    }));
    res.json(songs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener canciones" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM songs WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Canción no encontrada" });
    }
    const song = result.rows[0];
    res.json({
      id: song.id,
      name: song.name,
      artist: song.artist,
      cover: formatGDriveUrl(song.cover),
      file: formatGDriveUrl(song.file),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener canción" });
  }
});

router.post("/check", async (req, res) => {
  try {
    const { title, artist } = req.body;
    const result = await pool.query(
      "SELECT * FROM songs WHERE name = $1 AND artist = $2",
      [title, artist]
    );
    res
      .type("text/plain")
      .send(result.rows.length > 0 ? "exists" : "not exists");
  } catch (err) {
    console.error(err);
    res.status(500).type("text/plain").send("Error");
  }
});

router.post("/upload", uploadSong, async (req, res) => {
  try {
    const { title, artist } = req.body;

    // Verificar que se recibieron los archivos
    if (!req.files || !req.files.cover || !req.files.audio) {
      return res
        .status(400)
        .json({ error: "Faltan archivos (cover y audio requeridos)" });
    }

    if (!title || !artist) {
      return res
        .status(400)
        .json({ error: "Faltan datos (title y artist requeridos)" });
    }

    const coverFile = req.files.cover[0];
    const audioFile = req.files.audio[0];

    // Subir portada a Google Drive
    const coverUrl = await uploadFile(
      coverFile.buffer,
      `${Date.now()}_${coverFile.originalname}`,
      coverFile.mimetype,
      "covers"
    );

    // Subir audio a Google Drive
    const audioUrl = await uploadFile(
      audioFile.buffer,
      `${Date.now()}_${audioFile.originalname}`,
      audioFile.mimetype,
      "songs"
    );

    // Guardar en base de datos
    const result = await pool.query(
      "INSERT INTO songs (name, artist, cover, file) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, artist, coverUrl, audioUrl]
    );

    res.status(201).json({
      message: "Canción añadida exitosamente",
      song: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al guardar canción: " + err.message });
  }
});

module.exports = router;
