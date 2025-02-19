const { MongoClient, ObjectId } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  return client;
};


// Función para obtener el estado de la solicitud
exports.obtenerEstadoSolicitud = async (solicitudId) => {
  try {
    // Validar si el ID es un ObjectId válido antes de usarlo
    if (!ObjectId.isValid(solicitudId)) {
      console.log(`❌ ERROR: El ID de la solicitud no es válido en MongoDB: '${solicitudId}'`);
      return null;
    }

    const objectId = new ObjectId(solicitudId.trim());  // Limpiamos y convertimos el ID
    console.log(`ID recibido: '${solicitudId}'`);

    const client = await connectToDatabase();
    const db = client.db('AirTecs3');
    const progresoCollection = db.collection('progreso_servicio');

    // Buscar el estado de la solicitud en la colección
    const progreso = await progresoCollection.findOne({ solicitud_id: objectId });

    if (progreso) {
      console.log(`✅ Estado encontrado en BD: '${progreso.estado_solicitud}'`);
      return progreso.estado_solicitud;
    } else {
      console.log(`⚠ No se encontró estado en la BD para la solicitud: '${solicitudId}', devolviendo 'pendiente'`);
      return "pendiente";  // Estado por defecto si no existe en la BD
    }
  } catch (err) {
    console.error('❌ Error en obtenerEstadoSolicitud:', err);
    throw new Error('Error al obtener el estado de la solicitud.');
  }
};

// Verificar el código de confirmación
exports.verificarCodigoConfirmacion = async (solicitudId, codigoConfirmacion) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const solicitud = await db.collection('solicitudes_servicio').findOne({
    _id: new ObjectId(solicitudId),
    codigo_inicial: codigoConfirmacion,
  });

  await client.close();
  return !!solicitud;
};

// Obtener el último estado de progreso de una solicitud
exports.obtenerUltimoEstado = async (solicitudId) => {
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

// Registrar un nuevo estado de progreso
exports.registrarProgreso = async (solicitudId, tecnicoId, estado, detalles) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  await db.collection('progreso_servicio').insertOne({
    solicitud_id: new ObjectId(solicitudId),
    tecnico_id: new ObjectId(tecnicoId),
    estado,
    detalles,
    timestamp: new Date(),
  });

  await client.close();
};

// Obtener el user_id asociado a una solicitud
exports.obtenerUserIdDeSolicitud = async (solicitudId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  console.log("🔍 Buscando userId para la solicitud:", solicitudId); // Debugging

  const solicitud = await db.collection('solicitudes_servicio').findOne({
    _id: new ObjectId(solicitudId),
  });

  if (!solicitud) {
    console.error("❌ Error: No se encontró la solicitud en la base de datos.");
    await client.close();
    return null;
  }

  console.log("📌 Solicitud encontrada:", solicitud);
  console.log("🔎 userId encontrado:", solicitud.userId); // Asegúrate de que el campo sea correcto

  await client.close();
  return solicitud.userId || null; // Retorna el userId correcto
};
// Obtener los servicios finalizados para un técnico
exports.obtenerServiciosFinalizadosPorTecnico = async (tecnicoId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const servicios = await db.collection('solicitudes_servicio')
    .find({ tecnico_id: new ObjectId(tecnicoId), estado: 'completado' })
    .toArray();

  await client.close();
  return servicios;
};

// Obtener el último estado de progreso completo de una solicitud
exports.obtenerUltimoEstadoDeSolicitud = async (solicitudId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const progreso = await db.collection('progreso_servicio')
    .find({ solicitud_id: new ObjectId(solicitudId) })
    .sort({ _id: -1 }) // Orden descendente para obtener el más reciente
    .limit(1)
    .toArray();

  await client.close();
  return progreso.length > 0 ? progreso[0] : null; // Retorna el objeto completo del progreso
};

// ✅ Función para validar si un ID es de MongoDB
const esObjectIdValido = (id) => {
  return ObjectId.isValid(id) && (new ObjectId(id)).toString() === id;
};

// 🔍 Obtener progreso y detalles del servicio
exports.obtenerProgresoPorSolicitud = async (solicitudId) => {
  if (!esObjectIdValido(solicitudId)) {
    throw new Error('El ID de la solicitud no es válido.');
  }

  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const detallesServicio = await db.collection('solicitudes_servicio').aggregate([
    {
      $match: { _id: new ObjectId(solicitudId) },
    },
    {
      $lookup: {
        from: 'tecnicos_servicio',
        localField: 'tecnico_id',
        foreignField: '_id',
        as: 'tecnico',
      },
    },
    {
      $unwind: { path: '$tecnico', preserveNullAndEmptyArrays: true },
    },
    {
      $project: {
        _id: 0,
        nombre_servicio: 1,
        direccion: 1,
        fecha_solicitud: 1,
        hora_solicitud: 1,
        tipo_ac: 1,
        marca_ac: 1,
        detalles_servicio: 1,
        codigo_inicial: 1,
        estado_solicitud: 1,
        nombre_tecnico: '$tecnico.nombre_usuario',
        especialidad_tecnico: '$tecnico.especialidad',
      },
    },
  ]).toArray();

  const progreso = await db.collection('progreso_servicio').find({ solicitud_id: new ObjectId(solicitudId) })
    .sort({ timestamp: 1 })
    .toArray();

  await client.close();

  return {
    detallesServicio: detallesServicio.length > 0 ? detallesServicio[0] : null,
    progreso: progreso.map((entry) => ({
      estado_progreso: entry.estado,
      fecha_progreso: entry.timestamp,
      detalle_progreso: entry.detalles,
      nombre_tecnico: detallesServicio[0]?.nombre_tecnico,
      especialidad_tecnico: detallesServicio[0]?.especialidad_tecnico,
    })),
  };
};

// Obtener una solicitud por su ID
exports.obtenerSolicitudPorId = async (solicitudId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const solicitud = await db.collection('solicitudes_servicio').findOne({
    _id: new ObjectId(solicitudId),
  });

  await client.close();
  return solicitud;
};

exports.obtenerHistorialProgreso = async (solicitudId) => {
  const client = await connectToDatabase();
  const db = client.db("AirTecs3");

  try {
    const historial = await db.collection("progreso_servicio").aggregate([
      { $match: { solicitud_id: new ObjectId(solicitudId) } }, // Filtra por el ID de la solicitud
      {
        $lookup: {
          from: "tecnico_servicio", // Une con la tabla de técnicos
          localField: "tecnico_id",
          foreignField: "_id",
          as: "tecnico_info",
        },
      },
      { $unwind: { path: "$tecnico_info", preserveNullAndEmptyArrays: true } }, // Desanidar el array
      {
        $project: {
          _id: 0,
          estado: 1,
          detalles: 1,
          timestamp: 1,
          tecnico_email: { $ifNull: ["$tecnico_info.email", "gabito@gmail.com"] }, // Ahora debería mostrar el email del técnico correctamente
        },
      },
    ]).toArray();

    return historial;
  } finally {
    // No cerrar client.close() aquí
  }
};

/// ✅ Obtener todas las solicitudes en estado "finalizado" desde `progreso_servicio`//fake
// ✅ Obtener todas las solicitudes en estado "finalizado" desde `progreso_servicio`
exports.obtenerSolicitudesFinalizadasT = async () => {
  const client = await connectToDatabase();
  const db = client.db("AirTecs3");

  try {
    const solicitudesFinalizadas = await db.collection("progreso_servicio")
      .find({ estado: "finalizado" }) // Solo solicitudes finalizadas en progreso_servicio
      .toArray();

    return solicitudesFinalizadas;
  } finally {
    await client.close();
  }
};


