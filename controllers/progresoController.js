const progresoModel = require('../models/progresoModel');
const { ObjectId } = require('mongodb');

// ✅ Función para validar si un ID es válido en MongoDB
const esObjectIdValido = (id) => {
  return ObjectId.isValid(id) && (new ObjectId(id)).toString() === id;
};


// Obtener el historial de progreso de una solicitud específica
exports.obtenerProgresoServicio = async (req, res) => {
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