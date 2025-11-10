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

router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users");
    const usuarios = result.rows.map((usuario) => ({
      id: usuario.id,
      name: usuario.name,
      image: formatGDriveUrl(usuario.image_file),
    }));
    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener los usuarios" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { name, imageUrl } = req.body;
    if (!name || !imageUrl) {
      return res.status(400).json({ error: "Se requiere 'name' e 'imageUrl'" });
    }
    const result = await pool.query(
      "INSERT INTO users (name, image_file) VALUES ($1, $2) RETURNING *",
      [name, imageUrl]
    );
    res.status(201).json({ message: "Usuario creado", user: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al crear usuario" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await pool.query(
      "DELETE FROM playlist_songs WHERE playlist_id IN (SELECT id FROM playlists WHERE user_id = $1)",
      [req.params.id]
    );
    await pool.query("DELETE FROM playlists WHERE user_id = $1", [
      req.params.id,
    ]);
    await pool.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ message: "Usuario eliminado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { name, imageUrl } = req.body;
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [
      req.params.id,
    ]);
    const finalImageUrl = imageUrl || user.rows[0].image_file;
    await pool.query(
      "UPDATE users SET name = $1, image_file = $2 WHERE id = $3",
      [name, finalImageUrl, req.params.id]
    );
    res.json({ message: "Usuario actualizado" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [
      req.params.id,
    ]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }
    const usuario = {
      id: result.rows[0].id,
      name: result.rows[0].name,
      image: formatGDriveUrl(result.rows[0].image_file),
    };
    res.json(usuario);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener usuario" });
  }
});

router.get("/:id/playlists", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM playlists WHERE user_id = $1",
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener playlists" });
  }
});

module.exports = router;
