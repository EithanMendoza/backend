const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');

const verificarSesion = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  
  if (!authHeader) {
    return res.status(401).json({ error: 'No se ha proporcionado un token de sesión.' });
  }

  const token = authHeader.split(' ')[1]; // Extrae el token sin "Bearer"
  
  try {
    // 🔥 Verificar JWT con la clave secreta
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (!decoded || !decoded.userId) {
      return res.status(401).json({ error: 'Token inválido o corrupto.' });
    }

    // Conexión a la BD
    const client = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const db = client.db('AirTecs3');

    // 🔹 Buscar sesión con el JWT en la base de datos
    const session = await db.collection('login').findOne({
      session_token: token, 
      tiempo_cierre: { $exists: false } // Sesión activa
    });

    await client.close();

    if (!session) {
      return res.status(401).json({ error: 'Token inválido o sesión expirada.' });
    }

    req.user = { id: decoded.userId };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.', detalle: err.message });
  }
};

module.exports = verificarSesion;
