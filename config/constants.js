const path = require("path");
const fs = require("fs");

const HOST = "https://virtually-prayers-explained-contractor.trycloudflare.com";
const FILES_BASE = "D:\\echoplay";

// Asegurarse de que las carpetas existan en el disco externo
const ensureDirs = [
  path.join(FILES_BASE, "covers"),
  path.join(FILES_BASE, "images"),
  path.join(FILES_BASE, "music"),
  path.join(FILES_BASE, "apks"),
];

for (const dir of ensureDirs) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

module.exports = {
  HOST,
  FILES_BASE,
};
