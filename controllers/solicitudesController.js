const crypto = require('crypto');
const notificacionesModel = require('../models/notificaciones'); // Asumiendo que existe este modelo

// Obtener solicitudes pendientes
exports.getSolicitudesPendientes = async (req, res) => {
  try {
    const solicitudes = await solicitudesModel.getSolicitudesPendientes();
    res.status(200).json(solicitudes);
  } catch (err) {
    console.error('Error al obtener las solicitudes pendientes:', err);
    res.status(500).json({ error: 'Error al obtener las solicitudes pendientes', detalle: err.message });
  }
};

// Aceptar una solicitud
exports.aceptarSolicitud = async (req, res) => {
  const { solicitudId } = req.params;
  const tecnicoId = req.tecnico ? req.tecnico.id : null;

  if (!tecnicoId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    // Generar un código aleatorio
    const codigoInicial = crypto.randomBytes(3).toString('hex').toUpperCase();

    const aceptada = await solicitudesModel.aceptarSolicitud(solicitudId, tecnicoId, codigoInicial);

    if (!aceptada) {
      return res.status(404).json({ error: 'Solicitud no encontrada o ya ha sido aceptada.' });
    }

    // Crear notificación
    const mensaje = `Un técnico ha sido asignado a tu solicitud. Código: ${codigoInicial}`;
    await notificacionesModel.crearNotificacion(tecnicoId, mensaje);

    res.status(200).json({ mensaje: 'Solicitud aceptada. El usuario ha sido notificado.' });
  } catch (err) {
    console.error('Error al aceptar la solicitud:', err);
    res.status(500).json({ error: 'Error al aceptar la solicitud.', detalle: err.message });
  }
};

// Cancelar una solicitud
exports.cancelarSolicitud = async (req, res) => {
  const { solicitudId } = req.params;
  const tecnicoId = req.tecnico ? req.tecnico.id : null;

  if (!tecnicoId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    const cancelada = await solicitudesModel.cancelarSolicitud(solicitudId, tecnicoId);

    if (!cancelada) {
      return res.status(404).json({ error: 'Solicitud no encontrada o no se puede cancelar.' });
    }

    res.status(200).json({ mensaje: 'Solicitud cancelada correctamente.' });
  } catch (err) {
    console.error('Error al cancelar la solicitud:', err);
    res.status(500).json({ error: 'Error al cancelar la solicitud.', detalle: err.message });
  }
};

// Obtener solicitudes aceptadas
exports.getSolicitudesAceptadas = async (req, res) => {
  const tecnicoId = req.tecnico ? req.tecnico.id : null;

  if (!tecnicoId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    const solicitudes = await solicitudesModel.getSolicitudesAceptadasPorTecnico(tecnicoId);
    res.status(200).json(solicitudes);
  } catch (err) {
    console.error('Error al obtener las solicitudes aceptadas:', err);
    res.status(500).json({ error: 'Error al obtener las solicitudes aceptadas.', detalle: err.message });
  }
};
