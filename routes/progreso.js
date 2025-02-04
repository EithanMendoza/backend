const express = require("express");
const router = express.Router();
const progresoController = require("../controllers/progresoController");

// Ruta para obtener el historial de progreso de una solicitud específica
router.get("/:solicitudId", progresoController.obtenerProgresoServicio);

module.exports = router;
