const multer = require("multer");

// Configuración de multer para mantener archivos en memoria
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB máximo
  },
  fileFilter: (req, file, cb) => {
    // Filtros según el tipo de archivo
    if (file.fieldname === "cover") {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Solo se permiten imágenes para la portada"));
      }
    } else if (file.fieldname === "audio") {
      if (file.mimetype.startsWith("audio/")) {
        cb(null, true);
      } else {
        cb(new Error("Solo se permiten archivos de audio"));
      }
    } else if (file.fieldname === "image") {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Solo se permiten imágenes"));
      }
    } else if (file.fieldname === "apk") {
      if (
        file.mimetype === "application/vnd.android.package-archive" ||
        file.originalname.endsWith(".apk")
      ) {
        cb(null, true);
      } else {
        cb(new Error("Solo se permiten archivos APK"));
      }
    } else {
      cb(null, true);
    }
  },
});

module.exports = {
  uploadSong: upload.fields([
    { name: "cover", maxCount: 1 },
    { name: "audio", maxCount: 1 },
  ]),
  uploadImage: upload.single("image"),
  uploadApk: upload.single("apk"),
};
