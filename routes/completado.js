const express = require('express');
const router = express.Router();
const db = require('../database'); // Conexión a la base de datos
const verificarSesion = require('../middleware/authMiddleware'); // Middleware de autenticación

// Endpoint para obtener el estado de progreso de una solicitud
router.get('/estado-progreso/:solicitudId', verificarSesion, async (req, res) => {
  const { solicitudId } = req.params;

  // Verificar que el usuario está autenticado
  const userId = req.user ? req.user.id : null;
  if (!userId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    const pool = await db.connect();

    // Consulta para obtener el estado actual del progreso del servicio
    const queryEstadoProgreso = `
      SELECT TOP 1 estado, detalles, timestamp 
      FROM progreso_servicio 
      WHERE solicitud_id = @solicitudId 
      ORDER BY id DESC
    `;

    const result = await pool.request()
      .input('solicitudId', db.BigInt, solicitudId)
      .query(queryEstadoProgreso);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'No se encontró el progreso para esta solicitud.' });
    }

    // Devolver el estado del progreso más reciente
    const progreso = result.recordset[0];
    res.status(200).json({
      solicitudId,
      estado: progreso.estado,
      detalles: progreso.detalles,
      timestamp: progreso.timestamp
    });
  } catch (err) {
    console.error('Error al obtener el estado del progreso:', err);
    res.status(500).json({
      error: 'Error al obtener el estado del progreso del servicio.',
      detalle: err.message
    });
  }
});

module.exports = router;
