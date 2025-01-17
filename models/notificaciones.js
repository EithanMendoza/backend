const express = require('express');
const router = express.Router();
const db = require('../database'); // Conexión a la base de datos
const verificarSesion = require('../middleware/authMiddleware'); // Middleware de sesión

// Obtener notificaciones para el usuario autenticado
router.get('/notificaciones', verificarSesion, async (req, res) => {
  const token = req.headers['authorization'];

  try {
    const pool = await db.connect();

    // Obtener el user_id desde el token de sesión
    const queryUserId = `
      SELECT user_id 
      FROM login 
      WHERE session_token = @token AND tiempo_cierre IS NULL
    `;
    const userIdResult = await pool.request()
      .input('token', db.VarChar, token)
      .query(queryUserId);

    if (userIdResult.recordset.length === 0) {
      return res.status(401).json({ error: 'Sesión no válida o expirada.' });
    }

    const userId = userIdResult.recordset[0].user_id;

    // Obtener notificaciones no leídas del usuario
    const queryNotificaciones = `
      SELECT id, mensaje, fecha, leida 
      FROM notificaciones 
      WHERE user_id = @userId 
      ORDER BY fecha DESC
    `;
    const notificacionesResult = await pool.request()
      .input('userId', db.BigInt, userId)
      .query(queryNotificaciones);

    res.status(200).json(notificacionesResult.recordset);
  } catch (err) {
    console.error('Error al obtener las notificaciones:', err);
    res.status(500).json({ error: 'Error al obtener las notificaciones', detalle: err.message });
  }
});

// Marcar notificaciones como leídas
router.put('/notificaciones/marcar-leidas', verificarSesion, async (req, res) => {
  const { ids } = req.body; // Lista de IDs de notificación a marcar como leídas
  const token = req.headers['authorization'];

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'Debe proporcionar una lista de IDs de notificación.' });
  }

  try {
    const pool = await db.connect();

    // Obtener el user_id desde el token de sesión
    const queryUserId = `
      SELECT user_id 
      FROM login 
      WHERE session_token = @token AND tiempo_cierre IS NULL
    `;
    const userIdResult = await pool.request()
      .input('token', db.VarChar, token)
      .query(queryUserId);

    if (userIdResult.recordset.length === 0) {
      return res.status(401).json({ error: 'Sesión no válida o expirada.' });
    }

    const userId = userIdResult.recordset[0].user_id;

    // Actualizar las notificaciones a leídas
    const queryMarcarLeidas = `
      UPDATE notificaciones 
      SET leida = 1 
      WHERE id IN (${ids.map(() => '@id').join(',')}) AND user_id = @userId
    `;

    const request = pool.request().input('userId', db.BigInt, userId);
    ids.forEach((id, index) => {
      request.input(`id${index}`, db.BigInt, id);
    });

    await request.query(queryMarcarLeidas);

    res.status(200).json({ mensaje: 'Notificaciones marcadas como leídas correctamente' });
  } catch (err) {
    console.error('Error al marcar las notificaciones como leídas:', err);
    res.status(500).json({ error: 'Error al marcar las notificaciones como leídas', detalle: err.message });
  }
});

// Eliminar notificación específica
router.delete('/notificaciones/eliminar/:id', verificarSesion, async (req, res) => {
  const { id } = req.params;
  const token = req.headers['authorization'];

  try {
    const pool = await db.connect();

    // Obtener el user_id desde el token de sesión
    const queryUserId = `
      SELECT user_id 
      FROM login 
      WHERE session_token = @token AND tiempo_cierre IS NULL
    `;
    const userIdResult = await pool.request()
      .input('token', db.VarChar, token)
      .query(queryUserId);

    if (userIdResult.recordset.length === 0) {
      return res.status(401).json({ error: 'Sesión no válida o expirada.' });
    }

    const userId = userIdResult.recordset[0].user_id;

    // Eliminar la notificación específica del usuario
    const queryEliminarNotificacion = `
      DELETE FROM notificaciones 
      WHERE id = @id AND user_id = @userId
    `;
    const result = await pool.request()
      .input('id', db.BigInt, id)
      .input('userId', db.BigInt, userId)
      .query(queryEliminarNotificacion);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Notificación no encontrada o ya eliminada.' });
    }

    res.status(200).json({ mensaje: 'Notificación eliminada correctamente.' });
  } catch (err) {
    console.error('Error al eliminar la notificación:', err);
    res.status(500).json({ error: 'Error al eliminar la notificación', detalle: err.message });
  }
});

module.exports = router;
