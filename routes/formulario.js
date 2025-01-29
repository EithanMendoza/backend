const express = require('express');
const router = express.Router();
const verificarSesion = require('../middleware/authMiddleware');
const formularioController = require('../controllers/formularioController');

router.post('/crear-solicitud', verificarSesion, formularioController.crearSolicitud);
router.get('/solicitudes-disponibles', verificarSesion, formularioController.obtenerSolicitudesDisponibles);
router.patch('/aceptar-solicitud/:solicitudId', verificarSesion, formularioController.asignarTecnico);
router.delete('/eliminar-expiradas', formularioController.eliminarSolicitudesExpiradas);

module.exports = router;
