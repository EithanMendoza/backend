const { MongoClient, ObjectId } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  return client;
};

// Obtener el usuario asociado a un token activo
exports.getUserIdFromSession = async (token) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const session = await db.collection('login').findOne({
    session_token: token,
    tiempo_cierre: { $exists: false },
  });

  await client.close();
  return session ? session.user_id : null;
};

// Obtener servicios completados para un usuario
exports.getCompletedServicesByUser = async (userId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const services = await db.collection('solicitudes_servicio')
    .find({ user_id: new ObjectId(userId), estado: 'completado' })
    .sort({ fecha: -1 })
    .project({ id: 1, nombre_servicio: 1, fecha: 1, hora: 1, direccion: 1, detalles: 1 })
    .toArray();

  await client.close();
  return services;
};
