const express = require('express');
const router = express.Router();
const db = require('../database'); // Conexión a la base de datos
const verificarTecnico = require('../middleware/tecnicosmiddleware'); // Middleware de autenticación para el técnico

// Endpoint para obtener servicios completados para el técnico autenticado
router.get('/servicios-completados', verificarTecnico, async (req, res) => {
  const tecnicoId = req.tecnico ? req.tecnico.id : null;

  if (!tecnicoId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    const pool = await db.connect();

    const queryServiciosCompletados = `
      SELECT 
        s.id AS solicitudId,
        p.fecha AS fechaPago,
        p.monto,
        u.id AS userId,
        CONCAT(pr.nombre, ' ', pr.apellido) AS nombreUsuario
      FROM 
        solicitudes_servicio s
      JOIN 
        usuarios u ON s.user_id = u.id
      JOIN 
        perfiles pr ON pr.user_id = u.id
      JOIN 
        pagos p ON p.solicitud_id = s.id
      WHERE 
        s.tecnico_id = @tecnicoId 
        AND s.estado = 'completado'
        AND p.estado = 'completado'
      ORDER BY 
        p.fecha DESC
    `;

    const result = await pool.request()
      .input('tecnicoId', db.BigInt, tecnicoId)
      .query(queryServiciosCompletados);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error al obtener los servicios completados:', err);
    res.status(500).json({ error: 'Error al obtener los servicios completados', detalle: err.message });
  }
});

module.exports = router;
