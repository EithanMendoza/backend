const express = require('express');
const router = express.Router();
const solicitudesController = require('../controllers/solicitudesController');

// ✅ Nueva ruta para técnicos: Obtener solicitudes pendientes con info de usuario y servicio
router.get('/pendientes-tecnicos', solicitudesController.getSolicitudesPendientesTecnicos);

module.exports = router;
