const notificacionesModel = require('../models/notificaciones');

// Obtener notificaciones para el usuario autenticado
exports.getNotificaciones = async (req, res) => {
  const token = req.headers['authorization'];

  try {
    const userId = req.user.id; // Se asume que el middleware de autenticación añade el userId al objeto req

    const notificaciones = await notificacionesModel.getNotificacionesByUser(userId);

    res.status(200).json(notificaciones);
  } catch (err) {
    console.error('Error al obtener las notificaciones:', err);
    res.status(500).json({ error: 'Error al obtener las notificaciones', detalle: err.message });
  }
};

// Marcar notificaciones como leídas
exports.markNotificacionesAsRead = async (req, res) => {
  const { ids } = req.body;
  const userId = req.user.id;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Debe proporcionar una lista de IDs de notificación.' });
  }

  try {
    const modifiedCount = await notificacionesModel.markNotificacionesAsRead(userId, ids);

    if (modifiedCount === 0) {
      return res.status(404).json({ error: 'No se encontraron notificaciones para actualizar.' });
    }

    res.status(200).json({ mensaje: 'Notificaciones marcadas como leídas correctamente.' });
  } catch (err) {
    console.error('Error al marcar las notificaciones como leídas:', err);
    res.status(500).json({ error: 'Error al marcar las notificaciones como leídas', detalle: err.message });
  }
};

// Eliminar notificación específica
exports.deleteNotificacion = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const deleted = await notificacionesModel.deleteNotificacion(userId, id);

    if (!deleted) {
      return res.status(404).json({ error: 'Notificación no encontrada o ya eliminada.' });
    }

    res.status(200).json({ mensaje: 'Notificación eliminada correctamente.' });
  } catch (err) {
    console.error('Error al eliminar la notificación:', err);
    res.status(500).json({ error: 'Error al eliminar la notificación', detalle: err.message });
  }
};
