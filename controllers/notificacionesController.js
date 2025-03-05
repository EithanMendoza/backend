const notificacionesModel = require('../models/notificacionesModel');

// 📌 Crear una notificación (se usará dentro de otros controladores)
exports.crearNotificacion = async (req, res) => {
  try {
    const { usuarioId, tecnicoId, mensaje } = req.body;

    if (!usuarioId && !tecnicoId) {
      return res.status(400).json({ error: "Debe enviarse un usuarioId o un tecnicoId." });
    }

    await notificacionesModel.crearNotificacion({ usuarioId, tecnicoId, mensaje });

    res.status(201).json({ mensaje: "Notificación creada correctamente." });
  } catch (error) {
    console.error("❌ Error al crear la notificación:", error);
    res.status(500).json({ error: "Error interno al crear la notificación." });
  }
};



// 📌 Obtener notificaciones SOLO del usuario o técnico autenticado
exports.obtenerNotificaciones = async (req, res) => {
  try {
    const userId = req.user?.id || req.tecnico?.id;  // Obtener ID del usuario o técnico autenticado
    const esTecnico = !!req.tecnico; // Determinar si es técnico

    if (!userId) {
      return res.status(400).json({ error: "ID de usuario o técnico no encontrado." });
    }

    const notificaciones = await notificacionesModel.obtenerNotificaciones(userId, esTecnico);
    res.status(200).json(notificaciones);
  } catch (error) {
    console.error("❌ Error al obtener notificaciones:", error);
    res.status(500).json({ error: "Error interno al obtener notificaciones." });
  }
};

// 📌 Marcar una notificación como leída
exports.marcarNotificacionLeida = async (req, res) => {
  try {
    const { notificacionId } = req.params;

    const resultado = await notificacionesModel.marcarNotificacionLeida(notificacionId);
    if (!resultado) {
      return res.status(404).json({ error: "Notificación no encontrada." });
    }

    res.status(200).json({ mensaje: "Notificación marcada como leída." });
  } catch (error) {
    console.error("❌ Error al marcar la notificación como leída:", error);
    res.status(500).json({ error: "Error interno al marcar la notificación como leída." });
  }
};

// 📌 Eliminar notificaciones expiradas (cron job)
exports.eliminarNotificacionesExpiradas = async (req, res) => {
  try {
    const eliminadas = await notificacionesModel.eliminarNotificacionesExpiradas();
    res.status(200).json({ mensaje: `Se eliminaron ${eliminadas} notificaciones expiradas.` });
  } catch (error) {
    console.error("❌ Error al eliminar notificaciones expiradas:", error);
    res.status(500).json({ error: "Error interno al eliminar notificaciones expiradas." });
  }
};
