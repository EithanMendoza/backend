const express = require('express');
const router = express.Router();
const tecnicosController = require('../controllers/tecnicosController');

// Registrar técnico
router.post('/register', tecnicosController.registrarTecnico);

// Iniciar sesión de técnico
router.post('/login', tecnicosController.iniciarSesionTecnico);

// Cerrar sesión de técnico
router.post('/logout', tecnicosController.cerrarSesionTecnico);

module.exports = router;
