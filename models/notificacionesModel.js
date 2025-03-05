const { MongoClient, ObjectId } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  return client;
};

// 📌 Crear una notificación
exports.crearNotificacion = async ({ usuarioId, tecnicoId, mensaje }) => {
  try {
    const client = await connectToDatabase();
    const db = client.db("AirTecs3");
    const notificacionesCollection = db.collection("notificaciones");

    // 📌 Calcular fecha de expiración (7 días después)
    const fechaActual = new Date();
    const fechaExpiracion = new Date();
    fechaExpiracion.setDate(fechaActual.getDate() + 7);

    // 📌 Validación: solo uno de los dos debe existir
    if (!usuarioId && !tecnicoId) {
      throw new Error("Debe proporcionarse un usuarioId o un tecnicoId.");
    }

    const nuevaNotificacion = {
      mensaje,
      leida: false,
      fecha: fechaActual,
      expira: fechaExpiracion,
    };

    if (usuarioId) {
      nuevaNotificacion.usuarioId = new ObjectId(usuarioId);
    } else {
      nuevaNotificacion.tecnicoId = new ObjectId(tecnicoId);
    }

    await notificacionesCollection.insertOne(nuevaNotificacion);
    await client.close();
  } catch (error) {
    console.error("❌ Error al crear la notificación:", error);
  }
};

// 📌 Obtener notificaciones de un usuario/técnico
exports.obtenerNotificaciones = async (id, esTecnico) => {
  try {
    const client = await connectToDatabase();
    const db = client.db("AirTecs3");
    const notificacionesCollection = db.collection("notificaciones");

    const filtro = esTecnico ? { tecnicoId: new ObjectId(id) } : { usuarioId: new ObjectId(id) };

    const notificaciones = await notificacionesCollection.find(filtro).sort({ fecha: -1 }).toArray();
    await client.close();

    return notificaciones;
  } catch (error) {
    console.error("❌ Error al obtener notificaciones:", error);
    return [];
  }
};

// 📌 Marcar notificaciones como leídas
exports.marcarNotificacionLeida = async (notificacionId) => {
  try {
    const client = await connectToDatabase();
    const db = client.db("AirTecs3");
    const notificacionesCollection = db.collection("notificaciones");

    const resultado = await notificacionesCollection.updateOne(
      { _id: new ObjectId(notificacionId) },
      { $set: { leida: true } }
    );

    await client.close();
    return resultado.modifiedCount > 0;
  } catch (error) {
    console.error("❌ Error al marcar la notificación como leída:", error);
    return false;
  }
};

// 📌 Eliminar notificaciones expiradas automáticamente
exports.eliminarNotificacionesExpiradas = async () => {
  try {
    const client = await connectToDatabase();
    const db = client.db("AirTecs3");
    const notificacionesCollection = db.collection("notificaciones");

    const fechaActual = new Date();
    const resultado = await notificacionesCollection.deleteMany({ expira: { $lte: fechaActual } });

    await client.close();
    return resultado.deletedCount;
  } catch (error) {
    console.error("❌ Error al eliminar notificaciones expiradas:", error);
    return 0;
  }
};
