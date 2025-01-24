const express = require('express');
const router = express.Router();
const tecnicosController = require('../controllers/tecnicosController');

// Ruta para listar técnicos con paginación
router.get('/list', tecnicosController.listTecnicos);

module.exports = router;
