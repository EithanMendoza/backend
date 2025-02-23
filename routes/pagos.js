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

// ✅ Obtener un pago por ID
router.get('/:pagoId', async (req, res) => {
  const client = await connectToDatabase();
  const db = client.db("AirTecs3");
  const pagoId = req.params.pagoId;

  try {
    const pago = await db.collection('pagos').findOne({ _id: ObjectId(pagoId) });
    if (!pago) return res.status(404).json({ error: 'Pago no encontrado.' });

    res.status(200).json(pago);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el pago.' });
  } finally {
    client.close();
  }
});

module.exports = router;
