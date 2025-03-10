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
          estado: { $ne: "pagado" }
        }        
      },
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
          tipo_servicio: 1,
          detalles: 1,
          direccion: 1,
          fecha: 1,
          hora: 1,
          codigo: 1,
          marca_ac: 1,    // Nuevo campo
          tipo_servicio: { $ifNull: ["$servicio_info.nombre_servicio", "No especificado"] },
          nombre_usuario: "$usuario_info.nombre_usuario", // 🔹 Ahora sí obtenemos el nombre
          avatar: "$usuario_info.avatar",
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
          userId: new ObjectId(userId),
          estado: { $ne: "finalizado" } // ✅ Filtra solicitudes que NO estén pagadas
        }
      },
      {
        $sort: { created_at: -1 } // ✅ Ordena por la más reciente
      },
      { $limit: 1 }, // ✅ Solo trae la solicitud activa más reciente

      {
        $lookup: {
          from: "tipos_servicio",
          let: { tipoServicioId: { $toString: "$tipo_servicio_id" } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: [{ $toString: "$_id" }, "$$tipoServicioId"] }
              }
            }
          ],
          as: "detalle_servicio"
        }
      },
      { $unwind: { path: "$detalle_servicio", preserveNullAndEmptyArrays: true } },

      {
        $lookup: {
          from: 'usuarios',
          let: { usuarioId: { $toObjectId: "$userId" } },
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
          nombre_servicio: { $ifNull: ["$detalle_servicio.nombre_servicio", "No especificado"] },
          monto: { $ifNull: ["$detalle_servicio.monto", 0] },
          nombre_usuario: "$usuario_info.nombre_usuario",
        }
      }
    ]).toArray();

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
            avatar: "$usuario_info.avatar",
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
        { $match: { _id: new ObjectId(solicitudId) } },

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

        {
          $lookup: {
            from: 'usuarios',
            let: { usuarioId: { $toObjectId: "$userId" } },
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
            nombre_usuario: "$usuario_info.nombre_usuario",
            avatar: "$usuario_info.avatar",
            direccion: 1,
            detalles: 1,
            fecha: 1,
            hora: 1,
            marca_ac: 1,
            tipo_ac: 1,
            tipo_servicio: { $ifNull: ["$servicio_info.nombre_servicio", "No especificado"] },
            monto: { $ifNull: ["$servicio_info.monto", 0] } // ✅ Incluimos el monto
          },
        },
      ])
      .toArray();

    return solicitud.length > 0 ? solicitud[0] : null;
  } finally {
    await client.close();
  }
};

// Obtener solicitudes pagadas por un técnico con lookup para nombre del servicio y usuario
exports.getSolicitudesPagadasPorTecnico = async (tecnicoId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  try {
    console.log("🛠 Buscando solicitudes pagadas para el técnico:", tecnicoId);

    const solicitudes = await db.collection('solicitudes_servicio').aggregate([
      {
        $match: {
          tecnico_id: new ObjectId(tecnicoId), // 🔥 Filtra por técnico autenticado
          estado: "pagado" // 🔥 Solo traer solicitudes que están en estado "pagado"
        }        
      },
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
          tipo_servicio: 1,
          detalles: 1,
          direccion: 1,
          fecha: 1,
          hora: 1,
          codigo: 1,
          marca_ac: 1,    // Nuevo campo
          tipo_servicio: { $ifNull: ["$servicio_info.nombre_servicio", "No especificado"] },
          nombre_usuario: "$usuario_info.nombre_usuario", // 🔹 Ahora sí obtenemos el nombre
          avatar: "$usuario_info.avatar",
        }
      }
    ]).toArray();

    console.log("📋 Solicitudes pagadas encontradas:", JSON.stringify(solicitudes, null, 2));

    return solicitudes;
  } finally {
    await client.close();
  }
};


