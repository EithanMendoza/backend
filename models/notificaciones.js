const { MongoClient, ObjectId } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  return client;
};

// Obtener notificaciones no eliminadas y con vigencia menor a una semana
exports.getNotificacionesByUser = async (userId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  const notificaciones = await db.collection('notificaciones')
    .find({ user_id: new ObjectId(userId), fecha: { $gte: oneWeekAgo } })
    .sort({ fecha: -1 })
    .toArray();

  await client.close();
  return notificaciones;
};

// Marcar notificaciones como leídas
exports.markNotificacionesAsRead = async (userId, ids) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const result = await db.collection('notificaciones').updateMany(
    { _id: { $in: ids.map((id) => new ObjectId(id)) }, user_id: new ObjectId(userId) },
    { $set: { leida: true } }
  );

  await client.close();
  return result.modifiedCount;
};

// Eliminar notificación específica
exports.deleteNotificacion = async (userId, notificacionId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const result = await db.collection('notificaciones').deleteOne({
    _id: new ObjectId(notificacionId),
    user_id: new ObjectId(userId),
  });

  await client.close();
  return result.deletedCount > 0;
};


// ✅ Función para crear notificación
exports.crearNotificacion = async (userId, mensaje) => {
  const client = await connectToDatabase();
  try {
    const db = client.db('AirTecs3');
    const result = await db.collection('notificaciones').insertOne({
      user_id: new ObjectId(userId),
      mensaje,
      fecha: new Date(),
      leida: false,
    });

    console.log("✅ Notificación creada con ID:", result.insertedId);
    return result.insertedId;
  } finally {
    await client.close();
  }
};