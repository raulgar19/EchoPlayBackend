const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const HOST = "http://192.168.1.35:3000"; // ✅ Ahora solo el host

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
app.use("/apk", express.static(path.join(__dirname, "apk")));

// Endpoint que obtiene todos los usuarios
app.get("/users", async (req, res) => {
  try {
    console.log("Obteniendo usuarios...");
    const result = await pool.query("SELECT * FROM users");

    const usuarios = result.rows.map((usuario) => ({
      id: usuario.id,
      name: usuario.name,
      image: `${HOST}/images/${usuario.image_file}`, // ✅ actualizado
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

// Endpoint para obtener las canciones de una playlist específica
app.get("/playlists/:playlistId/songs", async (req, res) => {
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
      cover: `${HOST}/covers/${song.cover}`, // ✅ actualizado
      file: `${HOST}/music/${song.file}`, // ✅ actualizado
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

// Endpoint para obtener todas las canciones
app.get("/songs", async (req, res) => {
  try {
    console.log("Obteniendo canciones...");
    const result = await pool.query("SELECT * FROM songs");

    const songs = result.rows.map((song) => ({
      id: song.id,
      name: song.name,
      artist: song.artist,
      cover: `${HOST}/covers/${song.cover}`, // ✅ actualizado
      file: `${HOST}/music/${song.file}`, // ✅ actualizado
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
      cover: `${HOST}/covers/${song.cover}`, // ✅ actualizado
      file: `${HOST}/music/${song.file}`, // ✅ actualizado
    };

    console.log("Canción obtenida correctamente");
    res.json(songData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener la canción" });
  }
});

// Endpoint para comprobar si la canción ya existe
app.post("/songs/check", async (req, res) => {
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

function normalizeString(str) {
  return str
    .normalize("NFD") // separa letras y tildes
    .replace(/[\u0300-\u036f]/g, "") // elimina tildes
    .replace(/\s+/g, "-") // reemplaza espacios por guiones
    .replace(/[^a-zA-Z0-9\-&]/g, "") // elimina caracteres no alfanuméricos excepto guion y &
    .toLowerCase(); // minúsculas
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

// Filtro de archivos
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

function normalizeUserName(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-]/g, "")
    .toLowerCase();
}

const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    const { name } = req.body;
    const safeName = normalizeUserName(name);
    cb(null, `${safeName}.jpg`); // siempre JPG
  },
});

const userFileFilter = (req, file, cb) => {
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/jpg") {
    cb(null, true);
  } else {
    cb(new Error("Formato de imagen no permitido. Solo JPG."));
  }
};

const uploadUserImage = multer({
  storage: userStorage,
  fileFilter: userFileFilter,
});

// Crear usuario
app.post("/users", uploadUserImage.single("image"), async (req, res) => {
  try {
    console.log("Solicitud para crear un nuevo usuario recibida");

    const { name } = req.body;
    if (!name || !req.file) {
      console.warn("Error: Falta 'name' o 'image' en la solicitud");
      return res.status(400).json({ error: "Se requiere 'name' e 'image'" });
    }

    const imageFile = req.file.filename;
    console.log(`Imagen recibida y guardada`);

    // Insertar en la base de datos
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

app.delete("/users/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`Solicitud de eliminación de usuario ID: ${id}`);

  try {
    // Obtener el usuario para saber su imagen
    const resultUser = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (resultUser.rows.length === 0) {
      console.warn(`Usuario con ID ${id} no encontrado`);
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const user = resultUser.rows[0];
    const imageFileName = user.image_file;
    const imagePath = path.join(__dirname, "images", imageFileName);

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

// Endpoint para modificar usuario
app.put("/users/:id", upload.single("image"), async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  console.log(`Recibida petición de modificación para usuario ID: ${id}`);

  if (!name) {
    console.warn("Falta el nombre del usuario");
    return res.status(400).json({ error: "Se requiere el nombre del usuario" });
  }

  try {
    // Obtener el usuario actual
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
      const imagePath = path.join(__dirname, "images", imageFileName);

      // Borrar imagen antigua si existe
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`Imagen antigua eliminada...`);
      }

      // Guardar la nueva imagen con el mismo nombre
      fs.renameSync(uploadedFile.path, imagePath);
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

const apkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "apk");
  },
  filename: (req, file, cb) => {
    const { version } = req.body;
    const fileName = `echoplay-${version}.apk`;
    cb(null, fileName);
  },
});

const apkUpload = multer({
  storage: apkStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/vnd.android.package-archive")
      cb(null, true);
    else cb(new Error("Solo se permiten archivos APK"));
  },
});

// Subir APK
app.post("/apk/upload", apkUpload.single("apk"), (req, res) => {
  console.log("Solicitud recibida para subir APK");

  if (!req.file) {
    console.warn("Archivo APK no recibido o formato incorrecto");
    return res
      .status(400)
      .json({ error: "Archivo APK no recibido o formato incorrecto" });
  }

  console.log(`APK subida correctamente: ${req.file.filename}`);
  res.status(201).json({
    message: `APK subida y renombrada a ${req.file.filename}`,
    file: req.file.filename,
  });
});

// Descargar APK
app.get("/apk/download/:filename", (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, "apk", filename);

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

// Endpoint para listar todas las APKs
app.get("/apk/list", (req, res) => {
  console.log("Solicitud recibida para listar todas las APKs");

  const apkFolder = path.join(__dirname, "apk");

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
app.get("/app/version", (req, res) => {
  const apkFolder = path.join(__dirname, "apk");

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

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
