const express = require("express");
const router = express.Router();
const pool = require("../config/database");

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

router.get("/users/:userId/playlists", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM playlists WHERE user_id = $1",
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener playlists" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, userId } = req.body;
    const result = await pool.query(
      "INSERT INTO playlists (name, user_id) VALUES ($1, $2) RETURNING *",
      [name, userId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear playlist" });
  }
});

router.delete("/:playlistId", async (req, res) => {
  try {
    await pool.query("DELETE FROM playlist_songs WHERE playlist_id = $1", [
      req.params.playlistId,
    ]);
    await pool.query("DELETE FROM playlists WHERE id = $1", [
      req.params.playlistId,
    ]);
    res.json({ message: "Playlist eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar playlist" });
  }
});

router.post("/:playlistId/songs", async (req, res) => {
  try {
    const { songId } = req.body;
    const result = await pool.query(
      "INSERT INTO playlist_songs (playlist_id, song_id) VALUES ($1, $2) RETURNING *",
      [req.params.playlistId, songId]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al añadir canción" });
  }
});

router.get("/:playlistId/songs", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT s.* FROM songs s JOIN playlist_songs ps ON s.id = ps.song_id WHERE ps.playlist_id = $1",
      [req.params.playlistId]
    );
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

router.delete("/:playlistId/songs/:songId", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM playlist_songs WHERE playlist_id = $1 AND song_id = $2",
      [req.params.playlistId, req.params.songId]
    );
    res.json({ message: "Canción eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar canción" });
  }
});

module.exports = router;
