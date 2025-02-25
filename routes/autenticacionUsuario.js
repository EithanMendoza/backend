const express = require('express');
const router = express.Router();
const autenticacionController = require('../controllers/usuariosController');
const verifyToken = require('../middleware/authMiddleware');

// Registrar usuario
router.post('/register', autenticacionController.registerUser);

// Iniciar sesión
router.post('/login', autenticacionController.loginUser);

// Cerrar sesión
router.post('/logout', autenticacionController.logoutUser);

// Listar usuarios
router.get('/list', autenticacionController.listUsers);

// Obtener usuario autenticado
router.get('/me', verifyToken, autenticacionController.getUserById);

// 📌 Actualizar Avatar (PUT)
router.put('/update-avatar', verifyToken, autenticacionController.upload.single('avatar'), autenticacionController.updateAvatar);

module.exports = router;
