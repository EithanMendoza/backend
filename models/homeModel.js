const { MongoClient } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  return client;
};

// Obtener los servicios disponibles
exports.obtenerServicios = async () => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const servicios = await db.collection('tipos_servicio').find({}).toArray();

  await client.close();
  return servicios;
};
