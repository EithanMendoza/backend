const express = require('express');
const router = express.Router();
const autenticacionController = require('../controllers/usuariosController');

// Registrar usuario
router.post('/register', autenticacionController.registerUser);

// Iniciar sesión
router.post('/login', autenticacionController.loginUser);

// Cerrar sesión
router.post('/logout', autenticacionController.logoutUser);

// Listar usuarios
router.get('/list', autenticacionController.listUsers);

module.exports = router;
