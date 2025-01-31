const formularioModel = require('../models/formularioModel');
const { ObjectId } = require('mongodb');

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

    console.log("🔍 Verificando si el usuario ya tiene una solicitud en curso...");

    // 🔥 Verificar si el usuario ya tiene una solicitud en curso
    const solicitudEnCurso = await formularioModel.obtenerSolicitudEnCurso(userId);

    if (solicitudEnCurso) {
      console.log("❌ Usuario ya tiene una solicitud activa:", solicitudEnCurso);
      return res.status(400).json({ error: "Ya tienes una solicitud en curso. Debes finalizarla antes de crear otra." });
    }

    console.log("✅ Usuario NO tiene solicitudes en curso, procediendo a crear...");

    // Crear nueva solicitud y recibir el código de confirmación
    const { solicitudId, codigoConfirmacion } = await formularioModel.crearSolicitud({
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
      codigoConfirmacion, // 🔥 Enviar el código de confirmación en la respuesta
    });
  } catch (err) {
    console.error("❌ Error al crear la solicitud de servicio:", err.message);
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
