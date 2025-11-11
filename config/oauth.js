const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const CREDENTIALS_PATH = path.join(__dirname, "../oauth-credentials.json");
const TOKEN_PATH = path.join(__dirname, "../token.json");
const SCOPES = [
  "https://www.googleapis.com/auth/drive.file", // Acceso a archivos creados por la app
  "https://www.googleapis.com/auth/drive", // Acceso completo a Drive
];

/**
 * Genera el token de autenticación OAuth (solo se ejecuta una vez)
 */
async function generateToken() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_secret, client_id, redirect_uris } =
    credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("\n🔐 Autoriza esta aplicación visitando esta URL:\n");
  console.log(authUrl);
  console.log("\n");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve, reject) => {
    rl.question("📝 Ingresa el código de la página: ", async (code) => {
      rl.close();
      try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
        console.log("✅ Token guardado en:", TOKEN_PATH);
        resolve(oAuth2Client);
      } catch (err) {
        reject(err);
      }
    });
  });
}

/**
 * Obtiene el cliente OAuth autenticado
 */
async function getAuthClient() {
  const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
  const { client_secret, client_id, redirect_uris } =
    credentials.installed || credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Verificar si ya existe el token
  if (fs.existsSync(TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
    oAuth2Client.setCredentials(token);
    return oAuth2Client;
  } else {
    return await generateToken();
  }
}

module.exports = { getAuthClient };
