require("dotenv").config();
const { getAuthClient } = require("./config/oauth");

async function setup() {
  try {
    console.log("🔧 Configurando autenticación OAuth...\n");
    await getAuthClient();
    console.log("\n✅ Autenticación completada exitosamente!");
    console.log("📝 El token se guardó en token.json");
    console.log("\n🚀 Ahora puedes iniciar el servidor con: node server.js");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

setup();
