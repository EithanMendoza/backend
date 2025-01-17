const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const router = express.Router();
const db = require('../database'); // Conexión a la base de datos
const verificarSesion = require('../middleware/authMiddleware'); // Middleware de sesión

const saltRounds = 10; // Número de rondas de encriptación

// Registro de usuarios
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  try {
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Insertar el usuario en la base de datos
    const query = `
      INSERT INTO usuarios (username, email, password) 
      VALUES (@username, @email, @password)
    `;

    const pool = await db.connect();
    await pool.request()
      .input('username', db.VarChar, username)
      .input('email', db.VarChar, email)
      .input('password', db.VarChar, hashedPassword)
      .query(query);

    res.status(201).json({ mensaje: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    res.status(500).json({ error: 'Error al registrar el usuario', detalle: error.message });
  }
});

// Inicio de sesión de usuarios
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar al usuario en la base de datos por email
    const query = `
      SELECT * 
      FROM usuarios 
      WHERE email = @Email
    `;
    const pool = await db.connect();
    const result = await pool.request()
      .input('Email', db.VarChar, email)
      .query(query);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const usuario = result.recordset[0];

    // Comparar la contraseña proporcionada con la encriptada
    const match = await bcrypt.compare(password, usuario.password);

    if (match) {
      // Generar un token de sesión único
      const sessionToken = crypto.randomBytes(32).toString('hex');

      // Registrar el inicio de sesión en la tabla 'login'
      const loginQuery = `
        INSERT INTO login (user_id, session_token, tiempo_inicio) 
        VALUES (@user_id, @session_token, GETDATE())
      `;
      await pool.request()
        .input('user_id', db.BigInt, usuario.id)
        .input('session_token', db.VarChar, sessionToken)
        .query(loginQuery);

      // Inicio de sesión exitoso y sesión registrada
      res.status(200).json({
        mensaje: 'Inicio de sesión exitoso',
        session_token: sessionToken,
        user: { id: usuario.id, username: usuario.username, email: usuario.email }
      });
    } else {
      res.status(401).json({ error: 'Contraseña incorrecta' });
    }
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error al iniciar sesión', detalle: error.message });
  }
});

// Logout - cerrar sesión
router.post('/logout', verificarSesion, async (req, res) => {
  const token = req.headers['authorization']; // Token de sesión en el encabezado de autorización

  try {
    // Actualizar el tiempo de cierre en la tabla de sesiones
    const query = `
      UPDATE login 
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
    console.error('Error en el proceso de logout:', error);
    res.status(500).json({ error: 'Error al cerrar la sesión', detalle: error.message });
  }
});

module.exports = router;
