const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuariosController');

// Registrar usuario
router.post('/register', usuariosController.registerUsuario);

// Iniciar sesión
router.post('/login', usuariosController.loginUsuario);

// Cerrar sesión
router.post('/logout', usuariosController.logoutUsuario);

// Listar usuarios (Nueva ruta)
router.get('/list', usuariosController.listUsuarios);

module.exports = router;
