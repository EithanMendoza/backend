// models/pagoModel.js
const { MongoClient, ObjectId } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  return client;
};

// Función para insertar pago
const insertarPago = async (pagoData) => {
  const client = await connectToDatabase();
  const db = client.db("AirTecs3");

  await db.collection("pagos_servicios").insertOne(pagoData);

  await client.close();
};

module.exports = {
  insertarPago,
};
