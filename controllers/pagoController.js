// controllers/pagoController.js
const { MongoClient, ObjectId } = require('mongodb');

// Conexión a la base de datos
const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  return client;
};

// 💾 Guardar el pago en la colección pagos_servicios
const guardarPagoEnBD = async (pagoData) => {
  const client = await connectToDatabase();
  const db = client.db("AirTecs3");

  await db.collection("pagos_servicios").insertOne({
    solicitud_id: new ObjectId(pagoData.solicitud_id),
    tecnico_id: new ObjectId(pagoData.tecnico_id),
    tipo_servicio: pagoData.tipo_servicio,
    monto: pagoData.monto,
    metodo_pago: pagoData.metodo_pago,
    estado_pago: pagoData.estado_pago,
    conekta_id: pagoData.conekta_id,
    fecha_pago: pagoData.fecha_pago,
  });

  await client.close();
};

// 🔄 Actualizar el estado del servicio en progreso_servicio
const actualizarEstadoServicio = async (solicitudId, nuevoEstado) => {
  const client = await connectToDatabase();
  const db = client.db("AirTecs3");

  await db.collection("progreso_servicio").updateOne(
    { solicitud_id: new ObjectId(solicitudId) },
    { $set: { estado_solicitud: nuevoEstado } }
  );

  await client.close();
};

module.exports = {
  guardarPagoEnBD,
  actualizarEstadoServicio,
};
