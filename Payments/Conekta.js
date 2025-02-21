const express = require('express');
const router = express.Router();
const conekta = require('conekta');

// Configura Conekta usando tu clave privada del archivo .env
conekta.api_key = process.env.CONEKTA_PRIVATE_KEY;
conekta.api_version = '2.0.0';

/**
 * Endpoint: POST /crear-pago
 * Descripción: Recibe un token de tarjeta, monto, descripción y opcionalmente un id de técnico,
 *              y crea un cargo en Conekta.
 *
 * Ejemplo de cuerpo de la petición (JSON):
 * {
 *   "token": "tok_1234567890",
 *   "amount": 85000,
 *   "descripcion": "Servicio de mantenimiento",
 *   "tecnico_id": "id_del_tecnico" // opcional, para referencia
 * }
 */
router.post('/crear-pago', async (req, res) => {
  try {
    // Extrae los datos de la petición
    const { token, amount, descripcion, tecnico_id } = req.body;

    // Crea el cargo en Conekta
    const charge = await conekta.Charge.create({
      amount: amount,             // Monto en centavos (ej: 85000 para 850)
      currency: 'MXN',            // O la moneda que estés usando
      description: descripcion,   // Descripción del servicio
      reference_id: tecnico_id,   // Opcional, para identificar el cargo (puede ser el ID del técnico)
      card: token,                // El token generado en el frontend por Conekta.js
      details: {
        name: 'Servicio de mantenimiento',
        line_items: [
          {
            name: 'Mantenimiento',
            unit_price: amount,   // Se cobra el monto completo
            quantity: 1,
          },
        ],
      },
    });

    // Responde con el cargo creado
    res.status(200).json({ charge });
  } catch (error) {
    console.error("Error al crear el cargo:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
