const { MongoClient, ObjectId } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  return client;
};

// Obtener todos los usuarios con información de sesiones
exports.getUsuariosWithSessions = async () => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');
  const usuarios = await db.collection('usuarios').aggregate([
    {
      $lookup: {
        from: 'login',
        localField: '_id',
        foreignField: 'user_id',
        as: 'sesiones',
      },
    },
    {
      $project: {
        id: '$_id',
        username: 1,
        email: 1,
        created_at: 1,
        sesiones: {
          tiempo_inicio: 1,
          tiempo_cierre: 1,
        },
      },
    },
  ]).toArray();
  await client.close();
  return usuarios;
};

// Eliminar un usuario y sus datos relacionados
exports.deleteUsuario = async (id) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const userId = new ObjectId(id);
  await db.collection('perfiles').deleteMany({ user_id: userId });
  await db.collection('login').deleteMany({ user_id: userId });
  const result = await db.collection('usuarios').deleteOne({ _id: userId });

  await client.close();
  return result.deletedCount > 0;
};
