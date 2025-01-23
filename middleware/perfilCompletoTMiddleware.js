const { MongoClient } = require('mongodb'); // Conexión a la base de datos

const verificarPerfilCompleto = async (req, res, next) => {
  const tecnicoId = req.tecnico?.id; // Asegúrate de que `req.tecnico.id` esté asignado previamente en un middleware anterior

  if (!tecnicoId) {
    console.error('El ID del técnico no está definido en la solicitud');
    return res.status(400).json({ error: 'ID del técnico no proporcionado' });
  }

  try {
    // Conexión a la base de datos MongoDB
    const client = new MongoClient(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();

    const db = client.db('AirTecs3'); // Cambiar al nombre de tu base de datos
    const perfilCollection = db.collection('perfil_tecnico'); // Acceder a la colección `perfil_tecnico`

    // Verificar si existe un perfil para el técnico
    const perfil = await perfilCollection.findOne({ tecnico_id: tecnicoId });

    if (!perfil) {
      console.warn('Perfil técnico no encontrado para el ID proporcionado:', tecnicoId);
      await client.close();
      return res.status(403).json({ error: 'Debes completar tu perfil antes de aceptar solicitudes de servicio.' });
    }

    // Continuar al siguiente middleware si el perfil existe
    console.log('Perfil técnico verificado para tecnico_id:', tecnicoId);
    await client.close();
    next();
  } catch (err) {
    console.error('Error al verificar el perfil del técnico:', err);
    return res.status(500).json({ error: 'Error al verificar el perfil del técnico', detalle: err.message });
  }
};

module.exports = verificarPerfilCompleto;
