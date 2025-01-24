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
// Backend ajustado para devolver datos aleatorios
router.get('/list', async (req, res) => {
  const { page = 1, limit = 100, random = false } = req.query;
  const skip = (page - 1) * limit;

  try {
    const query = random
      ? [{ $sample: { size: parseInt(limit, 10) } }]
      : [{ $skip: skip }, { $limit: parseInt(limit, 10) }];

    const users = await User.aggregate(query);
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});


module.exports = router;
