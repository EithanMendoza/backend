const express = require('express');
const router = express.Router();
const perfilUsuarioController = require('../controllers/usuariosController');
// Se asume que tienes un middleware para autenticar usuarios, similar al de técnicos.
const verificarUsuario = require('../middleware/authMiddleware'); 

// Ruta para obtener el perfil del usuario autenticado
router.get('/perfil', verificarUsuario, perfilUsuarioController.obtenerPerfilUsuario);

module.exports = router;
