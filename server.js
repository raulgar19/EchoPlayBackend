const express = require("express");
const cors = require("cors");
const path = require("path");
const { FILES_BASE } = require("./config/constants");

// Importar rutas
const usersRoutes = require("./routes/users");
const playlistsRoutes = require("./routes/playlists");
const songsRoutes = require("./routes/songs");
const apkRoutes = require("./routes/apk");

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Servir archivos estáticos desde FILES_BASE
app.use("/covers", express.static(path.join(FILES_BASE, "covers")));
app.use("/images", express.static(path.join(FILES_BASE, "images")));
app.use("/music", express.static(path.join(FILES_BASE, "music")));
app.use("/apks", express.static(path.join(FILES_BASE, "apks")));

// Registrar rutas
app.use("/users", usersRoutes);
app.use("/playlists", playlistsRoutes);
app.use("/songs", songsRoutes);
app.use("/apk", apkRoutes);
app.use("/app", apkRoutes); // Para /app/version

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
