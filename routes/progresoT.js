const express = require("express");
const router = express.Router();
const progresoController = require("../controllers/progresoController");
const verificarTecnico = require('../middleware/tecnicosmiddleware');

// ✅ Nueva ruta para obtener todas las solicitudes finalizadas desde `progreso_servicio`
router.get("/solicitudes-finalizadas", progresoController.obtenerSolicitudesFinalizadasT);
// Ruta para obtener el estado de la solicitud
router.get('/:solicitudId', verificarTecnico, progresoController.getEstadoSolicitudes);

// ✅ Ruta para actualizar el estado de una solicitud
router.post('/actualizar-estado/:solicitudId', progresoController.actualizarEstadoSolicitud);

module.exports = router;
