const express = require('express');
const router = express.Router();
const db = require('../database'); // Conexión a la base de datos
const verificarSesion = require('../middleware/authMiddleware'); // Middleware de sesión

// Obtener servicios completados para el usuario autenticado
router.get('/finalizados', verificarSesion, async (req, res) => {
  const token = req.headers['authorization']; // Obtener el token de sesión del encabezado

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

    // Consulta para obtener servicios completados
    const queryServiciosCompletados = `
      SELECT 
        id, 
        nombre_servicio, 
        fecha, 
        hora, 
        direccion, 
        detalles
      FROM 
        solicitudes_servicio
      WHERE 
        user_id = @userId AND estado = 'completado'
      ORDER BY 
        fecha DESC
    `;
    const serviciosResult = await pool.request()
      .input('userId', db.BigInt, userId)
      .query(queryServiciosCompletados);

    res.status(200).json(serviciosResult.recordset);
  } catch (err) {
    console.error('Error al obtener los servicios completados:', err);
    res.status(500).json({ error: 'Error al obtener los servicios completados', detalle: err.message });
  }
});

module.exports = router;
