const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { HOST } = require("../config/constants");

// Crear una nueva playlist
router.post("/", async (req, res) => {
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

// Eliminar una playlist
router.delete("/:playlistId", async (req, res) => {
  const { playlistId } = req.params;
  console.log(`Solicitud para eliminar playlist ID: ${playlistId}`);

  try {
    // 1. Eliminar relaciones en la tabla intermedia
    await pool.query("DELETE FROM playlist_songs WHERE playlist_id = $1", [
      playlistId,
    ]);
    console.log("Relaciones playlist-canción eliminadas");

    // 2. Eliminar la playlist
    const result = await pool.query(
      "DELETE FROM playlists WHERE id = $1 RETURNING *",
      [playlistId]
    );

    if (result.rows.length === 0) {
      console.warn(`Playlist con ID ${playlistId} no encontrada`);
      return res.status(404).json({ error: "Playlist no encontrada" });
    }

    console.log("Playlist eliminada correctamente");
    res.status(200).json({ message: "Playlist eliminada correctamente" });
  } catch (err) {
    console.error("Error al eliminar playlist:", err);
    res.status(500).json({ error: "Error al eliminar la playlist" });
  }
});

// Añadir una canción a una playlist
router.post("/:playlistId/songs", async (req, res) => {
  const { playlistId } = req.params;
  const { songId } = req.body;

  if (!songId) {
    return res.status(400).json({ error: "Se requiere 'songId'" });
  }

  try {
    console.log(
      `Añadiendo canción con ID ${songId} a la playlist ${playlistId}...`
    );

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

// Obtener las canciones de una playlist específica
router.get("/:playlistId/songs", async (req, res) => {
  const { playlistId } = req.params;

  try {
    console.log(`Obteniendo canciones de la playlist con ID: ${playlistId}...`);

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
      cover: `${HOST}/covers/${song.cover}`,
      file: `${HOST}/music/${song.file}`,
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

// Eliminar una canción de una playlist
router.delete("/:playlistId/songs/:songId", async (req, res) => {
  const { playlistId, songId } = req.params;

  try {
    console.log(
      `Eliminando canción con ID ${songId} de la playlist ${playlistId}...`
    );

    // Primero verificar si la relación existe
    const exists = await pool.query(
      "SELECT * FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2",
      [playlistId, songId]
    );

    if (exists.rows.length === 0) {
      console.warn("La canción no estaba en la playlist");
      return res
        .status(404)
        .json({ error: "La canción no está en la playlist" });
    }

    // Eliminar de la relación
    await pool.query(
      "DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2",
      [playlistId, songId]
    );

    console.log("Canción eliminada correctamente de la playlist");
    res.status(200).json({ message: "Canción eliminada de la playlist" });
  } catch (err) {
    console.error("Error al eliminar la canción de la playlist:", err);
    res
      .status(500)
      .json({ error: "Error al eliminar la canción de la playlist" });
  }
});

module.exports = router;
