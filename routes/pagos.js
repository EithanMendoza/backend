const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');


const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  return client;
};

// ✅ Obtener todos los pagos
router.get('/', async (req, res) => {
  const client = await connectToDatabase();
  const db = client.db("AirTecs3");

  try {
    const pagos = await db.collection('pagos').find().toArray();
    res.status(200).json(pagos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los pagos.' });
  } finally {
    client.close();
  }
});

// ✅ Obtener pagos por estado
router.get('/estado/:estado', async (req, res) => {
  const client = await connectToDatabase();
  const db = client.db("AirTecs3");
  const estado = req.params.estado;

  try {
    const pagos = await db.collection('pagos').find({ estado }).toArray();
    res.status(200).json(pagos);
  } catch (error) {
    res.status(500).json({ error: 'Error al filtrar pagos por estado.' });
  } finally {
    client.close();
  }
});

// ✅ Obtener pagos por técnico
router.get('/tecnico/:tecnicoId', async (req, res) => {
  const client = await connectToDatabase();
  const db = client.db("AirTecs3");
  const tecnicoId = req.params.tecnicoId;

  try {
    const pagos = await db.collection('pagos').find({ tecnico_id: ObjectId(tecnicoId) }).toArray();
    res.status(200).json(pagos);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener pagos del técnico.' });
  } finally {
    client.close();
  }
});

router.get('/solicitud/:solicitudId', async (req, res) => {
    const client = await connectToDatabase();
    const db = client.db("AirTecs3");
    const solicitudId = req.params.solicitudId;
  
    try {
      // Buscar el pago basado en el ID de la solicitud
      const pago = await db.collection('pagos').findOne({ solicitud_id: solicitudId });
  
      if (!pago) {
        return res.status(404).json({ error: 'No se encontró un pago para esta solicitud.' });
      }
  
      res.status(200).json(pago);
    } catch (error) {
      console.error("Error al obtener el pago:", error);
      res.status(500).json({ error: 'Error al obtener el pago.' });
    } finally {
      client.close();
    }
  });
  
  module.exports = router;
