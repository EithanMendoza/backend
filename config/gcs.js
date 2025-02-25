const { Storage } = require("@google-cloud/storage");
const path = require("path");

const credentials = JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS);

// Configuración del bucket
const storage = new Storage({
    credentials,
    projectId: credentials.project_id,
  });

const bucket = storage.bucket("airtecs"); // Reemplaza con el nombre de tu bucket

module.exports = bucket;
