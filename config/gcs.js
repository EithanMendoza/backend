const { Storage } = require("@google-cloud/storage");
const path = require("path");

// Configuración del bucket
const storage = new Storage({
  keyFilename: path.join(__dirname, "../google-cloud-key.json"),
  projectId: "divine-booking-440417-d6", // Reemplaza con tu ID de proyecto
});

const bucket = storage.bucket("airtecs"); // Reemplaza con el nombre de tu bucket

module.exports = bucket;
