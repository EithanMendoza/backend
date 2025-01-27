const jwt = require('jsonwebtoken'); // Librería para manejar JWT
const { MongoClient } = require('mongodb'); // Conexión a la base de datos

// Middleware de autenticación para verificar el token de sesión de usuarios
const verificarSesion = async (req, res, next) => {
  const token = req.headers['authorization']; // El token de sesión debe enviarse en el header de autorización

  console.log('Token recibido:', token); // Log para verificar qué token se está recibiendo

  if (!token) {
    console.error('Token de sesión no proporcionado');
    return res.status(401).json({ error: 'No se ha proporcionado un token de sesión.' });
  }

  try {
    // Verificar y decodificar el token JWT
    const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET); // Extraer token y verificar

    console.log('Token decodificado:', decoded); // Log para verificar el contenido decodificado

    if (!decoded || !decoded.userId) {
      console.warn('Token inválido o corrupto');
      return res.status(401).json({ error: 'Token inválido o corrupto.' });
    }

    // Conexión a la base de datos MongoDB
    const client = new MongoClient(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();

    const db = client.db('AirTecs3'); // Cambiar al nombre de tu base de datos
    const loginCollection = db.collection('login'); // Acceder a la colección `login`

    // Buscar el token de sesión en la colección `login`
    const session = await loginCollection.findOne({
      session_token: token.split(' ')[1], // Usar solo el token, sin el prefijo "Bearer"
      tiempo_cierre: { $exists: false }, // Verificar que el tiempo de cierre no exista (sesión activa)
    });

    if (!session) {
      console.warn('Token inválido o sesión expirada');
      await client.close();
      return res.status(401).json({ error: 'Token de sesión inválido o sesión expirada.' });
    }

    // Si la sesión es válida, asigna el `userId` al objeto de solicitud
    req.user = { id: decoded.userId }; // Se asegura que el usuario sea del JWT
    console.log('Usuario autenticado con userId:', decoded.userId);
    await client.close();
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      console.error('Error de autenticación con JWT:', err.message);
      return res.status(401).json({ error: 'Token inválido o expirado.', detalle: err.message });
    }

    console.error('Error en la consulta de sesión:', err);
    return res.status(500).json({ error: 'Error al verificar la sesión', detalle: err.message });
  }
};

module.exports = verificarSesion;
