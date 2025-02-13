const express = require('express');
const router = express.Router();
const tecnicosController = require('../controllers/tecnicosController');
const authMiddleware = require('../middleware/authMiddleware'); // Middleware para verificar usuario autenticado

// Ruta para listar técnicos con paginación
router.get('/list', tecnicosController.listTecnicos);

// Ruta para obtener el perfil del técnico autenticado
router.get('/perfil', authMiddleware, tecnicosController.obtenerPerfilTecnico);

module.exports = router;
