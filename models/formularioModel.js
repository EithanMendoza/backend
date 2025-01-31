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

exports.crearSolicitud = async (req, res) => {
  try {
    const { tipo_servicio_id, marca_ac, tipo_ac, detalles, fecha, hora, direccion } = req.body;
    const userId = req.user.id;

    if (!tipo_servicio_id || !marca_ac || !tipo_ac || !fecha || !hora || !direccion) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "ID de usuario no válido." });
    }

    if (!ObjectId.isValid(tipo_servicio_id)) {
      return res.status(400).json({ error: "ID del tipo de servicio no válido." });
    }

    // 🔥 VERIFICAR SI EL USUARIO YA TIENE UNA SOLICITUD EN CURSO
    const solicitudEnCurso = await formularioModel.obtenerSolicitudEnCurso(userId);
    if (solicitudEnCurso) {
      return res.status(400).json({ error: "Ya tienes una solicitud en curso. Debes finalizarla antes de crear otra." });
    }

    // Crear nueva solicitud
    const solicitudId = await formularioModel.crearSolicitud({
      userId,
      tipo_servicio_id,
      marca_ac,
      tipo_ac,
      detalles,
      fecha,
      hora,
      direccion,
      estado: "pendiente"
    });

    res.status(201).json({
      mensaje: "Solicitud de servicio creada correctamente",
      solicitudId,
    });
  } catch (err) {
    console.error("❌ Error al crear la solicitud de servicio:", err.message);
    res.status(500).json({ error: "Error al crear la solicitud de servicio", detalle: err.message });
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
