const multer = require("multer");
const path = require("path");
const { FILES_BASE } = require("../config/constants");
const { normalizeString, normalizeUserName } = require("../utils/normalize");

// Configuración de multer para canciones (cover + audio)
const songStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "cover") cb(null, path.join(FILES_BASE, "covers"));
    else if (file.fieldname === "audio")
      cb(null, path.join(FILES_BASE, "music"));
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

const songFileFilter = (req, file, cb) => {
  if (file.fieldname === "cover" && file.mimetype === "image/jpeg")
    cb(null, true);
  else if (file.fieldname === "audio" && file.mimetype === "audio/mpeg")
    cb(null, true);
  else cb(new Error("Formato de archivo no permitido"));
};

const uploadSong = multer({ storage: songStorage, fileFilter: songFileFilter });

// Configuración de multer para imágenes de usuario
const userStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(FILES_BASE, "images"));
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

// Configuración de multer para APKs
const apkStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(FILES_BASE, "apks"));
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

const apkFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (
    file.mimetype === "application/vnd.android.package-archive" ||
    file.mimetype === "application/octet-stream" ||
    ext === ".apk"
  ) {
    cb(null, true);
  } else {
    cb(new Error("Solo se permiten archivos APK"));
  }
};

const uploadApk = multer({
  storage: apkStorage,
  fileFilter: apkFileFilter,
});

module.exports = {
  uploadSong,
  uploadUserImage,
  uploadApk,
};
