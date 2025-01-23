const serviciosFinalizadosModel = require('../models/serviciosfinalizadosT');

// Obtener servicios completados para el técnico autenticado
exports.getServiciosCompletados = async (req, res) => {
  const tecnicoId = req.tecnico ? req.tecnico.id : null;

  if (!tecnicoId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    const servicios = await serviciosFinalizadosModel.getServiciosCompletadosPorTecnico(tecnicoId);

    res.status(200).json(servicios);
  } catch (err) {
    console.error('Error al obtener los servicios completados:', err);
    res.status(500).json({ error: 'Error al obtener los servicios completados', detalle: err.message });
  }
};
