const express = require('express');
const axios = require('axios'); // Aseguramos que usamos Axios directamente si es necesario
const { Configuration, OrdersApi, CustomersApi } = require('conekta');
const router = express.Router();

// ✅ Configuración de Conekta
const API_KEY = process.env.CONEKTA_PRIVATE_KEY;
console.log("🔑 Conekta API Key:", API_KEY);

if (!API_KEY) {
  console.error("❌ ERROR: No se encontró la clave API de Conekta en las variables de entorno.");
}

const config = new Configuration({ accessToken: API_KEY });
const ordersClient = new OrdersApi(config);
const customersClient = new CustomersApi(config);

// ✅ Crear Cliente si no Existe
const createCustomerIfNotExists = async (user) => {
  try {
    console.log("🔍 Buscando o creando cliente en Conekta...");

    const customerData = {
      name: user.name,
      email: user.email,
      phone: user.phone,
    };

    console.log("📤 Enviando datos para crear cliente:", customerData);

    // ⚡ Forzamos el uso de axios directamente si hay problemas con el SDK
    const response = await axios.post(
      'https://api.conekta.io/customers',
      customerData,
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.conekta-v2.1.0+json',
        },
      }
    );

    console.log("✔ Cliente creado en Conekta:", response.data.id);
    return response.data.id;

  } catch (error) {
    console.error("❌ Error creando el cliente en Conekta:", error.response ? error.response.data : error.message);
    throw new Error("Error al crear el cliente en Conekta");
  }
};

// ✅ Ruta para Crear el Pago
router.post('/crear-pago', async (req, res) => {
  try {
    const { token, amount, descripcion, tecnico_id, user } = req.body;

    console.log("📌 Datos recibidos para crear pago:", req.body);

    // 🔸 Validación Básica
    if (!token || !amount || !descripcion || !user) {
      return res.status(400).json({ error: "Faltan datos obligatorios" });
    }

    // 🔸 Crear o Obtener Cliente en Conekta
    const customerId = await createCustomerIfNotExists(user);

    // 🔸 Crear la Orden en Conekta
    const orderRequest = {
      currency: "MXN",
      customer_info: {
        customer_id: customerId,
      },
      line_items: [
        {
          name: descripcion,
          unit_price: amount, // Conekta usa centavos
          quantity: 1,
        },
      ],
      charges: [
        {
          payment_method: {
            type: "card",
            token_id: token,
          },
        },
      ],
    };

    console.log("📤 Enviando solicitud de orden a Conekta:", orderRequest);
    const orderResponse = await ordersClient.createOrder(orderRequest);

    console.log("✔ Orden creada en Conekta:", orderResponse.data.id);

    res.status(200).json({
      message: "Pago realizado correctamente",
      order: orderResponse.data,
    });

  } catch (error) {
    console.error("❌ Error al procesar el pago:", error.response ? error.response.data : error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
