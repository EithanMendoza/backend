// Importar las dependencias necesarias
const express = require('express');
const router = express.Router();
const db = require('../database'); // Conexión a la base de datos
const verificarSesion = require('../middleware/authMiddleware'); // Middleware de autenticación

// Endpoint para reportar a un técnico
router.post('/reportar-tecnico', verificarSesion, async (req, res) => {
  const { solicitudId, tecnicoId, descripcion } = req.body; // Datos necesarios para el reporte
  const userId = req.user ? req.user.id : null;

  if (!userId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    const pool = await db.connect();

    // Verificar que la solicitud esté vinculada con el usuario y el técnico
    const queryVerificarSolicitud = `
      SELECT * 
      FROM solicitudes_servicio 
      WHERE id = @solicitudId AND user_id = @userId AND tecnico_id = @tecnicoId
    `;
    const verificarResult = await pool.request()
      .input('solicitudId', db.BigInt, solicitudId)
      .input('userId', db.BigInt, userId)
      .input('tecnicoId', db.BigInt, tecnicoId)
      .query(queryVerificarSolicitud);

    if (verificarResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada o no autorizada para el reporte.' });
    }

    // Insertar el reporte en la tabla "reportes_tecnicos"
    const queryInsertarReporte = `
      INSERT INTO reportes_tecnicos (usuario_id, tecnico_id, solicitud_id, descripcion, fecha, estado) 
      OUTPUT INSERTED.id
      VALUES (@userId, @tecnicoId, @solicitudId, @descripcion, GETDATE(), 'pendiente')
    `;
    const insertarResult = await pool.request()
      .input('userId', db.BigInt, userId)
      .input('tecnicoId', db.BigInt, tecnicoId)
      .input('solicitudId', db.BigInt, solicitudId)
      .input('descripcion', db.VarChar, descripcion)
      .query(queryInsertarReporte);

    const reporteId = insertarResult.recordset[0].id;

    res.status(201).json({ mensaje: 'Reporte creado correctamente', reporteId });
  } catch (err) {
    console.error('Error al procesar el reporte:', err);
    res.status(500).json({ error: 'Error interno al crear el reporte.', detalle: err.message });
  }
});

module.exports = router;
