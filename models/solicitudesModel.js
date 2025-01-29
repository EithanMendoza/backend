const { MongoClient } = require('mongodb');

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  return client;
};

// Obtener solicitudes pendientes
exports.getSolicitudesPendientes = async () => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const solicitudes = await db.collection('solicitudes_servicio').find({ estado: "pendiente" }).toArray();

  await client.close();
  return solicitudes;
};

// Aceptar una solicitud
exports.aceptarSolicitud = async (solicitudId, tecnicoId, codigoInicial) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const result = await db.collection('solicitudes_servicio').updateOne(
    { _id: solicitudId, estado: "pendiente" },
    { $set: { estado: "aceptada", tecnico_id: tecnicoId, codigo: codigoInicial } }
  );

  await client.close();
  return result.modifiedCount > 0;
};

// Cancelar una solicitud
exports.cancelarSolicitud = async (solicitudId, tecnicoId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const result = await db.collection('solicitudes_servicio').updateOne(
    { _id: solicitudId, tecnico_id: tecnicoId, estado: "aceptada" },
    { $set: { estado: "cancelada" } }
  );

  await client.close();
  return result.modifiedCount > 0;
};

// Obtener solicitudes aceptadas por un técnico
exports.getSolicitudesAceptadasPorTecnico = async (tecnicoId) => {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const solicitudes = await db.collection('solicitudes_servicio').find({ tecnico_id: tecnicoId, estado: "aceptada" }).toArray();

  await client.close();
  return solicitudes;
};
