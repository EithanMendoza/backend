const express = require('express');
const router = express.Router();
const tecnicosController = require('../controllers/tecnicosController');
const verificarTecnico = require('../middleware/tecnicosmiddleware');

// Registrar técnico
router.post('/register', tecnicosController.registrarTecnico);

// Iniciar sesión de técnico
router.post('/login', tecnicosController.iniciarSesionTecnico);

// Cerrar sesión de técnico
router.post('/logout', verificarTecnico, tecnicosController.cerrarSesionTecnico);

// Ruta para listar técnicos con paginación
router.get('/list', tecnicosController.listTecnicos);

// 📌 **Actualizar Avatar del Técnico (PUT)**
router.put("/update-avatar", verificarTecnico, tecnicosController.upload.single("avatar"), tecnicosController.updateAvatarTecnico);

module.exports = router;
