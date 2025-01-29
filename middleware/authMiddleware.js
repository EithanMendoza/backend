const jwt = require('jsonwebtoken');
const { MongoClient } = require('mongodb');

const verificarSesion = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log("📌 Header recibido:", authHeader); // Debug
  
  if (!authHeader) {
    console.warn("⚠️ No se recibió ningún token.");
    return res.status(401).json({ error: 'No se ha proporcionado un token de sesión.' });
  }

  const token = authHeader.split(' ')[1]; // Extrae el token sin "Bearer"
  console.log("📌 Token extraído:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token decodificado correctamente:", decoded);

    if (!decoded || !decoded.userId) {
      console.warn("⚠️ Token inválido o corrupto.");
      return res.status(401).json({ error: 'Token inválido o corrupto.' });
    }

    // Conexión a la BD
    const client = new MongoClient(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    const db = client.db('AirTecs3');

    // 🔹 Buscar sesión en la colección correcta
    const session = await db.collection('sesiones_usuario').findOne({ // Antes estaba en "login"
      session_token: token,
      tiempo_cierre: { $exists: false } // Verificar que la sesión está activa
    });

    await client.close();

    if (!session) {
      console.warn("⚠️ No se encontró una sesión activa con este token.");
      return res.status(401).json({ error: 'Token inválido o sesión expirada.' });
    }

    req.user = { id: decoded.userId };
    console.log("✅ Usuario autenticado correctamente:", decoded.userId);
    next();
  } catch (err) {
    console.error("❌ Error al verificar el token:", err);
    return res.status(401).json({ error: 'Token inválido o expirado.', detalle: err.message });
  }
};

module.exports = verificarSesion;
