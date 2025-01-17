const express = require('express');
const router = express.Router();
const db = require('../database'); // Conexión a la base de datos
const verificarSesion = require('../middleware/authMiddleware'); // Middleware de autenticación

// Endpoint único para iniciar y completar el pago
router.post('/pago-completo/:solicitudId', verificarSesion, async (req, res) => {
  const { metodoPago, monto } = req.body;
  const { solicitudId } = req.params; // Recupera el solicitudId como parámetro de la URL
  const userId = req.user ? req.user.id : null;

  if (!userId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    const pool = await db.connect();

    // Verificar que el último estado en progreso_servicio sea "finalizado"
    const queryVerificarEstado = `
      SELECT TOP 1 estado 
      FROM progreso_servicio 
      WHERE solicitud_id = @solicitudId 
      ORDER BY id DESC
    `;
    const estadoResult = await pool.request()
      .input('solicitudId', db.BigInt, solicitudId)
      .query(queryVerificarEstado);

    if (
      estadoResult.recordset.length === 0 ||
      estadoResult.recordset[0].estado !== 'finalizado'
    ) {
      return res.status(400).json({ error: 'El servicio no está listo para ser pagado.' });
    }

    // Registrar el pago en la tabla "pagos" con el estado "pendiente"
    const queryRegistrarPago = `
      INSERT INTO pagos (solicitud_id, monto, metodo_pago, estado) 
      OUTPUT INSERTED.id
      VALUES (@solicitudId, @monto, @metodoPago, 'pendiente')
    `;
    const pagoResult = await pool.request()
      .input('solicitudId', db.BigInt, solicitudId)
      .input('monto', db.Decimal(10, 2), monto)
      .input('metodoPago', db.VarChar, metodoPago)
      .query(queryRegistrarPago);

    const pagoId = pagoResult.recordset[0].id;

    // Actualizar el progreso del servicio a "completado"
    const queryActualizarProgreso = `
      INSERT INTO progreso_servicio (solicitud_id, tecnico_id, estado, detalles) 
      VALUES (@solicitudId, (SELECT tecnico_id FROM solicitudes_servicio WHERE id = @solicitudId), 'completado', 'El servicio ha sido pagado y completado.')
    `;
    await pool.request()
      .input('solicitudId', db.BigInt, solicitudId)
      .query(queryActualizarProgreso);

    // Actualizar el estado de la solicitud a "completado"
    const queryActualizarSolicitud = `
      UPDATE solicitudes_servicio 
      SET estado = 'completado' 
      WHERE id = @solicitudId AND user_id = @userId
    `;
    await pool.request()
      .input('solicitudId', db.BigInt, solicitudId)
      .input('userId', db.BigInt, userId)
      .query(queryActualizarSolicitud);

    // Actualizar el estado del pago a "completado"
    const queryActualizarPago = `
      UPDATE pagos 
      SET estado = 'completado' 
      WHERE id = @pagoId
    `;
    await pool.request()
      .input('pagoId', db.BigInt, pagoId)
      .query(queryActualizarPago);

    // Insertar una notificación para el usuario
    const mensaje = `El pago ha sido completado y el servicio se ha marcado como completado.`;
    const queryNotificacion = `
      INSERT INTO notificaciones (user_id, mensaje) 
      VALUES (@userId, @mensaje)
    `;
    await pool.request()
      .input('userId', db.BigInt, userId)
      .input('mensaje', db.VarChar, mensaje)
      .query(queryNotificacion);

    res.status(200).json({
      mensaje: 'Pago completado y servicio marcado como completado.',
    });
  } catch (err) {
    console.error('Error al procesar el pago:', err);
    res.status(500).json({
      error: 'Error interno al procesar el pago.',
      detalle: err.message,
    });
  }
});

// Obtener pagos completados
router.get('/pagos-completados', async (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(400).json({ error: 'Token no proporcionado.' });
  }

  try {
    const pool = await db.connect();

    // Obtener el tecnico_id a partir del token de sesión
    const queryTecnicoId = `
      SELECT tecnico_id 
      FROM sesiones_tecnico 
      WHERE session_token = @token AND tiempo_cierre IS NULL
    `;
    const tecnicoResult = await pool.request()
      .input('token', db.VarChar, token)
      .query(queryTecnicoId);

    if (tecnicoResult.recordset.length === 0) {
      return res.status(401).json({ error: 'Sesión no válida o expirada.' });
    }

    const tecnicoId = tecnicoResult.recordset[0].tecnico_id;

    // Obtener los pagos completados para el técnico específico
    const queryPagos = `
      SELECT 
        p.id, 
        p.solicitud_id, 
        p.monto, 
        p.metodo_pago, 
        p.fecha, 
        p.estado, 
        s.nombre_servicio 
      FROM pagos p
      JOIN solicitudes_servicio s ON p.solicitud_id = s.id
      WHERE s.tecnico_id = @tecnicoId AND p.estado = 'completado'
      ORDER BY p.fecha DESC
    `;
    const pagosResult = await pool.request()
      .input('tecnicoId', db.BigInt, tecnicoId)
      .query(queryPagos);

    res.status(200).json(pagosResult.recordset);
  } catch (err) {
    console.error('Error al obtener los pagos completados:', err);
    res.status(500).json({
      error: 'Error interno al obtener los pagos completados.',
      detalle: err.message,
    });
  }
});

module.exports = router;
