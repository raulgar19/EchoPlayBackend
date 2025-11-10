const { Pool } = require("pg");

// Configuración de conexión a PostgreSQL (Aiven Cloud)
const pool = new Pool({
  host: "echoplay-raulgamu2003-95b7.k.aivencloud.com",
  user: "avnadmin",
  password: process.env.DB_PASSWORD,
  database: "defaultdb",
  port: 28456,
  ssl: {
    rejectUnauthorized: false,
  },
});

module.exports = pool;
