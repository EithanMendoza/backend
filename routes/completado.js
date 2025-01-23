const express = require('express');
const router = express.Router();
const verificarSesion = require('../middleware/authMiddleware');
const completadoController = require('../controllers/completadoController');

// Ruta para obtener el estado de progreso de una solicitud
router.get('/estado-progreso/:solicitudId', verificarSesion, completadoController.obtenerEstadoProgreso);

module.exports = router;
