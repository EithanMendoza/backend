const perfilModel = require('../models/perfilModel');

// Crear perfil
exports.crearPerfil = async (req, res) => {
  const { nombre, apellido, telefono, genero } = req.body;
  const userId = req.user ? req.user.id : null;

  if (!userId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  if (!nombre || !apellido || !telefono || !genero) {
    return res.status(400).json({ error: 'Todos los datos son obligatorios.' });
  }

  try {
    await perfilModel.crearPerfil(userId, { nombre, apellido, telefono, genero });
    res.status(201).json({ mensaje: 'Perfil creado correctamente.' });
  } catch (err) {
    console.error('Error al crear el perfil:', err);
    res.status(500).json({ error: 'Error al crear el perfil.', detalle: err.message });
  }
};

// Obtener perfil
exports.obtenerPerfil = async (req, res) => {
  const userId = req.user ? req.user.id : null;

  if (!userId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    const perfil = await perfilModel.obtenerPerfil(userId);

    if (!perfil) {
      return res.status(404).json({ error: 'Perfil no encontrado.' });
    }

    res.status(200).json(perfil);
  } catch (err) {
    console.error('Error al obtener el perfil:', err);
    res.status(500).json({ error: 'Error al obtener el perfil.', detalle: err.message });
  }
};

// Actualizar perfil
exports.actualizarPerfil = async (req, res) => {
  const { nombre, apellido, telefono, genero } = req.body;
  const userId = req.user ? req.user.id : null;

  if (!userId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  if (!nombre || !apellido || !telefono || !genero) {
    return res.status(400).json({ error: 'Todos los datos son obligatorios.' });
  }

  try {
    const actualizado = await perfilModel.actualizarPerfil(userId, { nombre, apellido, telefono, genero });

    if (!actualizado) {
      return res.status(404).json({ error: 'Perfil no encontrado.' });
    }

    res.status(200).json({ mensaje: 'Perfil actualizado correctamente.' });
  } catch (err) {
    console.error('Error al actualizar el perfil:', err);
    res.status(500).json({ error: 'Error al actualizar el perfil.', detalle: err.message });
  }
};

// Verificar si el perfil existe
exports.verificarPerfilExistente = async (req, res) => {
  const userId = req.user ? req.user.id : null;

  if (!userId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    const perfil = await perfilModel.obtenerPerfil(userId);

    res.status(200).json({
      exists: !!perfil,
      profile: perfil || null,
    });
  } catch (err) {
    console.error('Error al verificar el perfil:', err);
    res.status(500).json({ error: 'Error al verificar el perfil del usuario.', detalle: err.message });
  }
};
