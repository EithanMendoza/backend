const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database'); // Conexión a la base de datos
const verificarTecnico = require('../middleware/tecnicosmiddleware'); // Middleware de autenticación

// Endpoint para obtener solicitudes en estado pendiente (para técnicos)
router.get('/solicitudes-pendientes', verificarTecnico, async (req, res) => {
  try {
    const pool = await db.connect();

    const query = `
      SELECT 
        s.id, 
        s.user_id, 
        s.tipo_servicio_id, 
        s.nombre_servicio, 
        s.marca_ac, 
        s.tipo_ac, 
        s.detalles, 
        s.fecha, 
        s.hora, 
        s.direccion,
        u.username AS nombre_usuario,
        u.email AS correo_usuario
      FROM 
        solicitudes_servicio s
      JOIN 
        usuarios u ON s.user_id = u.id
      WHERE 
        s.estado = 'pendiente'
    `;

    const result = await pool.request().query(query);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error al obtener las solicitudes pendientes:', err);
    res.status(500).json({
      error: 'Error al obtener las solicitudes pendientes',
      detalle: err.message,
    });
  }
});

// Endpoint para aceptar una solicitud
router.put('/aceptar-solicitud/:solicitudId', verificarTecnico, async (req, res) => {
  const { solicitudId } = req.params;
  const tecnicoId = req.tecnico ? req.tecnico.id : null;

  if (!tecnicoId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    const pool = await db.connect();

    // Verificar si el técnico tiene solicitudes en estado "asignado"
    const queryVerificarSolicitudActiva = `
      SELECT id FROM solicitudes_servicio 
      WHERE tecnico_id = @tecnicoId AND estado = 'asignado'
    `;
    const verificarResult = await pool.request()
      .input('tecnicoId', db.BigInt, tecnicoId)
      .query(queryVerificarSolicitudActiva);

    if (verificarResult.recordset.length > 0) {
      return res
        .status(400)
        .json({ error: 'El técnico ya tiene una solicitud asignada en curso.' });
    }

    // Generar un código aleatorio de 6 dígitos solo para el usuario
    const codigoInicial = crypto.randomBytes(3).toString('hex').toUpperCase();

    // Cambiar el estado de la solicitud a "asignado", registrar el técnico y guardar el código inicial
    const queryAceptarSolicitud = `
      UPDATE solicitudes_servicio 
      SET estado = 'asignado', tecnico_id = @tecnicoId, codigo_inicial = @codigoInicial
      WHERE id = @solicitudId AND estado = 'pendiente'
    `;
    const aceptarResult = await pool.request()
      .input('tecnicoId', db.BigInt, tecnicoId)
      .input('codigoInicial', db.VarChar, codigoInicial)
      .input('solicitudId', db.BigInt, solicitudId)
      .query(queryAceptarSolicitud);

    if (aceptarResult.rowsAffected[0] === 0) {
      return res
        .status(404)
        .json({ error: 'Solicitud no encontrada o ya ha sido aceptada.' });
    }

    // Obtener el user_id de la solicitud aceptada para enviar la notificación
    const queryUserId = `
      SELECT user_id FROM solicitudes_servicio WHERE id = @solicitudId
    `;
    const userResult = await pool.request()
      .input('solicitudId', db.BigInt, solicitudId)
      .query(queryUserId);

    if (userResult.recordset.length === 0) {
      return res.status(500).json({ error: 'Error al obtener el usuario para la notificación.' });
    }

    const userId = userResult.recordset[0].user_id;
    const mensaje = `Un técnico ha sido asignado a tu solicitud. Usa este código para iniciar el servicio: ${codigoInicial}`;

    // Insertar la notificación en la tabla 'notificaciones'
    const queryNotificacion = `
      INSERT INTO notificaciones (user_id, mensaje) VALUES (@userId, @mensaje)
    `;
    await pool.request()
      .input('userId', db.BigInt, userId)
      .input('mensaje', db.VarChar, mensaje)
      .query(queryNotificacion);

    res.status(200).json({
      mensaje: 'Solicitud aceptada. El usuario ha sido notificado.',
    });
  } catch (err) {
    console.error('Error al aceptar la solicitud:', err);
    res.status(500).json({
      error: 'Error al aceptar la solicitud.',
      detalle: err.message,
    });
  }
});

// Endpoint para cancelar una solicitud
router.put('/cancelar-solicitud/:solicitudId', verificarTecnico, async (req, res) => {
  const { solicitudId } = req.params;
  const tecnicoId = req.tecnico ? req.tecnico.id : null;

  if (!tecnicoId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    const pool = await db.connect();

    // Verificar que no haya ningún estado registrado en progreso_servicio para esta solicitud
    const queryVerificarProgreso = `
      SELECT estado FROM progreso_servicio 
      WHERE solicitud_id = @solicitudId AND tecnico_id = @tecnicoId
    `;
    const progresoResult = await pool.request()
      .input('solicitudId', db.BigInt, solicitudId)
      .input('tecnicoId', db.BigInt, tecnicoId)
      .query(queryVerificarProgreso);

    if (progresoResult.recordset.length > 0) {
      return res
        .status(400)
        .json({ error: 'No se puede cancelar la solicitud porque ya se ha registrado un progreso.' });
    }

    // Cambiar el estado de la solicitud a "cancelado"
    const queryCancelarSolicitud = `
      UPDATE solicitudes_servicio 
      SET estado = 'cancelado' 
      WHERE id = @solicitudId AND tecnico_id = @tecnicoId
    `;
    const cancelarResult = await pool.request()
      .input('solicitudId', db.BigInt, solicitudId)
      .input('tecnicoId', db.BigInt, tecnicoId)
      .query(queryCancelarSolicitud);

    if (cancelarResult.rowsAffected[0] === 0) {
      return res.status(404).json({
        error: 'Solicitud no encontrada o no se puede cancelar.',
      });
    }

    res.status(200).json({
      mensaje: 'Solicitud cancelada correctamente por el técnico.',
    });
  } catch (err) {
    console.error('Error al cancelar la solicitud:', err);
    res.status(500).json({
      error: 'Error al cancelar la solicitud.',
      detalle: err.message,
    });
  }
});

// Endpoint para obtener las solicitudes aceptadas (en estado asignado)
router.get('/solicitudes-aceptadas', verificarTecnico, async (req, res) => {
  const tecnicoId = req.tecnico ? req.tecnico.id : null;

  if (!tecnicoId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    const pool = await db.connect();

    const query = `
      SELECT 
        s.id, 
        s.nombre_servicio, 
        s.marca_ac, 
        s.tipo_ac, 
        s.detalles, 
        s.fecha, 
        s.hora, 
        s.direccion,
        s.estado,
        s.tecnico_id
      FROM 
        solicitudes_servicio s
      WHERE 
        s.estado = 'asignado' AND s.tecnico_id = @tecnicoId
    `;

    const result = await pool.request()
      .input('tecnicoId', db.BigInt, tecnicoId)
      .query(query);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error al obtener las solicitudes aceptadas:', err);
    res.status(500).json({
      error: 'Error al obtener las solicitudes aceptadas.',
      detalle: err.message,
    });
  }
});

module.exports = router;
