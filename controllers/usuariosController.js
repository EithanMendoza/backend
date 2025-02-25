const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const usuariosModel = require('../models/autenticacionUsuario');
const multer = require('multer');
const path = require('path');

const saltRounds = 10;

// 📌 Validación de contraseña en el backend
const validatePassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.,])[A-Za-z\d.,]{6,}$/;
  return regex.test(password);
};

// 📌 Configuración de multer para guardar los avatares en la carpeta `uploads`
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
      cb(null, 'uploads/'); // Carpeta donde se guardarán los archivos
  },
  filename: (req, file, cb) => {
      cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// 📌 REGISTRO DE USUARIO
exports.registerUser = async (req, res) => {
  const { nombre_usuario, email, password } = req.body;

  if (!nombre_usuario || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  if (!validatePassword(password)) {
      return res.status(400).json({
          error: "La contraseña debe tener al menos 6 caracteres, una mayúscula, una minúscula, un número y un símbolo (.,)"
      });
  }

  try {
      // Verificar si el usuario ya existe
      const usuarioExistente = await usuariosModel.findUsuarioByEmail(email);
      if (usuarioExistente) {
          return res.status(400).json({ error: "El correo ya está registrado." });
      }

      // Hashear la contraseña
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // 📌 Definir la imagen de perfil por defecto
      const defaultAvatar = 'uploads/avatar-default.jpg'; // Imagen en la carpeta `uploads`

      // Guardar usuario en la base de datos con la imagen por defecto
      const newUserId = await usuariosModel.registerUsuario({
          nombre_usuario,
          email,
          password: hashedPassword,
          avatar: defaultAvatar // Asignar la imagen por defecto
      });

      res.status(201).json({ message: "Usuario registrado exitosamente", userId: newUserId });
  } catch (err) {
      console.error('Error en el registro:', err);
      res.status(500).json({ error: "Error al registrar usuario", detalle: err.message });
  }
};

// Exportar multer para poder usarlo en el endpoint de actualización de avatar
exports.upload = upload;

// 📌 INICIAR SESIÓN (LOGIN)
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar usuario por email
    const usuario = await usuariosModel.findUsuarioByEmail(email);

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Comparar contraseñas encriptadas
    const match = await bcrypt.compare(password, usuario.password);

    if (!match) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar JWT
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
      token,
      usuario: { id: usuario._id, nombre_usuario: usuario.nombre_usuario, email: usuario.email },
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error al iniciar sesión', detalle: error.message });
  }
};

// 📌 CERRAR SESIÓN (LOGOUT)
exports.logoutUser = async (req, res) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({ error: 'No se ha proporcionado un token de sesión.' });
  }

  const token = authHeader.split(' ')[1];

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
exports.listUsers = async (req, res) => {
  try {
    const db = req.app.locals.db;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 100;
    const skip = (page - 1) * limit;

    const usuarios = await db.collection('usuarios')
      .find()
      .skip(skip)
      .limit(limit)
      .toArray();

    const totalUsuarios = await db.collection('usuarios').countDocuments();
    const totalPages = Math.ceil(totalUsuarios / limit);

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

// 📌 GET Usuario por ID (Autenticado)
exports.getUserById = async (req, res) => {
  try {
    const userId = req.user.id; // ID extraído del token por el middleware

    // Buscar al usuario en la base de datos y excluir la contraseña
    const user = await Usuario.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Retornar los datos del usuario
    res.status(200).json({
      id: user._id,
      nombre_usuario: user.nombre_usuario,
      email: user.email,
      avatar: user.avatar, // La ruta al avatar
    });
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    res.status(500).json({ message: 'Error al obtener información del usuario.' });
  }
};