const { Storage } = require("@google-cloud/storage");

// Verifica que la variable exista
if (!process.env.GOOGLE_CLOUD_CREDENTIALS) {
  throw new Error("GOOGLE_CLOUD_CREDENTIALS no está definida.");
}

let credentials;

try {
  credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);

  // Reemplaza los \\n por \n en la private_key
  credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
} catch (error) {
  console.error("Error al parsear GOOGLE_CLOUD_CREDENTIALS:", error);
  throw new Error("Credenciales de Google Cloud malformadas.");
}

// Configuración del bucket
const storage = new Storage({
  credentials,
  projectId: credentials.project_id,
});

const bucket = storage.bucket("airtecs");

module.exports = bucket;
