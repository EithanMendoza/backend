const express = require('express');
const router = express.Router();
const autenticacionController = require('../controllers/usuariosController');
const usuariosModel = require('../models/autenticacionUsuario');
const verifyToken = require('../middleware/authMiddleware');

// Registrar usuario
router.post('/register', autenticacionController.registerUser);

// Iniciar sesión
router.post('/login', autenticacionController.loginUser);

// Cerrar sesión
router.post('/logout', autenticacionController.logoutUser);

// Listar usuarios
router.get('/list', autenticacionController.listUsers);
// 📌 Ruta para obtener al usuario autenticado
router.get('/me', verifyToken, autenticacionController.getUserById);
module.exports = router;
