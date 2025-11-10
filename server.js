require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Importar rutas
const usersRoutes = require("./routes/users");
const playlistsRoutes = require("./routes/playlists");
const songsRoutes = require("./routes/songs");
const apkRoutes = require("./routes/apk");

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

// Middleware de logging
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Registrar rutas
app.use("/users", usersRoutes);
app.use("/playlists", playlistsRoutes);
app.use("/songs", songsRoutes);
app.use("/apk", apkRoutes);
app.use("/app", apkRoutes); // Para /app/version

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Accessible at http://192.168.1.40:${PORT}`);
});
