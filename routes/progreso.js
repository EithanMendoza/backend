const express = require('express');
const router = express.Router();
const verificarSesion = require('../middleware/authMiddleware');
const progresoController = require('../controllers/progresoController');

// Rutas
router.get('/progreso-servicio/:solicitudId', verificarSesion, progresoController.obtenerProgresoServicio);
// Ruta para obtener el historial de progreso de una solicitud específica
router.get("/progreso-servicio1/:solicitudId", progresoController.obtenerProgresoServicio1);
module.exports = router;
