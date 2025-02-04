const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'AirTecs3';

const dbConnect = async () => {
  try {
    const client = new MongoClient(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    console.log('✅ Conexión exitosa a MongoDB');

    return client.db(DB_NAME); // 🔥 ✅ RETORNAR LA BASE DE DATOS
  } catch (err) {
    console.error('❌ Error conectando a MongoDB:', err);
    throw err;
  }
};

module.exports = { dbConnect };
