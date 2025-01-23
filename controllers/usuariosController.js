const bcrypt = require('bcrypt');
const crypto = require('crypto');
const usuariosModel = require('../models/autenticacionUsuario');

const saltRounds = 10; // Número de rondas para encriptar la contraseña

// Registrar usuario
exports.registerUsuario = async (req, res) => {
  const { nombre_usuario, email, password } = req.body;

  try {
    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear el objeto usuario
    const usuario = {
      nombre_usuario,
      email,
      password: hashedPassword,
      created_at: new Date(),
    };

    // Guardar en la base de datos
    const usuarioId = await usuariosModel.registerUsuario(usuario);

    res.status(201).json({ mensaje: 'Usuario registrado correctamente', usuarioId });
  } catch (error) {
    console.error('Error al registrar el usuario:', error);
    res.status(500).json({ error: 'Error al registrar el usuario', detalle: error.message });
  }
};

// Iniciar sesión de usuario
exports.loginUsuario = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar usuario por email
    const usuario = await usuariosModel.findUsuarioByEmail(email);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Comparar contraseñas
    const match = await bcrypt.compare(password, usuario.password);

    if (!match) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Generar un token de sesión único
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Registrar la sesión
    const session = {
      usuario_id: usuario._id,
      session_token: sessionToken,
      tiempo_inicio: new Date(),
    };

    await usuariosModel.registerSession(session);

    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      session_token: sessionToken,
      usuario: { id: usuario._id, nombre_usuario: usuario.nombre_usuario, email: usuario.email },
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error al iniciar sesión', detalle: error.message });
  }
};

// Cerrar sesión de usuario
exports.logoutUsuario = async (req, res) => {
  const token = req.headers['authorization'];

  try {
    const sessionClosed = await usuariosModel.closeSession(token);

    if (!sessionClosed) {
      return res.status(404).json({ error: 'Sesión no encontrada o ya cerrada' });
    }

    res.status(200).json({ mensaje: 'Sesión cerrada correctamente' });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).json({ error: 'Error al cerrar sesión', detalle: error.message });
  }
};
