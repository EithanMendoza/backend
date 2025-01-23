const progresoModel = require('../models/progresoModel');

// Obtener el estado de progreso de una solicitud
exports.obtenerEstadoProgreso = async (req, res) => {
  const { solicitudId } = req.params;
  const userId = req.user ? req.user.id : null;

  if (!userId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    const progreso = await progresoModel.obtenerUltimoEstadoDeSolicitud(solicitudId);

    if (!progreso) {
      return res.status(404).json({ error: 'No se encontró el progreso para esta solicitud.' });
    }

    res.status(200).json({
      solicitudId,
      estado: progreso.estado,
      detalles: progreso.detalles,
      timestamp: progreso.timestamp,
    });
  } catch (err) {
    console.error('Error al obtener el estado del progreso:', err);
    res.status(500).json({
      error: 'Error al obtener el estado del progreso del servicio.',
      detalle: err.message,
    });
  }
};
