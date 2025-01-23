const progresoModel = require('../models/progresoModel');

// Obtener progreso y detalles del servicio
exports.obtenerProgresoServicio = async (req, res) => {
  const { solicitudId } = req.params;

  try {
    const progreso = await progresoModel.obtenerProgresoPorSolicitud(solicitudId);

    if (progreso.detallesServicio === null || progreso.progreso.length === 0) {
      return res.status(404).json({ message: 'No se encontró el progreso para la solicitud especificada' });
    }

    res.status(200).json(progreso);
  } catch (error) {
    console.error('Error al obtener el progreso y detalles del servicio:', error);
    res.status(500).json({
      message: 'Error al obtener el progreso y detalles del servicio',
      detalle: error.message,
    });
  }
};
