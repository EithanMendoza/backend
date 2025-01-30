const crypto = require('crypto');
const notificacionesModel = require('../models/notificaciones'); // Asumiendo que existe este modelo
const solicitudesModel = require('../models/solicitudesModel.js');
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
exports.aceptarSolicitud = async (req, res) => {
  const { solicitudId } = req.params;
  const tecnicoId = req.tecnico ? req.tecnico.id : null;

  console.log("🛠️ Técnico autenticado para aceptar solicitud:", tecnicoId);
  console.log("🔎 ID de la solicitud recibida:", solicitudId);

  if (!tecnicoId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    const codigoInicial = crypto.randomBytes(3).toString('hex').toUpperCase();

    const aceptada = await solicitudesModel.aceptarSolicitud(solicitudId, tecnicoId, codigoInicial);

    if (!aceptada) {
      console.warn("⚠️ Solicitud no encontrada o ya aceptada:", solicitudId);
      return res.status(404).json({ error: 'Solicitud no encontrada o ya ha sido aceptada.' });
    }

    console.log("✅ Solicitud aceptada:", solicitudId);

    res.status(200).json({ mensaje: 'Solicitud aceptada.' });
  } catch (err) {
    console.error("❌ Error al aceptar solicitud:", err);
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
