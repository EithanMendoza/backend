const progresoModel = require('../models/progresoModel');
const { ObjectId } = require('mongodb');

// ✅ Función para validar si un ID es válido en MongoDB
const esObjectIdValido = (id) => {
  return ObjectId.isValid(id) && (new ObjectId(id)).toString() === id;
};

exports.obtenerProgresoServicio = async (req, res) => {
  const { solicitudId } = req.params;

  // 🚨 Validar si `solicitudId` es un ObjectId válido antes de continuar
  if (!esObjectIdValido(solicitudId)) {
    return res.status(400).json({ 
      message: 'El ID de la solicitud no es válido. Debe ser un ObjectId de 24 caracteres.',
      solicitudIdRecibido: solicitudId
    });
  }

  try {
    const progreso = await progresoModel.obtenerProgresoPorSolicitud(solicitudId);

    if (!progreso || progreso.detallesServicio === null || progreso.progreso.length === 0) {
      return res.status(404).json({ message: 'No se encontró el progreso para la solicitud especificada' });
    }

    res.status(200).json(progreso);
  } catch (error) {
    console.error('❌ Error al obtener el progreso y detalles del servicio:', error);
    res.status(500).json({
      message: 'Error al obtener el progreso y detalles del servicio',
      detalle: error.message,
    });
  }
};

// Obtener el historial de progreso de una solicitud específica
exports.obtenerProgresoServicio1 = async (req, res) => {
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