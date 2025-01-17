const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const router = express.Router();
const db = require('../database'); // Conexión a la base de datos
const verificarTecnico = require('../middleware/tecnicosmiddleware'); // Middleware de autenticación

const saltRounds = 10; // Número de rondas de encriptación

// Registro de técnicos de servicio
router.post('/registerT', async (req, res) => {
  const { nombre_usuario, email, password, especialidad, telefono } = req.body;

  try {
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insertar el técnico en la base de datos con la contraseña encriptada
    const query = `
      INSERT INTO tecnicos_servicio (nombre_usuario, email, password, especialidad, telefono) 
      VALUES (@nombre_usuario, @email, @password, @especialidad, @telefono)
    `;

    const pool = await db.connect();
    await pool.request()
      .input('nombre_usuario', db.VarChar, nombre_usuario)
      .input('email', db.VarChar, email)
      .input('password', db.VarChar, hashedPassword)
      .input('especialidad', db.VarChar, especialidad)
      .input('telefono', db.VarChar, telefono)
      .query(query);

    res.status(201).json({ mensaje: 'Técnico registrado correctamente' });
  } catch (error) {
    console.error('Error al registrar el técnico:', error);
    res.status(500).json({ error: 'Error al registrar el técnico', detalle: error.message });
  }
});

// Inicio de sesión de técnicos de servicio
router.post('/loginT', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar al técnico en la base de datos por email
    const query = 'SELECT * FROM tecnicos_servicio WHERE email = @Email';
    const pool = await db.connect();
    const result = await pool.request()
      .input('Email', db.VarChar, email)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Técnico no encontrado' });
    }

    const tecnico = result.recordset[0];

    // Comparar la contraseña proporcionada con la encriptada
    const match = await bcrypt.compare(password, tecnico.password);

    if (match) {
      // Generar un token de sesión único
      const sessionToken = crypto.randomBytes(32).toString('hex');

      // Registrar el inicio de sesión en la tabla 'sesiones_tecnico'
      const loginQuery = `
        INSERT INTO sesiones_tecnico (tecnico_id, session_token, tiempo_inicio) 
        VALUES (@tecnico_id, @session_token, GETDATE())
      `;
      await pool.request()
        .input('tecnico_id', db.BigInt, tecnico.id)
        .input('session_token', db.VarChar, sessionToken)
        .query(loginQuery);

      // Inicio de sesión exitoso y sesión registrada
      res.status(200).json({ 
        mensaje: 'Inicio de sesión exitoso',
        session_token: sessionToken,
        tecnico: { id: tecnico.id, nombre_usuario: tecnico.nombre_usuario, email: tecnico.email }
      });
    } else {
      res.status(401).json({ error: 'Contraseña incorrecta' });
    }
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error al iniciar sesión', detalle: error.message });
  }
});

// Cerrar sesión de técnicos de servicio
router.post('/logoutT', verificarTecnico, async (req, res) => {
  const token = req.headers['authorization']; // Token de sesión en el header de autorización

  try {
    const query = `
      UPDATE sesiones_tecnico 
      SET tiempo_cierre = GETDATE() 
      WHERE session_token = @token AND tiempo_cierre IS NULL
    `;
    const pool = await db.connect();
    const result = await pool.request()
      .input('token', db.VarChar, token)
      .query(query);

    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Sesión no encontrada o ya cerrada' });
    }

    // Sesión cerrada exitosamente
    res.status(200).json({ mensaje: 'Sesión cerrada correctamente' });
  } catch (error) {
    console.error('Error al cerrar la sesión:', error);
    res.status(500).json({ error: 'Error al cerrar la sesión', detalle: error.message });
  }
});

module.exports = router;
