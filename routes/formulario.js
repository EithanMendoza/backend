const express = require('express');
const router = express.Router();
const db = require('../database'); // Conexión a la base de datos
const verificarSesion = require('../middleware/authMiddleware'); // Middleware de sesión
const verificarPerfil = require('../middleware/perfilmiddleware'); // Middleware de perfil

// Endpoint para crear una solicitud de servicio
router.post('/crear-solicitud', verificarSesion, verificarPerfil, async (req, res) => {
  const { tipo_servicio_id, marca_ac, tipo_ac, detalles, fecha, hora, direccion } = req.body;

  if (!tipo_servicio_id || !marca_ac || !tipo_ac || !fecha || !hora || !direccion) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  try {
    const pool = await db.connect();
    const userId = req.user.id; // Obtenemos el ID del usuario desde el middleware

    // Verificar si el usuario ya tiene una solicitud activa en estado "pendiente"
    const queryVerificarSolicitudActiva = `
      SELECT id FROM solicitudes_servicio 
      WHERE user_id = @userId AND estado = 'pendiente'
    `;
    const solicitudActivaResult = await pool.request()
      .input('userId', db.BigInt, userId)
      .query(queryVerificarSolicitudActiva);

    if (solicitudActivaResult.recordset.length > 0) {
      return res.status(400).json({ error: 'Ya tienes una solicitud pendiente en curso.' });
    }

    // Validar el tipo de servicio
    const queryValidarServicio = `
      SELECT nombre_servicio FROM tipos_servicio WHERE id = @tipoServicioId
    `;
    const servicioResult = await pool.request()
      .input('tipoServicioId', db.BigInt, tipo_servicio_id)
      .query(queryValidarServicio);

    if (servicioResult.recordset.length === 0) {
      return res.status(400).json({ error: 'Tipo de servicio no válido.' });
    }

    const nombre_servicio = servicioResult.recordset[0].nombre_servicio;

    // Insertar la solicitud en la base de datos
    const queryInsertarSolicitud = `
      INSERT INTO solicitudes_servicio 
      (user_id, tipo_servicio_id, nombre_servicio, marca_ac, tipo_ac, detalles, fecha, hora, direccion, estado) 
      VALUES (@userId, @tipoServicioId, @nombreServicio, @marcaAC, @tipoAC, @detalles, @fecha, @hora, @direccion, 'pendiente')
    `;
    const result = await pool.request()
      .input('userId', db.BigInt, userId)
      .input('tipoServicioId', db.BigInt, tipo_servicio_id)
      .input('nombreServicio', db.VarChar, nombre_servicio)
      .input('marcaAC', db.VarChar, marca_ac)
      .input('tipoAC', db.VarChar, tipo_ac)
      .input('detalles', db.VarChar, detalles || null)
      .input('fecha', db.Date, fecha)
      .input('hora', db.Time, hora)
      .input('direccion', db.VarChar, direccion)
      .query(queryInsertarSolicitud);

    res.status(201).json({
      mensaje: 'Solicitud de servicio creada correctamente',
      solicitudId: result.recordset.insertId
    });
  } catch (err) {
    console.error('Error al crear la solicitud de servicio:', err);
    res.status(500).json({ error: 'Error al crear la solicitud de servicio', detalle: err.message });
  }
});

// Endpoint para cancelar una solicitud de servicio
router.delete('/cancelar-solicitud/:solicitudId', verificarSesion, async (req, res) => {
  const { solicitudId } = req.params;
  const userId = req.user.id;

  try {
    const pool = await db.connect();

    // Verificar si el técnico aún no está en camino
    const queryEstado = `
      SELECT TOP 1 estado FROM progreso_servicio 
      WHERE solicitud_id = @solicitudId 
      ORDER BY id DESC
    `;
    const estadoResult = await pool.request()
      .input('solicitudId', db.BigInt, solicitudId)
      .query(queryEstado);

    if (estadoResult.recordset.length > 0 && estadoResult.recordset[0].estado === 'en_camino') {
      return res.status(400).json({ error: 'No se puede cancelar la solicitud: el técnico ya está en camino.' });
    }

    // Eliminar la solicitud
    const queryEliminarSolicitud = `
      DELETE FROM solicitudes_servicio 
      WHERE id = @solicitudId AND user_id = @userId
    `;
    const eliminarResult = await pool.request()
      .input('solicitudId', db.BigInt, solicitudId)
      .input('userId', db.BigInt, userId)
      .query(queryEliminarSolicitud);

    if (eliminarResult.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada o no se puede cancelar.' });
    }

    res.status(200).json({ mensaje: 'Solicitud cancelada correctamente.' });
  } catch (err) {
    console.error('Error al cancelar la solicitud:', err);
    res.status(500).json({ error: 'Error al cancelar la solicitud', detalle: err.message });
  }
});

// Endpoint para consultar el estado de solicitudes pendientes sin asignación de técnico
router.get('/pendientes', verificarSesion, async (req, res) => {
  const userId = req.user.id;

  try {
    const pool = await db.connect();

    // Consultar la última solicitud del usuario
    const queryEstadoSolicitud = `
      SELECT TOP 1 id, nombre_servicio, estado, fecha, hora, direccion, codigo_inicial, created_at
      FROM solicitudes_servicio
      WHERE user_id = @userId AND estado != 'cancelado'
      ORDER BY created_at DESC
    `;
    const result = await pool.request()
      .input('userId', db.BigInt, userId)
      .query(queryEstadoSolicitud);

    if (result.recordset.length === 0) {
      return res.status(404).json({ mensaje: 'No tienes solicitudes activas registradas.' });
    }

    const solicitud = result.recordset[0];
    res.status(200).json({
      solicitudId: solicitud.id,
      nombreServicio: solicitud.nombre_servicio,
      estadoSolicitud: solicitud.estado,
      fecha: solicitud.fecha,
      hora: solicitud.hora,
      direccion: solicitud.direccion,
      codigoInicial: solicitud.codigo_inicial,
      fechaSolicitud: solicitud.created_at
    });
  } catch (err) {
    console.error('Error al obtener el estado de la solicitud:', err);
    res.status(500).json({ error: 'Error al obtener el estado de la solicitud', detalle: err.message });
  }
});

module.exports = router;
