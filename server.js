const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const HOST = "192.168.1.36"; // 192.168.1.36     10.0.2.2

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  host: "localhost",
  user: "echoplay",
  password: "echoplay",
  database: "echoplay",
  port: 55432,
});

// Servir carpeta de imágenes, covers y archivos de audio
app.use("/covers", express.static(path.join(__dirname, "covers")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/music", express.static(path.join(__dirname, "music")));

// Endpoint que obtiene todos los usuarios
app.get("/users", async (req, res) => {
  try {
    console.log("Obteniendo usuarios...");
    const result = await pool.query("SELECT * FROM users");

    const usuarios = result.rows.map((usuario) => ({
      id: usuario.id,
      name: usuario.name,
      image: `http://${HOST}:${PORT}/images/${usuario.image_file}`,
    }));

    console.log("Usuarios obtenidos correctamente");

    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener los usuarios" });
  }
});

// Endpoint para obtener las playlists de un usuario
app.get("/users/:userId/playlists", async (req, res) => {
  const { userId } = req.params;

  try {
    console.log(`Obteniendo playlists del usuario con ID: ${userId}...`);

    // Solo seleccionamos los campos necesarios
    const result = await pool.query(
      "SELECT id, name, user_id FROM playlists WHERE user_id = $1",
      [userId]
    );

    const playlists = result.rows.map((playlist) => ({
      id: playlist.id,
      name: playlist.name,
      userId: playlist.user_id,
    }));

    console.log("Playlists obtenidas correctamente");
    res.json(playlists);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Error al obtener las playlists del usuario" });
  }
});

// Endpoint para crear una nueva playlist
app.post("/playlists", async (req, res) => {
  console.log("Obteniendo y añadiendo nueva playlist...");

  const { name, userId } = req.body;

  if (!name || !userId) {
    return res.status(400).json({ error: "Se requiere 'name' y 'userId'" });
  }

  try {
    console.log(`Creando nueva playlist para el usuario con ID: ${userId}...`);

    const result = await pool.query(
      "INSERT INTO playlists (name, user_id) VALUES ($1, $2) RETURNING id, name, user_id",
      [name, userId]
    );

    const newPlaylist = result.rows[0];

    console.log("Playlist creada correctamente");
    res.status(201).json({
      id: newPlaylist.id,
      name: newPlaylist.name,
      userId: newPlaylist.user_id,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear la playlist" });
  }
});

// Endpoint para añadir una canción a una playlist
app.post("/playlists/:playlistId/songs", async (req, res) => {
  const { playlistId } = req.params;
  const { songId } = req.body;

  if (!songId) {
    return res.status(400).json({ error: "Se requiere 'songId'" });
  }

  try {
    console.log(
      `Añadiendo canción con ID ${songId} a la playlist ${playlistId}...`
    );

    // Comprobar si ya existe la relación
    const exists = await pool.query(
      "SELECT * FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2",
      [playlistId, songId]
    );

    if (exists.rows.length > 0) {
      console.log("La canción ya existe en la playlist, no se hace nada");
      return res
        .status(200)
        .json({ message: "La canción ya está en la playlist" });
    }

    // Si no existe, insertar
    const result = await pool.query(
      "INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2) RETURNING *",
      [playlistId, songId]
    );

    console.log("Canción añadida correctamente a la playlist");
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al añadir la canción a la playlist" });
  }
});

// Endpoint para obtener las canciones de una playlist específica
app.get("/playlists/:playlistId/songs", async (req, res) => {
  const { playlistId } = req.params;

  try {
    console.log(`Obteniendo canciones de la playlist con ID: ${playlistId}...`);

    // Consulta que une playlist_songs con songs para obtener los datos de las canciones
    const result = await pool.query(
      `SELECT s.id, s.name, s.artist, s.cover, s.file
       FROM playlist_songs ps
       JOIN songs s ON ps.song_id = s.id
       WHERE ps.playlist_id = $1`,
      [playlistId]
    );

    const songs = result.rows.map((song) => ({
      id: song.id,
      name: song.name,
      artist: song.artist,
      cover: `http://${HOST}:${PORT}/covers/${song.cover}`,
      file: `http://${HOST}:${PORT}/music/${song.file}`,
    }));

    console.log("Canciones de la playlist obtenidas correctamente");
    res.json(songs);
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Error al obtener las canciones de la playlist" });
  }
});

// Endpoint para eliminar una canción de una playlist
app.delete("/playlists/:playlistId/songs/:songId", async (req, res) => {
  const { playlistId, songId } = req.params;

  try {
    console.log(
      `Eliminando canción con ID ${songId} de la playlist ${playlistId}...`
    );

    const result = await pool.query(
      "DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2 RETURNING *",
      [playlistId, songId]
    );

    if (result.rows.length === 0) {
      console.log("La canción no estaba en la playlist");
      return res
        .status(404)
        .json({ message: "La canción no se encontró en la playlist" });
    }

    console.log("Canción eliminada correctamente de la playlist");
    res.status(200).json({ message: "Canción eliminada de la playlist" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ error: "Error al eliminar la canción de la playlist" });
  }
});

app.get("/songs", async (req, res) => {
  try {
    console.log("Obteniendo canciones...");
    const result = await pool.query("SELECT * FROM songs");

    const songs = result.rows.map((song) => ({
      id: song.id,
      name: song.name,
      artist: song.artist,
      cover: `http://${HOST}:${PORT}/covers/${song.cover}`,
      file: `http://${HOST}:${PORT}/music/${song.file}`,
    }));

    console.log("Canciones obtenidas correctamente");

    res.json(songs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al las canciones" });
  }
});

// Endpoint para obtener una canción por ID
app.get("/songs/:id", async (req, res) => {
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
      cover: `http://${HOST}:${PORT}/covers/${song.cover}`,
      file: `http://${HOST}:${PORT}/music/${song.file}`,
    };

    console.log("Canción obtenida correctamente");
    res.json(songData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener la canción" });
  }
});

function normalizeString(str) {
  return str
    .normalize("NFD") // separa letras y tildes
    .replace(/[\u0300-\u036f]/g, "") // elimina los diacríticos (tildes)
    .replace(/\s+/g, "-") // reemplaza espacios por guiones
    .replace(/[^a-zA-Z0-9\-]/g, "") // elimina caracteres no alfanuméricos excepto guion
    .toLowerCase(); // pasa todo a minúsculas
}

// Configuración de multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "cover") cb(null, "covers");
    else if (file.fieldname === "audio") cb(null, "music");
  },
  filename: (req, file, cb) => {
    const { title, artist } = req.body;
    const safeTitle = normalizeString(title);
    const safeArtist = normalizeString(artist);

    if (file.fieldname === "cover") {
      cb(
        null,
        `${safeTitle}-${safeArtist}-cover${path.extname(file.originalname)}`
      );
    } else if (file.fieldname === "audio") {
      cb(null, `${safeArtist}-${safeTitle}${path.extname(file.originalname)}`);
    }
  },
});

// Filtro de archivos: solo JPG y MP3
const fileFilter = (req, file, cb) => {
  if (file.fieldname === "cover" && file.mimetype === "image/jpeg")
    cb(null, true);
  else if (file.fieldname === "audio" && file.mimetype === "audio/mpeg")
    cb(null, true);
  else cb(new Error("Formato de archivo no permitido"));
};

const upload = multer({ storage, fileFilter });

// Endpoint para subir canción
app.post(
  "/songs/upload",
  upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  async (req, res) => {
    const { title, artist } = req.body;
    const coverFile = req.files.cover ? req.files.cover[0].filename : null;
    const audioFile = req.files.audio ? req.files.audio[0].filename : null;

    if (!title || !artist || !coverFile || !audioFile) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    try {
      // Guardar en la base de datos
      const result = await pool.query(
        "INSERT INTO songs (name, artist, cover, file) VALUES ($1, $2, $3, $4) RETURNING *",
        [title, artist, coverFile, audioFile]
      );

      res.status(201).json({
        message: "Canción subida con éxito",
        song: result.rows[0],
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Error al guardar la canción" });
    }
  }
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
