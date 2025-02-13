const express = require('express');
const router = express.Router();
const tecnicosController = require('../controllers/tecnicosController');
const verificarTecnico = require('../middleware/tecnicosmiddleware'); 

// Ruta para listar técnicos con paginación
router.get('/list', tecnicosController.listTecnicos);

// Ruta para obtener el perfil del técnico autenticado
router.get('/perfil', verificarTecnico, tecnicosController.obtenerPerfilTecnico);

module.exports = router;
