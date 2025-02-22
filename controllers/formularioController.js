const formularioModel = require('../models/formularioModel');
const { MongoClient, ObjectId } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  return client;
};

exports.crearSolicitud = async (req, res) => {
  try {
    const { tipo_servicio_id, marca_ac, tipo_ac, detalles, fecha, hora, direccion } = req.body;

    if (!tipo_servicio_id || !marca_ac || !tipo_ac || !fecha || !hora || !direccion) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
    }

    const userId = new ObjectId(req.user.id);
    const client = await connectToDatabase();
    const db = client.db("AirTecs3");

    // ✅ Buscar por string en lugar de convertir a ObjectId
    const tipoServicio = await db.collection("tipos_servicio").findOne({ _id: tipo_servicio_id });

    if (!tipoServicio) {
      return res.status(404).json({ error: "Tipo de servicio no encontrado." });
    }

    const monto = tipoServicio.monto || 0; // ✅ Asignar el monto o 0 si no existe

    // 🔥 Crear la solicitud en la BD incluyendo el monto
    const { solicitudId, codigoConfirmacion } = await formularioModel.crearSolicitud({
      userId,
      tipo_servicio_id,  // ✅ Guardamos el string directamente
      marca_ac,
      tipo_ac,
      detalles,
      fecha,
      hora,
      direccion,
      estado: "pendiente",
      monto, // ✅ Nuevo campo agregado
    });

    res.status(201).json({
      mensaje: "Solicitud de servicio creada correctamente",
      solicitudId,
      codigo_inicial: codigoConfirmacion, // 🔥 Se envía al frontend
      monto, // ✅ Devolver el monto en la respuesta
    });

  } catch (err) {
    console.error("Error al crear la solicitud de servicio:", err);
    res.status(500).json({ error: "Error al crear la solicitud de servicio", detalle: err.message });
  }
};





// Obtener todas las solicitudes pendientes (para técnicos)
exports.obtenerSolicitudesDisponibles = async (req, res) => {
  try {
    const solicitudes = await formularioModel.obtenerSolicitudesDisponibles();
    res.status(200).json(solicitudes);
  } catch (err) {
    console.error('Error al obtener solicitudes disponibles:', err);
    res.status(500).json({ error: 'Error al obtener solicitudes disponibles', detalle: err.message });
  }
};

// Un técnico acepta la solicitud
exports.asignarTecnico = async (req, res) => {
  const { solicitudId } = req.params;
  const tecnicoId = req.user.id; // El técnico autenticado

  try {
    const asignado = await formularioModel.asignarTecnico(solicitudId, tecnicoId);
    if (!asignado) {
      return res.status(400).json({ error: 'Solicitud ya fue tomada o no existe.' });
    }

    res.status(200).json({ mensaje: 'Solicitud asignada al técnico correctamente.' });
  } catch (err) {
    console.error('Error al asignar técnico:', err);
    res.status(500).json({ error: 'Error al asignar técnico', detalle: err.message });
  }
};
// Eliminar solicitudes expiradas (cron job)
exports.eliminarSolicitudesExpiradas = async (req, res) => {
  try {
      const eliminadas = await formularioModel.eliminarSolicitudesExpiradas();
      res.status(200).json({ mensaje: `Se eliminaron ${eliminadas} solicitudes expiradas.` });
  } catch (err) {
      console.error('Error al eliminar solicitudes expiradas:', err);
      res.status(500).json({ error: 'Error al eliminar solicitudes expiradas', detalle: err.message });
  }
};
