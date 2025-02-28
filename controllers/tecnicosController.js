const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const tecnicosModel = require('../models/autenticacionTecnicos');
const { MongoClient, ObjectId } = require('mongodb'); // Asegúrate de que esta línea esté presente


const saltRounds = 10;

// **Obtener Perfil del Técnico Autenticado**
// Controlador para obtener el perfil del técnico
exports.obtenerPerfilTecnico = async (req, res) => {
  try {
    const tecnicoId = req.tecnico.id;  // Debería ser el `id` que viene del middleware
    
    // Verifica que el ID del técnico esté presente
    if (!tecnicoId) {
      return res.status(400).json({ error: 'ID de técnico no encontrado en la sesión.' });
    }

    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db('AirTecs3');
    const tecnicosCollection = db.collection('tecnicos_servicio');
    
    // Busca el perfil del técnico con el `tecnicoId`
    const tecnico = await tecnicosCollection.findOne({ _id: new ObjectId(tecnicoId) });

    if (!tecnico) {
      console.warn("⚠️ Técnico no encontrado:", tecnicoId);
      await client.close();
      return res.status(404).json({ error: 'Técnico no encontrado.' });
    }

    await client.close();
    return res.status(200).json(tecnico);
  } catch (error) {
    console.error("❌ Error al obtener el perfil:", error);
    return res.status(500).json({ error: 'Error interno al obtener el perfil.', detalle: error.message });
  }
};


// **Registrar Técnico**
exports.registrarTecnico = async (req, res) => {
  const { nombre_usuario, email, password, especialidad, telefono } = req.body;

  if (!nombre_usuario || !email || !password || !especialidad || !telefono) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  try {
    const tecnicoExistente = await tecnicosModel.findTecnicoByEmail(email);
    if (tecnicoExistente) {
      return res.status(400).json({ error: 'El email ya está registrado.' });
    }

    // Hasheamos la contraseña
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Incluir el campo avatar con la imagen por defecto
    const tecnico = {
      nombre_usuario,
      email,
      password: hashedPassword,
      especialidad,
      telefono,
      avatar: 'uploads/avatar-default.jpg',  // Ruta de la imagen por defecto
      created_at: new Date(),
    };

    const tecnicoId = await tecnicosModel.registerTecnico(tecnico);

    res.status(201).json({
      mensaje: 'Técnico registrado correctamente',
      tecnicoId,
    });
  } catch (error) {
    console.error('Error al registrar el técnico:', error);
    res.status(500).json({ error: 'Error interno al registrar el técnico.', detalle: error.message });
  }
};


// **Iniciar sesión de técnico**
exports.iniciarSesionTecnico = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  try {
    const tecnico = await tecnicosModel.findTecnicoByEmail(email);
    if (!tecnico) {
      return res.status(404).json({ error: 'Técnico no encontrado.' });
    }

    const match = await bcrypt.compare(password, tecnico.password);
    if (!match) {
      return res.status(401).json({ error: 'Contraseña incorrecta.' });
    }

    // 🔥 Generar token
    const sessionToken = jwt.sign(
      { tecnico_id: tecnico._id, email: tecnico.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }
    );

    // 🔥 Actualizar o crear sesión sin duplicar registros
    await tecnicosModel.updateSession(tecnico._id, sessionToken);

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


// **Cerrar sesión de técnico**
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
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db('AirTecs3');

    const tecnicos = await db.collection('tecnicos_servicio').find().toArray();
    await client.close();

    res.status(200).json({ tecnicos });
  } catch (err) {
    console.error('Error al listar técnicos:', err);
    res.status(500).json({ error: 'Error al obtener la lista de técnicos' });
  }
};



