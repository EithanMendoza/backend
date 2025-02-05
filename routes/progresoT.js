const express = require("express");
const router = express.Router();
const progresoController = require("../controllers/progresoController");

// ✅ Nueva ruta para obtener todas las solicitudes finalizadas desde `progreso_servicio`
router.get("/solicitudes-finalizadas", progresoController.obtenerSolicitudesFinalizadasT);

module.exports = router;
