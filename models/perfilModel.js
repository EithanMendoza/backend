const { MongoClient, ObjectId } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  return client;
};

// Crear un perfil
exports.crearPerfil = async (userId, perfilData) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  await db.collection('perfiles').insertOne({
    user_id: new ObjectId(userId),
    ...perfilData,
  });

  await client.close();
};

// Obtener un perfil por userId
exports.obtenerPerfil = async (userId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const perfil = await db.collection('perfiles').findOne({ user_id: new ObjectId(userId) });

  await client.close();
  return perfil;
};

// Actualizar un perfil
exports.actualizarPerfil = async (userId, perfilData) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const result = await db.collection('perfiles').updateOne(
    { user_id: new ObjectId(userId) },
    { $set: perfilData }
  );

  await client.close();
  return result.modifiedCount > 0;
};
