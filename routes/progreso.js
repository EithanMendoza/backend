const express = require('express');
const router = express.Router();
const verificarSesion = require('../middleware/authMiddleware');
const progresoController = require('../controllers/progresoController');

// Rutas
router.get('/progreso-servicio/:solicitudId', verificarSesion, progresoController.obtenerProgresoServicio);

module.exports = router;
