const formularioModel = require('../models/formularioModel');

// Crear una solicitud de servicio
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

// Cancelar una solicitud de servicio
exports.cancelarSolicitud = async (req, res) => {
  const { solicitudId } = req.params;
  const userId = req.user.id;

  try {
    // Verificar el estado del progreso
    const estado = await formularioModel.obtenerEstadoProgreso(solicitudId);
    if (estado === 'en_camino') {
      return res.status(400).json({ error: 'No se puede cancelar la solicitud: el técnico ya está en camino.' });
    }

    // Cancelar la solicitud
    const cancelada = await formularioModel.cancelarSolicitud(solicitudId, userId);
    if (!cancelada) {
      return res.status(404).json({ error: 'Solicitud no encontrada o no se puede cancelar.' });
    }

    res.status(200).json({ mensaje: 'Solicitud cancelada correctamente.' });
  } catch (err) {
    console.error('Error al cancelar la solicitud:', err);
    res.status(500).json({ error: 'Error al cancelar la solicitud', detalle: err.message });
  }
};

// Obtener estado de solicitudes pendientes
exports.obtenerSolicitudesPendientes = async (req, res) => {
  const userId = req.user.id;

  try {
    const solicitud = await formularioModel.obtenerSolicitudPendiente(userId);
    if (!solicitud) {
      return res.status(404).json({ mensaje: 'No tienes solicitudes activas registradas.' });
    }

    res.status(200).json(solicitud);
  } catch (err) {
    console.error('Error al obtener el estado de la solicitud:', err);
    res.status(500).json({ error: 'Error al obtener el estado de la solicitud', detalle: err.message });
  }
};
