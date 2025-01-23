const { MongoClient, ObjectId } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  return client;
};

// Registrar técnico
exports.registerTecnico = async (tecnico) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const result = await db.collection('tecnicos_servicio').insertOne(tecnico);

  await client.close();
  return result.insertedId;
};

// Buscar técnico por email
exports.findTecnicoByEmail = async (email) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const tecnico = await db.collection('tecnicos_servicio').findOne({ email });

  await client.close();
  return tecnico;
};

// Registrar sesión de técnico
exports.registerSession = async (session) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const result = await db.collection('sesiones_tecnico').insertOne(session);

  await client.close();
  return result.insertedId;
};

// Cerrar sesión del técnico
exports.closeSession = async (sessionToken) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const result = await db.collection('sesiones_tecnico').updateOne(
    { session_token: sessionToken, tiempo_cierre: null },
    { $set: { tiempo_cierre: new Date() } }
  );

  await client.close();
  return result.modifiedCount > 0;
};
