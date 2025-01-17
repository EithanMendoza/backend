const express = require('express');
const router = express.Router();
const db = require('../database');
const verificarTecnico = require('../middleware/tecnicosmiddleware');

// Definir los estados del servicio en orden
const ordenEstados = ['en_camino', 'en_lugar', 'en_proceso', 'finalizado'];

// Actualizar la ruta para aceptar `solicitudId` como parámetro
router.post('/actualizar-estado/:solicitudId', verificarTecnico, async (req, res) => {
  const { estado, codigoConfirmacion, detalles } = req.body;
  const { solicitudId } = req.params; // Obtener solicitudId de los parámetros
  const tecnicoId = req.tecnico ? req.tecnico.id : null;

  if (!tecnicoId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    const pool = await db.connect();

    // Verificar el código de confirmación para los estados `en_proceso` y `finalizado`
    if (estado === 'en_proceso' || estado === 'finalizado') {
      if (!codigoConfirmacion) {
        return res.status(400).json({ error: 'Se requiere un código de confirmación para este estado.' });
      }

      const queryCodigo = `
        SELECT codigo_inicial FROM solicitudes_servicio WHERE id = @solicitudId
      `;
      const codigoResult = await pool.request()
        .input('solicitudId', db.BigInt, solicitudId)
        .query(queryCodigo);

      if (codigoResult.recordset.length === 0) {
        return res.status(404).json({ error: 'Solicitud no encontrada.' });
      }

      const codigoInicial = codigoResult.recordset[0].codigo_inicial;

      if (codigoConfirmacion !== codigoInicial) {
        return res.status(400).json({ error: 'Código de confirmación incorrecto.' });
      }
    }

    verificarYActualizarEstado(req, res, solicitudId, tecnicoId, estado, detalles);
  } catch (err) {
    console.error('Error al verificar el código de confirmación:', err);
    res.status(500).json({ error: 'Error interno al verificar el código de confirmación.' });
  }
});

async function verificarYActualizarEstado(req, res, solicitudId, tecnicoId, estado, detalles) {
  try {
    const pool = await db.connect();

    const queryUltimoEstado = `
      SELECT estado FROM progreso_servicio 
      WHERE solicitud_id = @solicitudId 
      ORDER BY id DESC
    `;
    const ultimoEstadoResult = await pool.request()
      .input('solicitudId', db.BigInt, solicitudId)
      .query(queryUltimoEstado);

    const ultimoEstado = ultimoEstadoResult.recordset.length > 0 ? ultimoEstadoResult.recordset[0].estado : null;
    const indiceUltimoEstado = ordenEstados.indexOf(ultimoEstado);
    const indiceNuevoEstado = ordenEstados.indexOf(estado);

    // Validar el orden de los estados
    if (indiceNuevoEstado === -1 || indiceNuevoEstado !== indiceUltimoEstado + 1) {
      return res.status(400).json({ error: 'El estado no sigue el orden requerido.' });
    }

    // Obtener el `user_id` asociado a la solicitud
    const queryUserId = `
      SELECT user_id FROM solicitudes_servicio WHERE id = @solicitudId
    `;
    const userIdResult = await pool.request()
      .input('solicitudId', db.BigInt, solicitudId)
      .query(queryUserId);

    if (userIdResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada.' });
    }

    const userId = userIdResult.recordset[0].user_id;

    insertarProgresoYNotificar(req, res, solicitudId, tecnicoId, estado, detalles, userId);
  } catch (err) {
    console.error('Error al consultar el último estado:', err);
    res.status(500).json({ error: 'Error al consultar el último estado del servicio.' });
  }
}

async function insertarProgresoYNotificar(req, res, solicitudId, tecnicoId, estado, detalles, userId) {
  try {
    const pool = await db.connect();

    const queryProgreso = `
      INSERT INTO progreso_servicio (solicitud_id, tecnico_id, estado, detalles) 
      VALUES (@solicitudId, @tecnicoId, @estado, @detalles)
    `;
    await pool.request()
      .input('solicitudId', db.BigInt, solicitudId)
      .input('tecnicoId', db.BigInt, tecnicoId)
      .input('estado', db.VarChar, estado)
      .input('detalles', db.VarChar, detalles || null)
      .query(queryProgreso);

    const mensaje = `El estado de tu servicio ha cambiado a: ${estado}. ${detalles || ''}`;
    const queryNotificacion = `
      INSERT INTO notificaciones (user_id, mensaje) VALUES (@userId, @mensaje)
    `;
    await pool.request()
      .input('userId', db.BigInt, userId)
      .input('mensaje', db.VarChar, mensaje)
      .query(queryNotificacion);

    res.status(200).json({ mensaje: 'Estado del servicio y notificación actualizados correctamente.' });
  } catch (err) {
    console.error('Error al actualizar el progreso del servicio:', err);
    res.status(500).json({ error: 'Error al actualizar el progreso del servicio.' });
  }
}

// Obtener los servicios finalizados (historial)
router.get('/servicios-finalizados', verificarTecnico, async (req, res) => {
  const tecnicoId = req.tecnico.id;

  try {
    const pool = await db.connect();

    const query = `
      SELECT id, nombre_servicio, detalles, fecha, hora, direccion 
      FROM solicitudes_servicio 
      WHERE estado = 'completado' AND tecnico_id = @tecnicoId
    `;
    const result = await pool.request()
      .input('tecnicoId', db.BigInt, tecnicoId)
      .query(query);

    res.status(200).json(result.recordset);
  } catch (err) {
    console.error('Error al obtener los servicios finalizados:', err);
    res.status(500).json({ error: 'Error al obtener los servicios finalizados.' });
  }
});

module.exports = router;
