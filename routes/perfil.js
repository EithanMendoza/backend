const express = require('express');
const router = express.Router();
const db = require('../database'); // Conexión a la base de datos
const verificarSesion = require('../middleware/authMiddleware'); // Middleware de sesión

// Crear perfil
router.post('/crear-perfil', verificarSesion, async (req, res) => {
    const { nombre, apellido, telefono, genero } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!userId) {
        return res.status(403).json({ error: 'Acceso no autorizado.' });
    }

    if (!nombre || !apellido || !telefono || !genero) {
        return res.status(400).json({ error: 'Todos los datos son obligatorios.' });
    }

    try {
        const pool = await db.connect();
        const query = `
            INSERT INTO perfiles (user_id, nombre, apellido, telefono, genero)
            VALUES (@userId, @nombre, @apellido, @telefono, @genero)
        `;
        await pool.request()
            .input('userId', userId)
            .input('nombre', nombre)
            .input('apellido', apellido)
            .input('telefono', telefono)
            .input('genero', genero)
            .query(query);

        res.status(201).json({ mensaje: 'Perfil creado correctamente.' });
    } catch (err) {
        console.error('Error al crear el perfil:', err);
        res.status(500).json({ error: 'Error al crear el perfil.', detalle: err.message });
    }
});

// Obtener perfil
router.get('/perfil', verificarSesion, async (req, res) => {
    const userId = req.user ? req.user.id : null;

    if (!userId) {
        return res.status(403).json({ error: 'Acceso no autorizado.' });
    }

    try {
        const pool = await db.connect();
        const query = `
            SELECT nombre, apellido, telefono, genero
            FROM perfiles
            WHERE user_id = @userId
        `;
        const result = await pool.request().input('userId', userId).query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Perfil no encontrado.' });
        }

        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error('Error al obtener el perfil:', err);
        res.status(500).json({ error: 'Error al obtener el perfil.', detalle: err.message });
    }
});

// Actualizar perfil
router.put('/perfilput', verificarSesion, async (req, res) => {
    const { nombre, apellido, telefono, genero } = req.body;
    const userId = req.user ? req.user.id : null;

    if (!userId) {
        return res.status(403).json({ error: 'Acceso no autorizado.' });
    }

    if (!nombre || !apellido || !telefono || !genero) {
        return res.status(400).json({ error: 'Todos los datos son obligatorios.' });
    }

    try {
        const pool = await db.connect();
        const query = `
            UPDATE perfiles
            SET nombre = @nombre, apellido = @apellido, telefono = @telefono, genero = @genero
            WHERE user_id = @userId
        `;
        await pool.request()
            .input('userId', userId)
            .input('nombre', nombre)
            .input('apellido', apellido)
            .input('telefono', telefono)
            .input('genero', genero)
            .query(query);

        res.status(200).json({ mensaje: 'Perfil actualizado correctamente.' });
    } catch (err) {
        console.error('Error al actualizar el perfil:', err);
        res.status(500).json({ error: 'Error al actualizar el perfil.', detalle: err.message });
    }
});

// Verificar si el perfil existe
router.get('/existe-perfil', verificarSesion, async (req, res) => {
    const userId = req.user ? req.user.id : null;

    if (!userId) {
        return res.status(403).json({ error: 'Acceso no autorizado.' });
    }

    try {
        const pool = await db.connect();
        const query = `
            SELECT * FROM perfiles
            WHERE user_id = @userId
        `;
        const result = await pool.request().input('userId', userId).query(query);

        if (result.recordset.length > 0) {
            return res.status(200).json({ exists: true, profile: result.recordset[0] });
        } else {
            return res.status(200).json({ exists: false });
        }
    } catch (err) {
        console.error('Error al verificar el perfil:', err);
        res.status(500).json({ error: 'Error al verificar el perfil del usuario.', detalle: err.message });
    }
});

module.exports = router;
