/**
 * Normaliza cadenas de texto eliminando tildes, espacios y caracteres especiales
 * @param {string} str - La cadena a normalizar
 * @returns {string} - Cadena normalizada en minúsculas
 */
function normalizeString(str) {
  return str
    .normalize("NFD") // separa letras y tildes
    .replace(/[\u0300-\u036f]/g, "") // elimina tildes
    .replace(/\s+/g, "-") // reemplaza espacios por guiones
    .replace(/[^a-zA-Z0-9\-&]/g, "") // elimina caracteres no alfanuméricos excepto guion y &
    .toLowerCase(); // minúsculas
}

/**
 * Normaliza nombres de usuario para nombres de archivo
 * @param {string} str - El nombre de usuario a normalizar
 * @returns {string} - Nombre normalizado en minúsculas
 */
function normalizeUserName(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9\-]/g, "")
    .toLowerCase();
}

module.exports = {
  normalizeString,
  normalizeUserName,
};
