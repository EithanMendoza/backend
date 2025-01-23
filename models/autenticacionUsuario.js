const { MongoClient, ObjectId } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  return client;
};

// Registrar usuario
exports.registerUsuario = async (usuario) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const result = await db.collection('usuarios').insertOne(usuario);

  await client.close();
  return result.insertedId;
};

// Buscar usuario por email
exports.findUsuarioByEmail = async (email) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const usuario = await db.collection('usuarios').findOne({ email });

  await client.close();
  return usuario;
};

// Registrar sesión de usuario
exports.registerSession = async (session) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const result = await db.collection('sesiones_usuario').insertOne(session);

  await client.close();
  return result.insertedId;
};

// Cerrar sesión del usuario
exports.closeSession = async (sessionToken) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const result = await db.collection('sesiones_usuario').updateOne(
    { session_token: sessionToken, tiempo_cierre: null },
    { $set: { tiempo_cierre: new Date() } }
  );

  await client.close();
  return result.modifiedCount > 0;
};
