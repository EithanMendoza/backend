const express = require('express');
const router = express.Router();
const db = require('../database'); // Conexión a la base de datos

// Obtener todos los usuarios con información de sesiones
router.get('/usuarios', async (req, res) => {
  const query = `
    SELECT 
      u.id, 
      u.username, 
      u.email, 
      l.tiempo_inicio, 
      l.tiempo_cierre, 
      u.created_at 
    FROM 
      usuarios u
    LEFT JOIN 
      login l ON u.id = l.user_id
  `;

  try {
    const pool = await db.connect();
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
});

// Eliminar un usuario y sus datos relacionados
router.delete('/usuarios/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await db.connect();

    // Eliminar perfiles relacionados
    await pool.request()
      .input('id', db.BigInt, id)
      .query('DELETE FROM perfiles WHERE user_id = @id');

    // Eliminar sesiones del usuario
    await pool.request()
      .input('id', db.BigInt, id)
      .query('DELETE FROM login WHERE user_id = @id');

    // Eliminar el usuario
    const result = await pool.request()
      .input('id', db.BigInt, id)
      .query('DELETE FROM usuarios WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (err) {
    console.error('Error al eliminar usuario:', err);
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
});

// Obtener todos los perfiles de técnicos con información de sesiones
router.get('/tecnicos', async (req, res) => {
  const query = `
    SELECT 
      pt.id AS perfil_id,
      pt.nombre,
      pt.apellido,
      pt.telefono,
      pt.genero,
      pt.especialidad,
      pt.experiencia,
      st.tiempo_inicio,
      st.tiempo_cierre,
      st.session_token
    FROM 
      perfil_tecnico pt
    LEFT JOIN 
      sesiones_tecnico st ON pt.tecnico_id = st.tecnico_id
  `;

  try {
    const pool = await db.connect();
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener técnicos:', err);
    res.status(500).json({ error: 'Error al obtener los técnicos' });
  }
});

// Eliminar un perfil de técnico por ID
router.delete('/tecnicos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await db.connect();

    // Eliminar sesiones relacionadas
    await pool.request()
      .input('id', db.BigInt, id)
      .query('DELETE FROM sesiones_tecnico WHERE tecnico_id = @id');

    // Eliminar el perfil
    const result = await pool.request()
      .input('id', db.BigInt, id)
      .query('DELETE FROM perfil_tecnico WHERE id = @id');

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Técnico no encontrado' });
    }

    res.json({ message: 'Técnico eliminado exitosamente' });
  } catch (err) {
    console.error('Error al eliminar técnico:', err);
    res.status(500).json({ error: 'Error al eliminar el técnico' });
  }
});

// Obtener todas las solicitudes pendientes y asignadas
router.get('/solicitudes', async (req, res) => {
  const query = `
    SELECT 
      ss.id AS solicitud_id,
      ss.nombre_servicio,
      ss.marca_ac,
      ss.tipo_ac,
      ss.fecha,
      ss.hora,
      ss.direccion,
      ss.estado,
      u.username AS usuario_nombre,
      t.nombre_usuario AS tecnico_nombre,
      ts.nombre_servicio AS tipo_servicio
    FROM 
      solicitudes_servicio ss
    LEFT JOIN 
      usuarios u ON ss.user_id = u.id
    LEFT JOIN 
      tecnicos_servicio t ON ss.tecnico_id = t.id
    LEFT JOIN 
      tipos_servicio ts ON ss.tipo_servicio_id = ts.id
    WHERE 
      ss.estado IN ('pendiente', 'asignado')
    ORDER BY 
      ss.fecha ASC, ss.hora ASC
  `;

  try {
    const pool = await db.connect();
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener solicitudes:', err);
    res.status(500).json({ error: 'Error al obtener las solicitudes' });
  }
});

// Eliminar una solicitud si está en estado "pendiente"
router.delete('/solicitudes/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const pool = await db.connect();

    // Verificar si la solicitud está pendiente
    const verificarEstadoResult = await pool.request()
      .input('id', db.BigInt, id)
      .query('SELECT estado FROM solicitudes_servicio WHERE id = @id');

    if (verificarEstadoResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    if (verificarEstadoResult.recordset[0].estado !== 'pendiente') {
      return res.status(400).json({ error: 'Solo se pueden eliminar solicitudes en estado pendiente' });
    }

    // Eliminar la solicitud
    await pool.request()
      .input('id', db.BigInt, id)
      .query('DELETE FROM solicitudes_servicio WHERE id = @id');

    res.json({ message: 'Solicitud eliminada exitosamente' });
  } catch (err) {
    console.error('Error al eliminar solicitud:', err);
    res.status(500).json({ error: 'Error al eliminar la solicitud' });
  }
});

// Obtener el estado de los pagos con información del cliente y técnico
router.get('/pagos', async (req, res) => {
  const query = `
    SELECT 
      p.id AS pago_id,
      p.monto,
      p.metodo_pago,
      p.estado AS estado_pago,
      p.fecha AS fecha_pago,
      u.username AS cliente_nombre,
      t.nombre_usuario AS tecnico_nombre,
      ss.nombre_servicio
    FROM 
      pagos p
    INNER JOIN 
      solicitudes_servicio ss ON p.solicitud_id = ss.id
    INNER JOIN 
      usuarios u ON ss.user_id = u.id
    LEFT JOIN 
      tecnicos_servicio t ON ss.tecnico_id = t.id
  `;

  try {
    const pool = await db.connect();
    const result = await pool.request().query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error al obtener pagos:', err);
    res.status(500).json({ error: 'Error al obtener los pagos' });
  }
});

module.exports = router;
