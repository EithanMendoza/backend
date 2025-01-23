const { MongoClient, ObjectId } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  return client;
};

// Obtener servicios completados para un técnico
exports.getServiciosCompletadosPorTecnico = async (tecnicoId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const servicios = await db.collection('solicitudes_servicio').aggregate([
    {
      $match: {
        tecnico_id: new ObjectId(tecnicoId),
        estado: 'completado',
      },
    },
    {
      $lookup: {
        from: 'usuarios',
        localField: 'user_id',
        foreignField: '_id',
        as: 'usuario',
      },
    },
    { $unwind: '$usuario' },
    {
      $lookup: {
        from: 'perfiles',
        localField: 'usuario._id',
        foreignField: 'user_id',
        as: 'perfilUsuario',
      },
    },
    { $unwind: '$perfilUsuario' },
    {
      $lookup: {
        from: 'pagos',
        localField: '_id',
        foreignField: 'solicitud_id',
        as: 'pago',
      },
    },
    { $unwind: '$pago' },
    {
      $match: {
        'pago.estado': 'completado',
      },
    },
    {
      $project: {
        solicitudId: '$_id',
        fechaPago: '$pago.fecha',
        monto: '$pago.monto',
        userId: '$usuario._id',
        nombreUsuario: {
          $concat: ['$perfilUsuario.nombre', ' ', '$perfilUsuario.apellido'],
        },
      },
    },
    { $sort: { fechaPago: -1 } },
  ]).toArray();

  await client.close();
  return servicios;
};
