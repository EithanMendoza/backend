const formularioModel = require('../models/formularioModel');
const { ObjectId } = require('mongodb');

// Crear una nueva solicitud de servicio
exports.crearSolicitud = async (req, res) => {
  const { tipo_servicio_id, marca_ac, tipo_ac, detalles, fecha, hora, direccion } = req.body;

  if (!tipo_servicio_id || !marca_ac || !tipo_ac || !fecha || !hora || !direccion) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  try {
    const userId = req.user.id;

    // Verificar si el usuario ya tiene una solicitud pendiente
    const solicitudActiva = await formularioModel.verificarSolicitudActiva(userId);
    if (solicitudActiva) {
      return res.status(400).json({ error: 'Ya tienes una solicitud pendiente en curso.' });
    }

    // Validar el tipo de servicio
    const nombreServicio = await formularioModel.validarTipoServicio(tipo_servicio_id);
    if (!nombreServicio) {
      return res.status(400).json({ error: 'Tipo de servicio no válido.' });
    }

    // Crear la solicitud
    const solicitudId = await formularioModel.crearSolicitud({
      userId,
      tipo_servicio_id,
      nombreServicio,
      marca_ac,
      tipo_ac,
      detalles,
      fecha,
      hora,
      direccion,
    });

    res.status(201).json({
      mensaje: 'Solicitud de servicio creada correctamente',
      solicitudId,
    });
  } catch (err) {
    console.error('Error al crear la solicitud de servicio:', err);
    res.status(500).json({ error: 'Error al crear la solicitud de servicio', detalle: err.message });
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
