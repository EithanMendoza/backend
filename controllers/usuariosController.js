const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const usuariosModel = require('../models/autenticacionUsuario');

const saltRounds = 10;

// 📌 REGISTRAR USUARIO
exports.registerUsuario = async (req, res) => {
  const { nombre_usuario, email, password } = req.body;

  try {
    // Encriptar la contraseña antes de guardarla
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

// 📌 INICIAR SESIÓN (LOGIN)
exports.loginUsuario = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar usuario por email
    const usuario = await usuariosModel.findUsuarioByEmail(email);

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Comparar contraseñas encriptadas
    const match = await bcrypt.compare(password, usuario.password);

    if (!match) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // 🔥 Generar JWT en lugar de `session_token`
    const token = jwt.sign(
      { userId: usuario._id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '12h' } // Token válido por 12 horas
    );

    // Registrar la sesión en la base de datos con el JWT
    const session = {
      usuario_id: usuario._id,
      session_token: token,
      tiempo_inicio: new Date(),
    };

    await usuariosModel.registerSession(session);

    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      token, // 🔥 Enviar el JWT al frontend
      usuario: { id: usuario._id, nombre_usuario: usuario.nombre_usuario, email: usuario.email },
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error al iniciar sesión', detalle: error.message });
  }
};

// 📌 CERRAR SESIÓN (LOGOUT)
exports.logoutUsuario = async (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'No se ha proporcionado un token de sesión.' });
  }

  const token = authHeader.split(' ')[1]; // Extraer token sin "Bearer"

  try {
    // Eliminar la sesión de la base de datos
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

// 📌 LISTAR USUARIOS (PAGINACIÓN)
exports.listUsuarios = async (req, res) => {
  try {
    const db = req.app.locals.db; // Obtener la conexión de la base de datos

    // Leer parámetros de la solicitud
    const page = parseInt(req.query.page) || 1; // Página actual (por defecto 1)
    const limit = parseInt(req.query.limit) || 100; // Límite de documentos por página (por defecto 100)
    const skip = (page - 1) * limit; // Calcular cuántos documentos omitir

    // Obtener usuarios con paginación
    const usuarios = await db
      .collection('usuarios') // Cambia 'usuarios' por el nombre de tu colección si es diferente
      .find()
      .skip(skip)
      .limit(limit)
      .toArray();

    // Obtener el total de documentos
    const totalUsuarios = await db.collection('usuarios').countDocuments();

    // Calcular total de páginas
    const totalPages = Math.ceil(totalUsuarios / limit);

    // Responder con los usuarios y metadatos de paginación
    res.status(200).json({
      page,
      limit,
      totalUsuarios,
      totalPages,
      usuarios,
    });
  } catch (err) {
    console.error('Error al listar usuarios:', err);
    res.status(500).json({ error: 'Error al obtener la lista de usuarios' });
  }
};
