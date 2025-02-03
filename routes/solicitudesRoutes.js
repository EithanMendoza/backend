const express = require('express');
const router = express.Router();
const solicitudesController = require('../controllers/solicitudesController');
const verificarUsuario = require('../middleware/authMiddleware'); // Middleware para verificar usuario autenticado

// Obtener la solicitud activa del usuario autenticado
router.get("/mi-solicitud", verificarUsuario, solicitudesController.obtenerSolicitudUsuario);

module.exports = router;