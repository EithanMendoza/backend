const homeModel = require('../models/homeModel');

// Obtener los servicios desde la base de datos
exports.obtenerServicios = async (req, res) => {
  try {
    const servicios = await homeModel.obtenerServicios();
    res.status(200).json(servicios);
  } catch (err) {
    console.error('Error al obtener los tipos de servicio:', err);
    res.status(500).json({
      error: 'Error al obtener los tipos de servicio',
      detalle: err.message,
    });
  }
};
