const { MongoClient, ObjectId } = require('mongodb');
const conekta = require('conekta'); // Asumiendo que ya tienes configurado Conekta

// Configura tus credenciales de Conekta
conekta.api_key = 'key_lMqs81MhFOjMSNOf6XmVvgM';
conekta.api_version = '2.0.0';

const connectToDatabase = async () => {
  const client = new MongoClient(process.env.MONGO_URI);
  await client.connect();
  return client;
};

exports.crearPago = async (req, res) => {
  const { solicitud_id, monto, metodo_pago, nombre_titular, numero_tarjeta, cvv, fecha_expiracion } = req.body;

  if (!solicitud_id || !monto || !metodo_pago) {
    return res.status(400).json({ error: "Todos los campos obligatorios deben ser proporcionados." });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("AirTecs3");

    let pagoData = {
      solicitud_id: new ObjectId(solicitud_id),
      monto,
      metodo_pago,
      estado: "pendiente", // El técnico lo confirmará después
      fecha_creacion: new Date(),
    };

    if (metodo_pago === "tarjeta") {
      // Realiza el cobro con Conekta
      const charge = await conekta.Order.create({
        currency: 'MXN',
        customer_info: {
          name: nombre_titular
        },
        line_items: [{
          name: 'Servicio',
          unit_price: monto * 100, // En centavos
          quantity: 1
        }],
        charges: [{
          payment_method: {
            type: 'card',
            token_id: numero_tarjeta // Deberías usar un token seguro
          }
        }]
      });

      pagoData.conekta_order_id = charge.id;
      pagoData.estado = "confirmado"; // Pago realizado exitosamente
    } else if (metodo_pago === "oxxo") {
      // Genera referencia OXXO con Conekta
      const oxxoOrder = await conekta.Order.create({
        currency: 'MXN',
        customer_info: {
          name: nombre_titular
        },
        line_items: [{
          name: 'Servicio',
          unit_price: monto * 100,
          quantity: 1
        }],
        charges: [{
          payment_method: {
            type: 'oxxo_cash'
          }
        }]
      });

      pagoData.conekta_order_id = oxxoOrder.id;
      pagoData.referencia_oxxo = oxxoOrder.charges.data[0].payment_method.reference;
      pagoData.estado = "pendiente"; // Esperando que el cliente pague en OXXO
    } else if (metodo_pago === "efectivo") {
      // No hay procesamiento en línea
      pagoData.estado = "pendiente"; // Técnico confirmará el pago en Flutter
    } else {
      return res.status(400).json({ error: "Método de pago no válido." });
    }

    // Guarda el pago en la colección "pagos"
    await db.collection("pagos").insertOne(pagoData);

    // Actualiza la solicitud a "finalizado"
    await db.collection("solicitudes_servicio").updateOne(
      { _id: new ObjectId(solicitud_id) },
      { $set: { estado: "finalizado" } }
    );

    res.status(201).json({
      mensaje: "Pago registrado exitosamente.",
      pago: pagoData
    });

  } catch (error) {
    console.error("Error al crear el pago:", error);
    res.status(500).json({ error: "Error al procesar el pago.", detalle: error.message });
  }
};


// ✅ Actualizar estado del pago
exports.actualizarEstadoPago = async (req, res) => {
  const { pagoId } = req.params;
  const { estado } = req.body;

  // 🛑 Validaciones básicas
  if (!ObjectId.isValid(pagoId)) {
    return res.status(400).json({ error: "ID de pago no válido." });
  }

  if (!estado) {
    return res.status(400).json({ error: "El nuevo estado es obligatorio." });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db("AirTecs3");

    // 🔥 Actualizar el estado en la colección pagos
    const result = await db.collection("pagos").updateOne(
      { _id: new ObjectId(pagoId) },
      { $set: { estado: estado } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "Pago no encontrado." });
    }

    res.status(200).json({ mensaje: "✅ Estado del pago actualizado exitosamente." });
  } catch (error) {
    console.error("❌ Error al actualizar el estado del pago:", error);
    res.status(500).json({ error: "Error al actualizar el estado del pago." });
  }
};