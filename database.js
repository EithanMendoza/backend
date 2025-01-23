const { MongoClient } = require('mongodb'); // Importar el cliente de MongoDB
require('dotenv').config(); // Cargar variables de entorno desde el archivo .env

// Obtener la URI de conexión desde las variables de entorno
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017'; // URI de MongoDB
const DB_NAME = process.env.DB_NAME || 'AirTecs3'; // Nombre de la base de datos

// Conectar a la base de datos
const dbConnect = async () => {
  try {
    const client = new MongoClient(MONGO_URI); // Crear instancia del cliente de MongoDB sin opciones obsoletas

    await client.connect(); // Conectar al servidor
    console.log('Conexión exitosa a MongoDB');

    // Devolver la conexión a la base de datos
    return client.db(DB_NAME);
  } catch (err) {
    console.error('Error conectando a la base de datos MongoDB:', err);
    throw err; // Relanzar el error para manejarlo en otro nivel si es necesario
  }
};

module.exports = { dbConnect };
