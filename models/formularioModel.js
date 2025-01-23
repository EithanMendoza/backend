const { MongoClient, ObjectId } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  return client;
};

// Verificar si el usuario tiene una solicitud activa
exports.verificarSolicitudActiva = async (userId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const solicitud = await db.collection('solicitudes_servicio').findOne({
    user_id: new ObjectId(userId),
    estado: 'pendiente',
  });

  await client.close();
  return solicitud;
};

// Validar el tipo de servicio
exports.validarTipoServicio = async (tipo_servicio_id) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const servicio = await db.collection('tipos_servicio').findOne({ _id: new ObjectId(tipo_servicio_id) });

  await client.close();
  return servicio ? servicio.nombre_servicio : null;
};

// Crear una nueva solicitud
exports.crearSolicitud = async (data) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const result = await db.collection('solicitudes_servicio').insertOne({
    user_id: new ObjectId(data.userId),
    tipo_servicio_id: new ObjectId(data.tipo_servicio_id),
    nombre_servicio: data.nombreServicio,
    marca_ac: data.marca_ac,
    tipo_ac: data.tipo_ac,
    detalles: data.detalles,
    fecha: new Date(data.fecha),
    hora: data.hora,
    direccion: data.direccion,
    estado: 'pendiente',
    created_at: new Date(),
  });

  await client.close();
  return result.insertedId;
};

// Obtener el estado del progreso de una solicitud
exports.obtenerEstadoProgreso = async (solicitudId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const progreso = await db.collection('progreso_servicio')
    .find({ solicitud_id: new ObjectId(solicitudId) })
    .sort({ _id: -1 })
    .limit(1)
    .toArray();

  await client.close();
  return progreso.length > 0 ? progreso[0].estado : null;
};

// Cancelar una solicitud
exports.cancelarSolicitud = async (solicitudId, userId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const result = await db.collection('solicitudes_servicio').deleteOne({
    _id: new ObjectId(solicitudId),
    user_id: new ObjectId(userId),
  });

  await client.close();
  return result.deletedCount > 0;
};

// Obtener solicitudes pendientes del usuario
exports.obtenerSolicitudPendiente = async (userId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const solicitud = await db.collection('solicitudes_servicio')
    .find({ user_id: new ObjectId(userId), estado: { $ne: 'cancelado' } })
    .sort({ created_at: -1 })
    .limit(1)
    .toArray();

  await client.close();
  return solicitud.length > 0 ? solicitud[0] : null;
};
