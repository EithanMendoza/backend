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
      tecnico_id: new ObjectId(tecnicoId),
      estado: "aceptada" 
    }).toArray();

    console.log("📋 Solicitudes encontradas en MongoDB:", JSON.stringify(solicitudes, null, 2));

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
      {
        $match: { 
          userId: new ObjectId(userId)  // Se asegura que se compara con ObjectId
        }
      },
      {
        $lookup: {
          from: "tipos_servicio",
          let: { tipoServicioId: { $toString: "$tipo_servicio_id" } }, // Convertimos a string
          pipeline: [
            {
              $match: {
                $expr: { $eq: [{ $toString: "$_id" }, "$$tipoServicioId"] } } // Comparación correcta
            }
          ],
          as: "detalle_servicio"
        }
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
          codigo: 1,
          tecnico_id: 1,
          created_at: 1,
          expires_at: 1,
          nombre_servicio: { $ifNull: ["$detalle_servicio.nombre_servicio", "No especificado"] }
        }
      }
    ]).toArray(); // Se coloca correctamente aquí

    return solicitud.length > 0 ? solicitud[0] : null;
  } finally {
    await client.close();
  }
};


// ✅ Obtener solicitudes pendientes con información del usuario y servicio
exports.getSolicitudesPendientesTecnicos = async () => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  try {
    const solicitudes = await db.collection('solicitudes_servicio')
      .aggregate([
        { $match: { estado: 'pendiente' } }, // Filtrar solo pendientes
        {
          $lookup: {
            from: 'usuarios', // Relacionar con la tabla de usuarios
            localField: 'userId',
            foreignField: '_id',
            as: 'usuario_info',
          },
        },
        { $unwind: { path: '$usuario_info', preserveNullAndEmptyArrays: true } }, // Desanidar el array
        {
          $lookup: {
            from: 'tipos_servicio', // Relacionar con la tabla de tipos de servicio
            localField: 'tipo_servicio_id',
            foreignField: '_id',
            as: 'servicio_info',
          },
        },
        { $unwind: { path: '$servicio_info', preserveNullAndEmptyArrays: true } }, // Desanidar el array
        {
          $project: {
            _id: 1, // ID de la solicitud
            userId: 1,
            direccion: 1,
            detalles: 1,
            fecha: 1,
            hora: 1,
            marca_ac: 1,
            tipo_ac: 1,
            tipo_servicio: '$servicio_info.nombre_servicio', // Nombre del tipo de servicio
          },
        },
      ])
      .toArray();

    return solicitudes;
  } finally {
    await client.close();
  }
};
