const { MongoClient, ObjectId } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  return client;
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

  const solicitud = await db.collection('solicitudes_servicio').findOne({
    _id: new ObjectId(solicitudId),
  });

  await client.close();
  return solicitud ? solicitud.user_id : null;
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

// Obtener progreso y detalles del servicio por solicitud
exports.obtenerProgresoPorSolicitud = async (solicitudId) => {
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


