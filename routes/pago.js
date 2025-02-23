const express = require('express');
const router = express.Router();
const { crearPago } = require('../controllers/pagoController'); // Asumiendo que el controller está en esta ruta

// Ruta para crear un nuevo pago
router.post('/crear', crearPago);

module.exports = router;
