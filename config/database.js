const { Pool } = require("pg");

// Configuración de conexión a PostgreSQL
const pool = new Pool({
  host: "localhost",
  user: "echoplay",
  password: "echoplay",
  database: "echoplay",
  port: 55432,
});

module.exports = pool;
