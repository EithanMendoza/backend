const { MongoClient, ObjectId } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  return client;
};

// ✅ Verificar si el usuario ya tiene una solicitud en curso
exports.obtenerSolicitudEnCurso = async (userId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const solicitud = await db.collection('solicitudes_servicio').findOne({
    user_id: new ObjectId(userId), // 🔥 Cambiado para coincidir con la BD
    estado: { $in: ["pendiente", "en proceso"] } // 🚀 Solo consultas activas
  });

  console.log("🔍 Solicitud en curso encontrada:", solicitud); // Debug para verificar
  await client.close();
  return solicitud;
};

// ✅ Crear una nueva solicitud con validación de usuario
exports.crearSolicitud = async (data) => {
  const client = await connectToDatabase();
  try {
    const db = client.db('AirTecs3');

    const result = await db.collection('solicitudes_servicio').insertOne({
      user_id: new ObjectId(data.userId), // 🔥 Unificado con obtenerSolicitudEnCurso
      tipo_servicio_id: new ObjectId(data.tipo_servicio_id),
      marca_ac: data.marca_ac,
      tipo_ac: data.tipo_ac,
      detalles: data.detalles,
      fecha: new Date(data.fecha),
      hora: data.hora,
      direccion: data.direccion,
      estado: 'pendiente', // 🔥 Se marca como pendiente
      created_at: new Date(),
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000), // Expira en 12 horas
    });

    return result.insertedId;
  } finally {
    await client.close();
  }
};

// ✅ Obtener todas las solicitudes pendientes (para los técnicos)
exports.obtenerSolicitudesDisponibles = async () => {
  const client = await connectToDatabase();
  try {
    const db = client.db('AirTecs3');
    return await db.collection('solicitudes_servicio').find({ estado: 'pendiente' }).toArray();
  } finally {
    await client.close();
  }
};

// ✅ Un técnico acepta una solicitud y la asigna
exports.asignarTecnico = async (solicitudId, tecnicoId) => {
  const client = await connectToDatabase();
  try {
    const db = client.db('AirTecs3');
    const result = await db.collection('solicitudes_servicio').updateOne(
      { _id: new ObjectId(solicitudId), estado: 'pendiente' },
      { $set: { tecnico_id: new ObjectId(tecnicoId), estado: 'asignado' } }
    );
    return result.modifiedCount > 0;
  } finally {
    await client.close();
  }
};

// ✅ Cancelar una solicitud por parte del usuario
exports.cancelarSolicitud = async (solicitudId, userId) => {
  const client = await connectToDatabase();
  try {
    const db = client.db('AirTecs3');
    const result = await db.collection('solicitudes_servicio').deleteOne({
      _id: new ObjectId(solicitudId),
      user_id: new ObjectId(userId),
    });
    return result.deletedCount > 0;
  } finally {
    await client.close();
  }
};

// ✅ Eliminar solicitudes vencidas (expiradas)
exports.eliminarSolicitudesExpiradas = async () => {
  const client = await connectToDatabase();
  try {
    const db = client.db('AirTecs3');
    const result = await db.collection('solicitudes_servicio').deleteMany({
      expires_at: { $lte: new Date() },
      estado: 'pendiente',
    });
    return result.deletedCount;
  } finally {
    await client.close();
  }
};
