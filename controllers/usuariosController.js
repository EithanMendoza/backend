const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const usuariosModel = require('../models/autenticacionUsuario');
const multer = require('multer');
const path = require('path');
const { Storage } = require('@google-cloud/storage');
const { v4: uuidv4 } = require('uuid');

const saltRounds = 10;

// 📌 Configuración de Google Cloud Storage
const storage = new Storage({
  keyFilename: path.join(__dirname, '../config/google-cloud-key.json'), // Ajusta la ruta si es necesario
  projectId: 'divine-booking-440417-d6', // Reemplaza con tu project ID
});

const bucket = require('../config/gcs'); // Carga la configuración del bucket


// 📌 Validación de contraseña en el backend
const validatePassword = (password) => {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[.,])[A-Za-z\d.,]{6,}$/;
  return regex.test(password);
};

// 📌 Configuración de multer para carga en memoria
const multerStorage = multer.memoryStorage();
const upload = multer({ storage: multerStorage });

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
    const defaultAvatar = 'uploads/avatar-default.jpg';

    // Guardar usuario en la base de datos con la imagen por defecto
    const newUserId = await usuariosModel.registerUsuario({
      nombre_usuario,
      email,
      password: hashedPassword,
      avatar: defaultAvatar
    });

    res.status(201).json({ message: "Usuario registrado exitosamente", userId: newUserId });
  } catch (err) {
    console.error('Error en el registro:', err);
    res.status(500).json({ error: "Error al registrar usuario", detalle: err.message });
  }
};

// 📌 INICIAR SESIÓN (LOGIN)
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const usuario = await usuariosModel.findUsuarioByEmail(email);

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const match = await bcrypt.compare(password, usuario.password);

    if (!match) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 🔥 Generar nuevo token
    const token = jwt.sign(
      { userId: usuario._id, email: usuario.email },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    // 🔥 Actualizar o crear la sesión sin registrar múltiples conexiones
    await usuariosModel.updateSession(usuario._id, token);

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
    const userId = req.user.id;

    const usuario = await usuariosModel.findUsuarioById(userId);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    res.status(200).json({
      id: usuario._id,
      nombre_usuario: usuario.nombre_usuario,
      email: usuario.email,
      avatar: usuario.avatar,
    });
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    res.status(500).json({ message: 'Error al obtener información del usuario.' });
  }
};

// 📌 PUT: Actualizar Avatar
exports.updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No se ha subido ningún archivo." });
    }

    // Crear nombre único para la imagen
    const fileName = `${uuidv4()}${path.extname(file.originalname)}`;
    const blob = bucket.file(fileName);
    const blobStream = blob.createWriteStream({
      resumable: false,
      contentType: file.mimetype,
    });

    blobStream.on("error", (err) => {
      console.error("Error al subir al bucket:", err);
      return res.status(500).json({ message: "Error al subir imagen." });
    });

    blobStream.on("finish", async () => {
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

      await usuariosModel.updateUsuarioAvatar(userId, publicUrl);

      res.status(200).json({
        message: "Avatar actualizado correctamente.",
        avatarUrl: publicUrl,
      });
    });

    blobStream.end(file.buffer);
  } catch (error) {
    console.error("Error al actualizar el avatar:", error);
    res.status(500).json({ message: "Error al actualizar avatar." });
  }
};

// Exportar multer para usar en las rutas
exports.upload = upload;
