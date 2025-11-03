const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { HOST } = require("../config/constants");
const { uploadSong } = require("../middleware/upload");

// Obtener todas las canciones
router.get("/", async (req, res) => {
  try {
    console.log("Obteniendo canciones...");
    const result = await pool.query("SELECT * FROM songs");

    const songs = result.rows.map((song) => ({
      id: song.id,
      name: song.name,
      artist: song.artist,
      cover: `${HOST}/covers/${song.cover}`,
      file: `${HOST}/music/${song.file}`,
    }));

    console.log("Canciones obtenidas correctamente");
    res.json(songs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al las canciones" });
  }
});

// Obtener una canción por ID
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`Obteniendo canción con ID: ${id}...`);
    const result = await pool.query("SELECT * FROM songs WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Canción no encontrada" });
    }

    const song = result.rows[0];
    const songData = {
      id: song.id,
      name: song.name,
      artist: song.artist,
      cover: `${HOST}/covers/${song.cover}`,
      file: `${HOST}/music/${song.file}`,
    };

    console.log("Canción obtenida correctamente");
    res.json(songData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener la canción" });
  }
});

// Comprobar si la canción ya existe
router.post("/check", async (req, res) => {
  const { title, artist } = req.body;

  if (!title || !artist) {
    console.error("Faltan datos para la comprobación");
    return res.status(400).type("text/plain").send("Error: faltan datos");
  }

  try {
    const result = await pool.query(
      "SELECT * FROM songs WHERE name = $1 AND artist = $2",
      [title, artist]
    );

    if (result.rows.length > 0) {
      console.log(`La canción "${title}" de "${artist}" ya existe`);
      res.type("text/plain").send("exists");
    } else {
      console.log(`La canción "${title}" de "${artist}" no existe`);
      res.type("text/plain").send("not exists");
    }
  } catch (err) {
    console.error("Error al comprobar la canción:", err);
    res.status(500).type("text/plain").send("Error al comprobar la canción");
  }
});

// Subir canción
router.post(
  "/upload",
  uploadSong.fields([
    { name: "cover", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  async (req, res) => {
    console.log("Recibiendo archivos...");

    const { title, artist } = req.body;
    const coverFile = req.files.cover ? req.files.cover[0].filename : null;
    const audioFile = req.files.audio ? req.files.audio[0].filename : null;

    if (!title || !artist || !coverFile || !audioFile) {
      console.error("Error: faltan datos requeridos");
      return res
        .status(400)
        .type("text/plain")
        .send("Error: faltan datos requeridos");
    }

    console.log("Archivos recibidos con éxito");

    try {
      console.log("Añadiendo información en la base de datos...");
      const result = await pool.query(
        "INSERT INTO songs (name, artist, cover, file) VALUES ($1, $2, $3, $4) RETURNING *",
        [title, artist, coverFile, audioFile]
      );
      console.log("Información añadida con éxito");

      res.status(201).type("text/plain").send("Canción subida con éxito");

      console.log("Carga de archivos concluida satisfactoriamente");
    } catch (err) {
      console.error("Error al añadir información en la base de datos:", err);
      res.status(500).type("text/plain").send("Error al guardar la canción");
    }
  }
);

module.exports = router;
