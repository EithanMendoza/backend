const { MongoClient, ObjectId } = require('mongodb'); // ✅ IMPORTACIÓN CORRECTA

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  return client;
};

// ✅ Obtener todas las solicitudes pendientes (para técnicos) //modificacion
exports.getSolicitudesPendientes = async () => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  try {
    const solicitudes = await db.collection('solicitudes_servicio').find({ estado: 'pendiente' }).toArray();
    return solicitudes;
  } catch (error) {
    console.error("❌ Error al obtener solicitudes pendientes:", error);
    return [];
  } finally {
    await client.close();
  }
};

// Aceptar una solicitud
exports.aceptarSolicitud = async (solicitudId, tecnicoId, codigoInicial) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const result = await db.collection('solicitudes_servicio').updateOne(
    { _id: new ObjectId(solicitudId), estado: "pendiente" }, 
    { $set: { estado: "aceptada", tecnico_id: new ObjectId(tecnicoId), codigo: codigoInicial } }
  );

  await client.close();
  return result.modifiedCount > 0;
};

// Cancelar una solicitud
exports.cancelarSolicitud = async (solicitudId, tecnicoId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const result = await db.collection('solicitudes_servicio').updateOne(
    { _id: new ObjectId(solicitudId), tecnico_id: new ObjectId(tecnicoId), estado: "aceptada" },
    { $set: { estado: "cancelada" } }
  );

  await client.close();
  return result.modifiedCount > 0;
};

// Obtener solicitudes aceptadas por un técnico
exports.getSolicitudesAceptadasPorTecnico = async (tecnicoId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  try {
    console.log("🛠 Buscando solicitudes aceptadas para el técnico:", tecnicoId);

    const solicitudes = await db.collection('solicitudes_servicio').find({ 
      tecnico_id: new ObjectId(tecnicoId), // ✅ ObjectId definido correctamente
      estado: "aceptada" 
    }).toArray();

    console.log("📋 Solicitudes encontradas:", solicitudes.length);
    
    return solicitudes;
  } finally {
    await client.close();
  }
};
// 📌 Obtener la solicitud en curso de un usuario
exports.getSolicitudEnCurso = async (userId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  try {
    const solicitud = await db.collection('solicitudes_servicio').findOne({
      user_id: new ObjectId(userId),
      estado: { $in: ["pendiente", "en proceso", "aceptada"] } // Estados activos
    });

    return solicitud;
  } finally {
    await client.close();
  }
};  

// Obtener la solicitud activa de un usuario con detalles del servicio
exports.obtenerSolicitudPorUsuario = async (userId) => {
  const client = await connectToDatabase();
  const db = client.db("AirTecs3");

  try {
    const solicitud = await db.collection("solicitudes_servicio").aggregate([
      { $match: { user_id: new ObjectId(userId), estado: { $in: ["pendiente", "en proceso"] } } },
      {
        $lookup: {
          from: "tipos_servicio",
          localField: "tipo_servicio_id",
          foreignField: "_id",
          as: "detalle_servicio",
        },
      },
      { $unwind: { path: "$detalle_servicio", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          marca_ac: 1,
          tipo_ac: 1,
          detalles: 1,
          fecha: 1,
          hora: 1,
          direccion: 1,
          estado: 1,
          codigo_inicial: 1,
          created_at: 1,
          expires_at: 1,
          nombre_servicio: "$detalle_servicio.nombre_servicio",
        },
      },
    ]).toArray();

    return solicitud.length > 0 ? solicitud[0] : null;
  } finally {
    await client.close();
  }
};