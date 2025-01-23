const reportesModel = require('../models/reportar');

// Crear un reporte para un técnico
exports.reportarTecnico = async (req, res) => {
  const { solicitudId, tecnicoId, descripcion } = req.body;
  const userId = req.user ? req.user.id : null;

  if (!userId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    // Verificar que la solicitud esté vinculada al usuario y al técnico
    const solicitud = await reportesModel.verificarSolicitud(solicitudId, userId, tecnicoId);

    if (!solicitud) {
      return res.status(404).json({ error: 'Solicitud no encontrada o no autorizada para el reporte.' });
    }

    // Insertar el reporte en la base de datos
    const reporteId = await reportesModel.insertarReporte(userId, tecnicoId, solicitudId, descripcion);

    res.status(201).json({ mensaje: 'Reporte creado correctamente', reporteId });
  } catch (err) {
    console.error('Error al procesar el reporte:', err);
    res.status(500).json({ error: 'Error interno al crear el reporte.', detalle: err.message });
  }
};
