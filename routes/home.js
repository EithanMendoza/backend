const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// Ruta para obtener los servicios disponibles
router.get('/servicios', homeController.obtenerServicios);

module.exports = router;
