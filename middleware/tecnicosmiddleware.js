const jwt = require('jsonwebtoken'); // Librería para manejar JWT
const { MongoClient } = require('mongodb'); // Conexión a la base de datos

// Middleware para verificar la sesión del técnico
const verificarTecnico = async (req, res, next) => {
  const token = req.headers['authorization']; // Token enviado en el encabezado

  if (!token) {
    return res.status(401).json({ error: 'Token de sesión no proporcionado.' });
  }

  try {
    // Verificar y decodificar el token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Clave secreta configurada en las variables de entorno

    if (!decoded || !decoded.tecnicoId) {
      console.warn('Token inválido o corrupto');
      return res.status(401).json({ error: 'Sesión no válida o expirada.' });
    }

    const tecnicoId = decoded.tecnicoId;

    // Conexión a la base de datos MongoDB
    const client = new MongoClient(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();

    const db = client.db('AirTecs3'); // Cambiar al nombre de tu base de datos
    const tecnicosCollection = db.collection('tecnicos_servicio'); // Acceder a la colección `tecnicos_servicio`

    // Verificar que el técnico exista
    const tecnico = await tecnicosCollection.findOne({ id: tecnicoId });

    if (!tecnico) {
      console.warn('Técnico no encontrado para tecnicoId:', tecnicoId);
      await client.close();
      return res.status(404).json({ error: 'Técnico no encontrado.' });
    }

    // Asigna el tecnico_id a la solicitud para su uso en el endpoint
    req.tecnico = { id: tecnicoId };
    console.log('Técnico verificado con tecnico_id:', tecnicoId);
    await client.close();
    next(); // Continúa con la siguiente función middleware
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      console.error('Error de autenticación con JWT:', err.message);
      return res.status(401).json({ error: 'Token inválido o expirado.', detalle: err.message });
    }

    console.error('Error al verificar la sesión del técnico:', err);
    return res.status(500).json({ error: 'Error interno al verificar la sesión del técnico.', detalle: err.message });
  }
};

module.exports = verificarTecnico;
