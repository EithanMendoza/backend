const finalizacionModel = require('../models/finalizacion');

// Obtener servicios completados para el usuario autenticado
exports.getServiciosCompletados = async (req, res) => {
  const token = req.headers['authorization']; // Obtener el token de sesión del encabezado

  try {
    // Obtener el user_id desde el token de sesión
    const userId = await finalizacionModel.getUserIdFromSession(token);

    if (!userId) {
      return res.status(401).json({ error: 'Sesión no válida o expirada.' });
    }

    // Obtener los servicios completados
    const servicios = await finalizacionModel.getCompletedServicesByUser(userId);

    res.status(200).json(servicios);
  } catch (err) {
    console.error('Error al obtener los servicios completados:', err);
    res.status(500).json({ error: 'Error al obtener los servicios completados', detalle: err.message });
  }
};
