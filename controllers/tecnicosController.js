const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const tecnicosModel = require('../models/autenticacionTecnicos');

const saltRounds = 10;

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

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const tecnico = {
      nombre_usuario,
      email,
      password: hashedPassword,
      especialidad,
      telefono,
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

// **Iniciar sesión de técnico con Refresh Token**
exports.iniciarSesionTecnico = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Todos los campos son obligatorios." });
  }

  try {
    const tecnico = await tecnicosModel.findTecnicoByEmail(email);
    if (!tecnico) {
      return res.status(404).json({ error: "Técnico no encontrado." });
    }

    const match = await bcrypt.compare(password, tecnico.password);
    if (!match) {
      return res.status(401).json({ error: "Contraseña incorrecta." });
    }

    // 🔥 Generar el Access Token (Expira en 1 hora)
    const accessToken = jwt.sign(
      { tecnico_id: tecnico._id, email: tecnico.email },
      process.env.JWT_SECRET,
      { expiresIn: "1h" } // Access Token dura 1 hora
    );

    // 🔥 Generar el Refresh Token (Expira en 7 días)
    const refreshToken = jwt.sign(
      { tecnico_id: tecnico._id },
      process.env.REFRESH_SECRET,
      { expiresIn: "7d" } // Refresh Token dura 7 días
    );

    // Guardar el Refresh Token en la base de datos
    const session = {
      tecnico_id: tecnico._id,
      session_token: refreshToken, // Guardamos el Refresh Token
      tiempo_inicio: new Date(),
    };

    await tecnicosModel.registerSession(session);

    res.status(200).json({
      mensaje: "Inicio de sesión exitoso",
      accessToken,
      refreshToken,
      tecnico: { id: tecnico._id, nombre_usuario: tecnico.nombre_usuario, email: tecnico.email },
    });
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    res.status(500).json({ error: "Error al iniciar sesión.", detalle: error.message });
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

// **Refrescar Access Token**
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "No se proporcionó un refresh token." });
    }

    const client = await connectToDatabase();
    const db = client.db("AirTecs3");

    // Buscar el refresh token en la base de datos
    const session = await db.collection("sesiones_tecnico").findOne({ session_token: refreshToken });

    if (!session) {
      return res.status(403).json({ error: "Refresh token inválido o expirado." });
    }

    jwt.verify(refreshToken, process.env.REFRESH_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: "Refresh token no válido." });
      }

      // 🔥 Generar un nuevo Access Token
      const newAccessToken = jwt.sign(
        { tecnico_id: decoded.tecnico_id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" } // Renovamos el access token por 1 hora más
      );

      res.status(200).json({ accessToken: newAccessToken });
    });
  } catch (err) {
    console.error("Error al refrescar el token:", err);
    res.status(500).json({ error: "Error al refrescar el token." });
  }
};