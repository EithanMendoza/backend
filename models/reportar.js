const { MongoClient, ObjectId } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  return client;
};

// Verificar si la solicitud está vinculada al usuario y al técnico
exports.verificarSolicitud = async (solicitudId, userId, tecnicoId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const solicitud = await db.collection('solicitudes_servicio').findOne({
    _id: new ObjectId(solicitudId),
    user_id: new ObjectId(userId),
    tecnico_id: new ObjectId(tecnicoId),
  });

  await client.close();
  return solicitud;
};

// Insertar un nuevo reporte
exports.insertarReporte = async (userId, tecnicoId, solicitudId, descripcion) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const result = await db.collection('reportes_tecnicos').insertOne({
    usuario_id: new ObjectId(userId),
    tecnico_id: new ObjectId(tecnicoId),
    solicitud_id: new ObjectId(solicitudId),
    descripcion,
    fecha: new Date(),
    estado: 'pendiente',
  });

  await client.close();
  return result.insertedId;
};
