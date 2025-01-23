const jwt = require('jsonwebtoken'); // Librería para manejar JWT
const { MongoClient } = require('mongodb'); // Conexión a la base de datos

const verificarPerfil = async (req, res, next) => {
  const token = req.headers['authorization']; // Token enviado en el encabezado

  if (!token) {
    return res.status(401).json({ error: 'Sesión no válida o token no proporcionado.' });
  }

  try {
    // Verificar y decodificar el token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Clave secreta configurada en las variables de entorno

    if (!decoded || !decoded.userId) {
      console.warn('Token inválido o corrupto');
      return res.status(401).json({ error: 'Sesión no válida o expirada.' });
    }

    const userId = decoded.userId;

    // Conexión a la base de datos MongoDB
    const client = new MongoClient(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();

    const db = client.db('AirTecs3'); // Cambiar al nombre de tu base de datos
    const perfilesCollection = db.collection('perfiles'); // Acceder a la colección `perfiles`

    // Verificar que el perfil del usuario esté completo
    console.log(`Verificando perfil para user_id: ${userId}`); // Debugging
    const perfil = await perfilesCollection.findOne({ user_id: userId });

    if (!perfil) {
      await client.close();
      return res.status(404).json({ error: 'Perfil no encontrado.' });
    }

    const { nombre, apellido, telefono, genero } = perfil;
    if (!nombre || !apellido || !telefono || !genero) {
      await client.close();
      return res
        .status(400)
        .json({ error: 'El perfil debe estar completo para acceder a esta funcionalidad.' });
    }

    // Continuar con la solicitud
    console.log('Perfil verificado correctamente:', perfil);
    await client.close();
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      console.error('Error de autenticación con JWT:', err.message);
      return res.status(401).json({ error: 'Token inválido o expirado.', detalle: err.message });
    }

    console.error('Error al verificar el perfil:', err);
    return res.status(500).json({ error: 'Error interno al verificar el perfil.', detalle: err.message });
  }
};

module.exports = verificarPerfil;
