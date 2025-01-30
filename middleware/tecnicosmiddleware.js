const jwt = require('jsonwebtoken');
const { MongoClient, ObjectId } = require('mongodb');

const verificarTecnico = async (req, res, next) => {
  console.log("📌 Headers completos recibidos:", req.headers); 

  const authHeader = req.headers['authorization'];

  console.log("📌 Header de autorización recibido:", authHeader);

  if (!authHeader) {
    console.warn("⚠️ Token no válido o ausente.");
    return res.status(401).json({ error: 'Token no válido o ausente.' });
  }

  // 🔥 Convertir `bearer` a `Bearer` para evitar errores de capitalización
  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0].toLowerCase() !== "bearer") {
    console.warn("⚠️ Formato de token incorrecto.");
    return res.status(401).json({ error: 'Formato de token incorrecto. Usa "Bearer <token>"' });
  }

  const token = tokenParts[1]; // Extraer solo el token
  console.log("📌 Token extraído:", token);

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token decodificado:", decoded);

    if (!decoded || !decoded.tecnico_id) {
      console.warn("⚠️ Token inválido o corrupto.");
      return res.status(401).json({ error: 'Token inválido o corrupto.' });
    }

    const tecnicoId = decoded.tecnico_id;

    // Conectar a MongoDB y verificar técnico
    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db('AirTecs3');
    const tecnicosCollection = db.collection('tecnicos_servicio');

    const tecnico = await tecnicosCollection.findOne({ _id: new ObjectId(tecnicoId) });

    if (!tecnico) {
      console.warn("⚠️ Técnico no encontrado:", tecnicoId);
      await client.close();
      return res.status(404).json({ error: 'Técnico no encontrado.' });
    }

    req.tecnico = { id: tecnicoId };
    console.log("✅ Técnico autenticado correctamente:", tecnicoId);
    
    await client.close();
    next();
  } catch (err) {
    console.error("❌ Error en la autenticación con JWT:", err);
    return res.status(401).json({ error: 'Token inválido o expirado.', detalle: err.message });
  }
};

module.exports = verificarTecnico;
