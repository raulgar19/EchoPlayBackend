require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Importar rutas
const usersRouter = require("./routes/users");
const playlistsRouter = require("./routes/playlists");
const songsRouter = require("./routes/songs");
const apkRouter = require("./routes/apk");
const driveRouter = require("./routes/drive");

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
// Rutas
app.use("/users", usersRouter);
app.use("/playlists", playlistsRouter);
app.use("/songs", songsRouter);
app.use("/apk", apkRouter);
app.use("/drive", driveRouter);
app.use("/app", apkRouter); // Para /app/version

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Accessible at http://192.168.1.40:${PORT}`);
});
