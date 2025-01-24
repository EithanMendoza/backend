const bcrypt = require('bcrypt');
const crypto = require('crypto');
const tecnicosModel = require('../models/autenticacionTecnicos'); // Modelo importado

const saltRounds = 10; // Número de rondas para encriptar la contraseña

// Registrar técnico
exports.registrarTecnico = async (req, res) => {
  const { nombre_usuario, email, password, especialidad, telefono } = req.body;

  if (!nombre_usuario || !email || !password || !especialidad || !telefono) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  try {
    // Verificar si el técnico ya está registrado
    const tecnicoExistente = await tecnicosModel.findTecnicoByEmail(email);
    if (tecnicoExistente) {
      return res.status(400).json({ error: 'El email ya está registrado.' });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Crear el objeto técnico
    const tecnico = {
      nombre_usuario,
      email,
      password: hashedPassword,
      especialidad,
      telefono,
      created_at: new Date(),
    };

    // Guardar en la base de datos
    const tecnicoId = await tecnicosModel.registerTecnico(tecnico);

    res.status(201).json({
      mensaje: 'Técnico registrado correctamente',
      tecnicoId,
    });
  } catch (error) {
    console.error('Error al registrar el técnico:', error);
    res.status(500).json({
      error: 'Error interno al registrar el técnico.',
      detalle: error.message,
    });
  }
};

// Iniciar sesión de técnico
exports.iniciarSesionTecnico = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  try {
    // Buscar técnico por email
    const tecnico = await tecnicosModel.findTecnicoByEmail(email);

    if (!tecnico) {
      return res.status(404).json({ error: 'Técnico no encontrado.' });
    }

    // Comparar contraseñas
    const match = await bcrypt.compare(password, tecnico.password);

    if (!match) {
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }

    // Generar un token de sesión único
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Registrar la sesión
    const session = {
      tecnico_id: tecnico._id,
      session_token: sessionToken,
      tiempo_inicio: new Date(),
    };

    await tecnicosModel.registerSession(session);

    res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      session_token: sessionToken,
      tecnico: { id: tecnico._id, nombre_usuario: tecnico.nombre_usuario, email: tecnico.email },
    });
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    res.status(500).json({ error: 'Error al iniciar sesión.', detalle: error.message });
  }
};

// Cerrar sesión de técnico
exports.cerrarSesionTecnico = async (req, res) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(400).json({ error: 'Token de sesión no proporcionado.' });
  }

  try {
    const sessionClosed = await tecnicosModel.closeSession(token);

    if (!sessionClosed) {
      return res.status(404).json({ error: 'Sesión no encontrada o ya cerrada.' });
    }

    res.status(200).json({ mensaje: 'Sesión cerrada correctamente.' });
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).json({ error: 'Error al cerrar sesión.', detalle: error.message });
  }
};

exports.listTecnicos = async (req, res) => {
  try {
    const db = req.app.locals.db; // Obtener la conexión de la base de datos
    const page = parseInt(req.query.page) || 0; // Página actual (0 por defecto)
    const limit = parseInt(req.query.limit) || 100; // Número de documentos por página (100 por defecto)

    // Calcular el número de documentos a saltar
    const skip = page * limit;

    // Obtener técnicos con paginación
    const tecnicos = await db.collection('tecnicos_servicio')
      .find()
      .skip(skip)
      .limit(limit)
      .toArray();

    // Obtener el número total de técnicos
    const totalTecnicos = await db.collection('tecnicos_servicio').countDocuments();

    res.status(200).json({
      page,
      limit,
      totalTecnicos,
      totalPages: Math.ceil(totalTecnicos / limit),
      tecnicos,
    });
  } catch (err) {
    console.error('Error al listar técnicos:', err);
    res.status(500).json({ error: 'Error al obtener la lista de técnicos' });
  }
};

