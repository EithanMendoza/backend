const express = require('express');
const router = express.Router();
const solicitudesController = require('../controllers/solicitudesController');
const verificarTecnico = require('../middleware/tecnicosmiddleware');

// Rutas para técnicos
router.get('/solicitudes-pendientes', verificarTecnico, solicitudesController.getSolicitudesPendientes);
router.put('/aceptar-solicitud/:solicitudId', verificarTecnico, solicitudesController.aceptarSolicitud);
router.put('/cancelar-solicitud/:solicitudId', verificarTecnico, solicitudesController.cancelarSolicitud);
router.get('/solicitudes-aceptadas', verificarTecnico, solicitudesController.getSolicitudesAceptadas);

module.exports = router;
