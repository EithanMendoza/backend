const express = require('express');
const router = express.Router();
const solicitudesController = require('../controllers/solicitudesController');
const verificarTecnico = require('../middleware/tecnicosmiddleware');

// ✅ Nueva ruta para técnicos: Obtener solicitudes pendientes con info de usuario y servicio
router.get('/pendientes-tecnicos', solicitudesController.getSolicitudesPendientesTecnicos);
router.get('/pagados-tecnicos', verificarTecnico, solicitudesController.getSolicitudesPagadas);


module.exports = router;
