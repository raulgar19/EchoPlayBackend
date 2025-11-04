const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const pool = require("../config/database");
const { HOST, FILES_BASE } = require("../config/constants");
const { uploadUserImage } = require("../middleware/upload");

// Obtener todos los usuarios
router.get("/", async (req, res) => {
  try {
    console.log("Obteniendo usuarios...");
    const result = await pool.query("SELECT * FROM users");

    const usuarios = result.rows.map((usuario) => ({
      id: usuario.id,
      name: usuario.name,
      image: `${HOST}/images/${usuario.image_file}`,
    }));

    console.log("Usuarios obtenidos correctamente");
    res.json(usuarios);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener los usuarios" });
  }
});

// Crear usuario
router.post("/", uploadUserImage.single("image"), async (req, res) => {
  try {
    console.log("Solicitud para crear un nuevo usuario recibida");

    const { name } = req.body;
    if (!name || !req.file) {
      console.warn("Error: Falta 'name' o 'image' en la solicitud");
      return res.status(400).json({ error: "Se requiere 'name' e 'image'" });
    }

    const imageFile = req.file.filename;
    console.log(`Imagen recibida y guardada`);

    const result = await pool.query(
      "INSERT INTO users (name, image_file) VALUES ($1, $2) RETURNING id, name, image_file",
      [name, imageFile]
    );

    const newUser = result.rows[0];
    console.log(`Usuario creado con éxito`);

    res.status(201).json({
      message: "Usuario creado correctamente",
    });

    console.log("Respuesta enviada al cliente con los datos del nuevo usuario");
  } catch (err) {
    console.error("Error al crear usuario:", err);
    res.status(500).json({ error: "Error al crear el usuario" });
  }
});

// Eliminar usuario
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`Solicitud de eliminación de usuario ID: ${id}`);

  try {
    const resultUser = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (resultUser.rows.length === 0) {
      console.warn(`Usuario con ID ${id} no encontrado`);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const user = resultUser.rows[0];
    const imageFileName = user.image_file;
    const imagePath = path.join(FILES_BASE, "images", imageFileName);

    console.log(
      `Usuario encontrado. Procediendo a eliminar datos relacionados...`
    );

    // Eliminar relaciones playlist-canción
    await pool.query(
      `DELETE FROM playlist_songs
       WHERE playlist_id IN (SELECT id FROM playlists WHERE user_id = $1)`,
      [id]
    );
    console.log("Relaciones playlist-canción eliminadas");

    // Eliminar playlists del usuario
    await pool.query("DELETE FROM playlists WHERE user_id = $1", [id]);
    console.log("Playlists del usuario eliminadas");

    // Eliminar usuario
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    console.log("Usuario eliminado de la base de datos");

    // Borrar imagen del disco si existe
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log(`Imagen de perfil eliminada`);
    } else {
      console.warn(
        `Imagen de perfil no encontrada en almacenamiento: ${imageFileName}`
      );
    }

    console.log("Usuario y datos relacionados eliminados correctamente");
    res.status(200).json({
      message: "Usuario y datos relacionados eliminados correctamente",
    });
  } catch (err) {
    console.error("Error al eliminar usuario:", err);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});

// Modificar usuario
router.put("/:id", uploadUserImage.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  console.log(`Recibida petición de modificación para usuario ID: ${id}`);

  if (!name) {
    console.warn("Falta el nombre del usuario");
    return res.status(400).json({ error: "Se requiere el nombre del usuario" });
  }

  try {
    const resultUser = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (resultUser.rows.length === 0) {
      console.warn(`Usuario con ID ${id} no encontrado`);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const user = resultUser.rows[0];
    let imageFileName = user.image_file;

    // Si se subió nueva imagen, reemplazar la existente
    if (req.file) {
      const uploadedFile = req.file;
      const imagePath = path.join(FILES_BASE, "images", imageFileName);

      // Borrar imagen antigua si existe
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`Imagen antigua eliminada...`);
      }

      // Si multer ya guardó con el nombre final, uploadedFile.path será el mismo.
      // Asegurar que el archivo esté en la ubicación final
      if (uploadedFile.path !== imagePath) {
        fs.renameSync(uploadedFile.path, imagePath);
      }
      console.log(`Imagen nueva guardada con el mismo nombre...`);
    }

    // Actualizar nombre (y mantener image_file igual si no se cambió)
    await pool.query(
      "UPDATE users SET name = $1, image_file = $2 WHERE id = $3",
      [name, imageFileName, id]
    );

    console.log(`Usuario ID ${id} actualizado correctamente`);

    res.status(200).json({ message: "Usuario modificado correctamente" });
  } catch (err) {
    console.error("Error al modificar usuario:", err);
    res.status(500).json({ error: "Error al modificar usuario" });
  }
});

// Obtener las playlists de un usuario
router.get("/:userId/playlists", async (req, res) => {
  const { userId } = req.params;

  try {
    console.log(`Obteniendo playlists del usuario con ID: ${userId}...`);

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

module.exports = router;
