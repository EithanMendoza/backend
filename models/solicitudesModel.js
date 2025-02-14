const { MongoClient, ObjectId } = require('mongodb'); // ✅ IMPORTACIÓN CORRECTA

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  return client;
};

exports.getSolicitudesPendientes = async () => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  try {
    const solicitudes = await db.collection('solicitudes_servicio').aggregate([
      {
        $match: { estado: 'pendiente' } // Solo traer las pendientes
      },
      {
        $lookup: {
          from: 'tipos_servicio', // La colección donde están los nombres de servicio
          localField: 'tipo_servicio_id',
          foreignField: '_id',
          as: 'tipo_servicio'
        }
      },
      {
        $unwind: '$tipo_servicio' // Desempaqueta el array del lookup
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          tipo_servicio_id: 1,
          nombre_servicio: '$tipo_servicio.nombre_servicio', // ✅ Trae el nombre del servicio
          marca_ac: 1,
          tipo_ac: 1,
          detalles: 1,
          fecha: 1,
          hora: 1,
          direccion: 1,
          estado: 1
        }
      }
    ]).toArray();

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

// Obtener solicitudes aceptadas por un técnico con lookup para nombre del servicio y usuario
exports.getSolicitudesAceptadasPorTecnico = async (tecnicoId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  try {
    console.log("🛠 Buscando solicitudes aceptadas para el técnico:", tecnicoId);

    const solicitudes = await db.collection('solicitudes_servicio').aggregate([
      {
        $match: {
          tecnico_id: new ObjectId(tecnicoId),
          estado: "aceptada"
        }
      },
      {
        $lookup: {
          from: 'servicios', // Colección de servicios
          localField: 'tipo_servicio', // Campo en solicitudes_servicio
          foreignField: 'tipo_servicio', // Campo relacionado en servicios
          as: 'servicio_info'
        }
      },
      {
        $lookup: {
          from: 'usuarios', // Colección de usuarios
          localField: 'user_id', // Campo en solicitudes_servicio
          foreignField: '_id', // Campo relacionado en usuarios
          as: 'usuario_info'
        }
      },
      {
        $project: {
          tipo_servicio: 1,
          detalles: 1,
          direccion: 1,
          fecha: 1,
          hora: 1,
          codigo: 1,
          'servicio_info.nombre_servicio': { $arrayElemAt: ['$servicio_info.nombre_servicio', 0] }, // Extraer el primer valor del array
          'usuario_info.nombre_usuario': { $arrayElemAt: ['$usuario_info.nombre_usuario', 0] }, // Extraer el primer valor del array
        }
      }
    ]).toArray();

    console.log("📋 Solicitudes encontradas con lookup:", JSON.stringify(solicitudes, null, 2));

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


exports.getSolicitudesPendientesTecnicos = async () => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  try {
    const solicitudes = await db.collection('solicitudes_servicio')
      .aggregate([
        { $match: { estado: 'pendiente' } }, // Filtrar solo pendientes

        // 🔹 Lookup para obtener información del servicio
        {
          $lookup: {
            from: 'tipos_servicio',
            let: { tipoServicioId: { $toString: "$tipo_servicio_id" } },
            pipeline: [
              { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$tipoServicioId"] } } }
            ],
            as: 'servicio_info',
          },
        },
        { $unwind: { path: '$servicio_info', preserveNullAndEmptyArrays: true } },

        // 🔹 Lookup para obtener información del usuario (con conversión a ObjectId)
        {
          $lookup: {
            from: 'usuarios', // La colección donde están los usuarios
            let: { usuarioId: { $toObjectId: "$userId" } }, // 🔹 Convertimos userId a ObjectId
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$usuarioId"] } } }
            ],
            as: 'usuario_info',
          },
        },
        { $unwind: { path: '$usuario_info', preserveNullAndEmptyArrays: true } },

        {
          $project: {
            _id: 1,
            userId: 1,
            nombre_usuario: "$usuario_info.nombre_usuario", // 🔹 Ahora sí obtenemos el nombre
            direccion: 1,
            detalles: 1,
            fecha: 1,
            hora: 1,
            marca_ac: 1,
            tipo_ac: 1,
            tipo_servicio: { $ifNull: ["$servicio_info.nombre_servicio", "No especificado"] }
          },
        },
      ])
      .toArray();

    console.log("🔍 Solicitudes con info de usuario:", solicitudes);
    return solicitudes;

  } finally {
    await client.close();
  }
};


exports.getSolicitudById = async (solicitudId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  try {
    const solicitud = await db.collection('solicitudes_servicio')
      .aggregate([
        { $match: { _id: new ObjectId(solicitudId) } }, // ✅ Filtrar por ID específico

        // 🔹 Lookup para obtener información del servicio
        {
          $lookup: {
            from: 'tipos_servicio',
            let: { tipoServicioId: { $toString: "$tipo_servicio_id" } },
            pipeline: [
              { $match: { $expr: { $eq: [{ $toString: "$_id" }, "$$tipoServicioId"] } } }
            ],
            as: 'servicio_info',
          },
        },
        { $unwind: { path: '$servicio_info', preserveNullAndEmptyArrays: true } },

        // 🔹 Lookup para obtener información del usuario
        {
          $lookup: {
            from: 'usuarios',
            let: { usuarioId: { $toObjectId: "$userId" } }, // ✅ Convertimos userId a ObjectId
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$usuarioId"] } } }
            ],
            as: 'usuario_info',
          },
        },
        { $unwind: { path: '$usuario_info', preserveNullAndEmptyArrays: true } },

        {
          $project: {
            _id: 1,
            userId: 1,
            nombre_usuario: "$usuario_info.nombre_usuario", // ✅ Nombre del usuario
            direccion: 1,
            detalles: 1,
            fecha: 1,
            hora: 1,
            marca_ac: 1,
            tipo_ac: 1,
            tipo_servicio: { $ifNull: ["$servicio_info.nombre_servicio", "No especificado"] }
          },
        },
      ])
      .toArray();

    return solicitud.length > 0 ? solicitud[0] : null; // ✅ Retornar solo un objeto, no un array
  } finally {
    await client.close();
  }
};

