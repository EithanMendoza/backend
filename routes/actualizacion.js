const express = require('express');
const router = express.Router();
const verificarTecnico = require('../middleware/tecnicosmiddleware');
const actualizacionController = require('../controllers/actualizacionController');

// Rutas para actualizar el estado del servicio
router.post('/actualizar-estado/:solicitudId', verificarTecnico, actualizacionController.actualizarEstadoServicio);

// Ruta para obtener los servicios finalizados (historial)
router.get('/servicios-finalizados', verificarTecnico, actualizacionController.obtenerServiciosFinalizados);

module.exports = router;
