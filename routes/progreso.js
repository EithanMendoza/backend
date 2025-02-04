const express = require('express');
const router = express.Router();
const verificarSesion = require('../middleware/authMiddleware');
const progresoController = require('../controllers/progresoController');

// Rutas
router.get('/progreso-servicio/:solicitudId', verificarSesion, progresoController.obtenerProgresoServicio);
// Obtener el historial de progreso de una solicitud por ID
router.get("/progreso-servicio1/:solicitudId", progresoController.obtenerProgresoServicio1);
module.exports = router;
