const { MongoClient, ObjectId } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  return client;
};

// Verificar el estado del progreso de un servicio
exports.getProgresoEstado = async (solicitudId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const progreso = await db.collection('progreso_servicio')
    .find({ solicitud_id: new ObjectId(solicitudId) })
    .sort({ _id: -1 })
    .limit(1)
    .toArray();

  await client.close();
  return progreso.length > 0 ? progreso[0].estado : null;
};

// Registrar un nuevo pago
exports.registrarPago = async (solicitudId, monto, metodoPago) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const result = await db.collection('pagos').insertOne({
    solicitud_id: new ObjectId(solicitudId),
    monto,
    metodo_pago: metodoPago,
    estado: 'pendiente',
    fecha: new Date(),
  });

  await client.close();
  return result.insertedId;
};

// Completar un pago y actualizar su estado
exports.completarPago = async (pagoId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const result = await db.collection('pagos').updateOne(
    { _id: new ObjectId(pagoId) },
    { $set: { estado: 'completado' } }
  );

  await client.close();
  return result.modifiedCount > 0;
};

// Obtener pagos completados por técnico
exports.getPagosCompletadosPorTecnico = async (tecnicoId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const pagos = await db.collection('pagos').aggregate([
    {
      $lookup: {
        from: 'solicitudes_servicio',
        localField: 'solicitud_id',
        foreignField: '_id',
        as: 'solicitud',
      },
    },
    { $unwind: '$solicitud' },
    {
      $match: {
        'solicitud.tecnico_id': new ObjectId(tecnicoId),
        estado: 'completado',
      },
    },
    { $sort: { fecha: -1 } },
  ]).toArray();

  await client.close();
  return pagos;
};
