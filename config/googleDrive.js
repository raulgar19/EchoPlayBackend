const { google } = require("googleapis");
const { getAuthClient } = require("./oauth");
const path = require("path");

// IDs de las carpetas en Google Drive
const FOLDER_IDS = {
  covers: process.env.GDRIVE_COVERS_FOLDER_ID,
  songs: process.env.GDRIVE_SONGS_FOLDER_ID,
  users: process.env.GDRIVE_USERS_FOLDER_ID,
  apks: process.env.GDRIVE_APKS_FOLDER_ID,
};

/**
 * Obtiene la instancia del drive autenticado
 */
async function getDriveInstance() {
  const auth = await getAuthClient();
  return google.drive({ version: "v3", auth });
}

/**
 * Sube un archivo a Google Drive
 * @param {Buffer} fileBuffer - Buffer del archivo
 * @param {string} fileName - Nombre del archivo
 * @param {string} mimeType - Tipo MIME del archivo
 * @param {string} folderType - Tipo de carpeta: 'covers', 'songs', 'users', 'apks'
 * @returns {Promise<string>} - URL pública del archivo
 */
async function uploadFile(fileBuffer, fileName, mimeType, folderType) {
  try {
    const drive = await getDriveInstance();
    const folderId = FOLDER_IDS[folderType];

    if (!folderId) {
      throw new Error(`Folder ID para ${folderType} no configurado`);
    }

    // Subir archivo
    const response = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [folderId],
      },
      media: {
        mimeType: mimeType,
        body: require("stream").Readable.from(fileBuffer),
      },
      fields: "id, webViewLink, webContentLink",
    });

    const fileId = response.data.id;

    // Hacer el archivo público
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    // Retornar URL en formato directo
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  } catch (error) {
    console.error("Error al subir archivo a Google Drive:", error.message);
    throw error;
  }
}

/**
 * Elimina un archivo de Google Drive
 * @param {string} fileUrl - URL del archivo (extrae el ID)
 */
async function deleteFile(fileUrl) {
  try {
    const drive = await getDriveInstance();
    const fileId = extractFileId(fileUrl);
    if (!fileId) {
      throw new Error("No se pudo extraer el ID del archivo");
    }

    await drive.files.delete({
      fileId: fileId,
    });

    console.log(`Archivo eliminado: ${fileId}`);
  } catch (error) {
    console.error("Error al eliminar archivo de Google Drive:", error);
    throw error;
  }
}

/**
 * Extrae el ID del archivo de una URL de Google Drive
 */
function extractFileId(url) {
  const match = url.match(/[?&]id=([^&]+)/);
  return match ? match[1] : null;
}

module.exports = {
  uploadFile,
  deleteFile,
  FOLDER_IDS,
};
