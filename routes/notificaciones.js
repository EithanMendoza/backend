const express = require('express');
const router = express.Router();
const notificacionesController = require('../controllers/notificacionesController');
const verificarSesion = require('../middleware/authMiddleware');
const verificarTecnico = require('../middleware/tecnicosmiddleware');

// 📌 Obtener notificaciones del usuario autenticado
router.get('/usuario', verificarSesion, notificacionesController.obtenerNotificaciones);

// 📌 Obtener notificaciones del técnico autenticado
router.get('/tecnico', verificarTecnico, notificacionesController.obtenerNotificaciones);

// 📌 Marcar una notificación como leída
router.put('/marcar-leida/:notificacionId', notificacionesController.marcarNotificacionLeida);

// 📌 Eliminar notificaciones expiradas (para administración o cron jobs)
router.delete('/eliminar-expiradas', notificacionesController.eliminarNotificacionesExpiradas);

module.exports = router;
