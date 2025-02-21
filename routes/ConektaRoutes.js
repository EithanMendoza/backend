// routes/conektaRoutes.js
const express = require('express');
const router = express.Router();
const conekta = require('conekta');

conekta.api_key = process.env.CONEKTA_PRIVATE_KEY; // Asegúrate de tener esta variable en tu .env
conekta.api_version = '2.0.0';

// Endpoint para crear un cargo (Charge)
router.post('/crear-pago', async (req, res) => {
  try {
    const { token, amount, descripcion, tecnico_id } = req.body;
    // Ejemplo: amount en centavos (85000 para 850 en moneda base)
    const charge = await conekta.Charge.create({
      amount: amount, 
      currency: 'MXN', // O la moneda que estés usando
      description: descripcion,
      reference_id: tecnico_id, // Opcional, para identificar el cargo
      card: token, // El token generado en el frontend por Conekta.js
      details: {
        name: "Servicio de mantenimiento",
        line_items: [
          {
            name: "Mantenimiento",
            unit_price: amount,
            quantity: 1,
          },
        ],
      },
    });

    res.status(200).json({ charge });
  } catch (error) {
    console.error("Error al crear el cargo:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
