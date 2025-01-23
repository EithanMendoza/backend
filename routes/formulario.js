const express = require('express');
const router = express.Router();
const verificarSesion = require('../middleware/authMiddleware');
const verificarPerfil = require('../middleware/perfilmiddleware');
const formularioController = require('../controllers/formularioController');

// Rutas
router.post('/crear-solicitud', verificarSesion, verificarPerfil, formularioController.crearSolicitud);
router.delete('/cancelar-solicitud/:solicitudId', verificarSesion, formularioController.cancelarSolicitud);
router.get('/pendientes', verificarSesion, formularioController.obtenerSolicitudesPendientes);

module.exports = router;
