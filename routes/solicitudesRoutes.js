const express = require('express');
const router = express.Router();
const solicitudesController = require('../controllers/solicitudesController');
const verificarUsuario = require('../middleware/authMiddleware'); // Middleware para verificar usuario autenticado

// 📌 Obtener la solicitud en curso del usuario autenticado
router.get('/mi-solicitud', verificarUsuario, solicitudesController.getSolicitudUsuario);

module.exports = router;