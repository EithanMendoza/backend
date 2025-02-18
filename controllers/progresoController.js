const progresoModel = require('../models/progresoModel');
const { MongoClient, ObjectId } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  return client;
};

// ✅ Función para validar si un ID es válido en MongoDB
const esObjectIdValido = (id) => {
  return ObjectId.isValid(id) && (new ObjectId(id)).toString() === id;
};

// Definir los estados en orden
const ESTADOS_SERVICIO = ['pendiente', 'en camino', 'en lugar', 'en proceso', 'finalizado'];

// Obtener el historial de progreso de una solicitud específica
exports.obtenerProgresoServicio = async (req, res) => {
  try {
    const { solicitudId } = req.params;

    if (!ObjectId.isValid(solicitudId)) {
      return res.status(400).json({ error: "ID de solicitud inválido." });
    }

    const historial = await progresoModel.obtenerHistorialProgreso(solicitudId);

    if (!historial || historial.length === 0) {
      return res.status(404).json({ error: "No hay historial de progreso para esta solicitud." });
    }

    res.status(200).json(historial);
  } catch (err) {
    console.error("❌ Error al obtener el historial de progreso:", err);
    res.status(500).json({ error: "Error al obtener el historial de progreso.", detalle: err.message });
  }
};

// ✅ Obtener todas las solicitudes en estado "finalizado" desde `progreso_servicio`
exports.obtenerSolicitudesFinalizadasT = async (req, res) => {
  try {
    const solicitudes = await progresoModel.obtenerSolicitudesFinalizadasT();

    if (!solicitudes || solicitudes.length === 0) {
      return res.status(404).json({ error: "No hay solicitudes finalizadas disponibles." });
    }

    res.status(200).json(solicitudes);
  } catch (err) {
    console.error("❌ Error al obtener solicitudes finalizadas:", err);
    res.status(500).json({ error: "Error interno al obtener solicitudes finalizadas.", detalle: err.message });
  }
};

// Controller: obtener estado de la solicitud
// Controller: obtener estado de la solicitud
exports.getEstadoSolicitud = async (req, res) => {
  const { solicitudId } = req.params;

  try {
    const client = await connectToDatabase();
    const db = client.db('AirTecs3');
    const progresoCollection = db.collection('progreso_servicio');

    // ✅ Verificar si el ID es válido antes de convertirlo
    if (!ObjectId.isValid(solicitudId)) {
      console.log(`❌ ID inválido recibido: ${solicitudId}`);
      return res.status(400).json({ error: "El ID de la solicitud no es válido." });
    }

    // ✅ Convertir el ID a ObjectId
    const solicitudObjectId = new ObjectId(solicitudId);

    // 🔍 Buscar en la colección 'progreso_servicio' el estado de la solicitud
    const progreso = await progresoCollection.findOne({ solicitud_id: solicitudObjectId });

    if (progreso) {
      console.log(`🟢 Estado encontrado en BD: ${progreso.estado_solicitud}`);
      return res.status(200).json({ estado_solicitud: progreso.estado_solicitud });
    } else {
      console.log("🔴 No se encontró el progreso, devolviendo 'pendiente'");
      return res.status(200).json({ estado_solicitud: 'pendiente' });
    }
  } catch (err) {
    console.error('❌ Error al obtener el estado de la solicitud:', err);
    return res.status(500).json({ error: 'Error al obtener el estado de la solicitud.', detalle: err.message });
  }
};

exports.actualizarEstadoSolicitud = async (req, res) => {
  const { solicitudId } = req.params;
  const { estado, detalles } = req.body;

  if (!estado) {
      return res.status(400).json({ error: "El estado es requerido." });
  }

  try {
      const client = await connectToDatabase();
      const db = client.db('AirTecs3');

      const solicitudObjectId = new ObjectId(solicitudId);

      // 🔥 Obtener el estado actual de la solicitud
      const progresoActual = await db.collection('progreso_servicio').findOne({ solicitud_id: solicitudObjectId });

      let estadoActual = progresoActual ? progresoActual.estado_solicitud.trim().toLowerCase() : 'pendiente';
      let estadoNuevo = estado.trim().toLowerCase();

      // ✅ Obtener los índices ANTES de imprimirlos
      const indexEstadoActual = ESTADOS_SERVICIO.indexOf(estadoActual);
      const indexNuevoEstado = ESTADOS_SERVICIO.indexOf(estadoNuevo);

      console.log(`🟢 Estado actual en BD: '${estadoActual}'`);
      console.log(`🔵 Estado recibido en la solicitud: '${estadoNuevo}'`);
      console.log(`📌 Comparando índice en ESTADOS_SERVICIO: ${indexEstadoActual} ➡ ${indexNuevoEstado}`);

      // ✅ Validar que ambos índices existen en la lista de estados
      if (indexEstadoActual === -1 || indexNuevoEstado === -1) {
          return res.status(400).json({ error: "El estado proporcionado no es válido." });
      }

      // ✅ Verificar que el estado sigue la secuencia correcta
      if (indexNuevoEstado !== indexEstadoActual + 1) {
          return res.status(400).json({ error: "El estado no sigue el orden requerido." });
      }

      // 🔥 Actualizar el estado en la base de datos
      await db.collection('progreso_servicio').updateOne(
          { solicitud_id: solicitudObjectId },
          {
              $set: {
                  estado_solicitud: estadoNuevo,
                  detalles: detalles || "",
                  fecha_actualizacion: new Date()
              }
          },
          { upsert: true }
      );

      res.status(200).json({ mensaje: `Estado actualizado a '${estadoNuevo}' correctamente.` });
  } catch (error) {
      console.error("❌ Error al actualizar el estado de la solicitud:", error);
      res.status(500).json({ error: "Error interno al actualizar el estado de la solicitud.", detalle: error.message });
  }
};
