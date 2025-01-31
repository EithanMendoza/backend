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

  console.log("🔍 Buscando solicitud en curso para userId:", userId); // Debugging

  const solicitud = await db.collection('solicitudes_servicio').findOne({
    user_id: new ObjectId(userId),
    estado: { $in: ["pendiente", "en proceso"] } // 🚀 Solo consultas activas
  });

  console.log("🔍 Resultado de solicitud en curso:", solicitud); // Debugging
  await client.close();
  return solicitud || null; // ✅ Aseguramos que no retorne undefined
};
const generarCodigoConfirmacion = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // Código de 6 dígitos
};

exports.crearSolicitud = async (data) => {
  const client = await connectToDatabase();
  try {
    const db = client.db('AirTecs3');
    const codigoConfirmacion = generarCodigoConfirmacion(); // 🔥 Genera el código aquí

    const result = await db.collection('solicitudes_servicio').insertOne({
      user_id: new ObjectId(data.userId),
      tipo_servicio_id: new ObjectId(data.tipo_servicio_id),
      nombre_servicio: data.nombreServicio || "Sin especificar",
      marca_ac: data.marca_ac,
      tipo_ac: data.tipo_ac,
      detalles: data.detalles,
      fecha: new Date(data.fecha),
      hora: data.hora,
      direccion: data.direccion,
      estado: 'pendiente',
      codigo_inicial: codigoConfirmacion, // 🔥 Guarda el código en la base de datos
      created_at: new Date(),
      expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000),
    });

    console.log("✅ Solicitud insertada con código:", codigoConfirmacion);
    return { solicitudId: result.insertedId, codigoConfirmacion }; // 🔥 Devuelve el código para que el controlador lo use
  } finally {
    await client.close();
  }
};



// Verificar si el usuario ya tiene una solicitud activa
exports.verificarSolicitudActiva = async (userId) => {
  const client = await connectToDatabase();
  try {
    const db = client.db('AirTecs3');
    return await db.collection('solicitudes_servicio').findOne({
      user_id: new ObjectId(userId),
      estado: 'pendiente',
    });
  } finally {
    await client.close();
  }
};

// Validar el tipo de servicio
exports.validarTipoServicio = async (tipo_servicio_id) => {
  const client = await connectToDatabase();
  try {
    const db = client.db('AirTecs3');
    const servicio = await db.collection('tipos_servicio').findOne({ _id: new ObjectId(tipo_servicio_id) });
    return servicio ? servicio.nombre_servicio : null;
  } finally {
    await client.close();
  }
};



// Obtener todas las solicitudes pendientes (para los técnicos)
exports.obtenerSolicitudesDisponibles = async () => {
  const client = await connectToDatabase();
  try {
    const db = client.db('AirTecs3');
    return await db.collection('solicitudes_servicio').find({ estado: 'pendiente' }).toArray();
  } finally {
    await client.close();
  }
};

// Un técnico acepta una solicitud y la asigna
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

// Cancelar una solicitud por parte del usuario
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

// Eliminar solicitudes vencidas (expiradas)
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
