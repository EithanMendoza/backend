const express = require('express');
const router = express.Router();
const db = require('../database'); // Conexión a la base de datos
const verificarSesion = require('../middleware/tecnicosmiddleware'); // Middleware de autenticación

// Crear o actualizar el perfil del técnico
router.post('/crear-perfilT', verificarSesion, async (req, res) => {
    const { nombre, apellido, telefono, genero, especialidad, experiencia } = req.body;
    const tecnicoId = req.tecnico.id;

    // Verificar que todos los campos obligatorios están presentes
    if (!nombre || !apellido || !telefono || !genero || !especialidad || !experiencia) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
    }

    try {
        const pool = await db.connect();

        // Verificar si ya existe un perfil para el técnico
        const queryVerificarPerfil = 'SELECT * FROM perfil_tecnico WHERE tecnico_id = @tecnicoId';
        const result = await pool.request()
            .input('tecnicoId', tecnicoId)
            .query(queryVerificarPerfil);

        if (result.recordset.length > 0) {
            // Si el perfil ya existe, se actualiza
            const queryActualizarPerfil = `
                UPDATE perfil_tecnico
                SET nombre = @nombre, apellido = @apellido, telefono = @telefono, 
                    genero = @genero, especialidad = @especialidad, experiencia = @experiencia
                WHERE tecnico_id = @tecnicoId
            `;
            await pool.request()
                .input('nombre', nombre)
                .input('apellido', apellido)
                .input('telefono', telefono)
                .input('genero', genero)
                .input('especialidad', especialidad)
                .input('experiencia', experiencia)
                .input('tecnicoId', tecnicoId)
                .query(queryActualizarPerfil);

            return res.status(200).json({ message: 'Perfil actualizado exitosamente.' });
        } else {
            // Si no existe un perfil, se crea
            const queryCrearPerfil = `
                INSERT INTO perfil_tecnico (tecnico_id, nombre, apellido, telefono, genero, especialidad, experiencia)
                VALUES (@tecnicoId, @nombre, @apellido, @telefono, @genero, @especialidad, @experiencia)
            `;
            await pool.request()
                .input('tecnicoId', tecnicoId)
                .input('nombre', nombre)
                .input('apellido', apellido)
                .input('telefono', telefono)
                .input('genero', genero)
                .input('especialidad', especialidad)
                .input('experiencia', experiencia)
                .query(queryCrearPerfil);

            return res.status(201).json({ message: 'Perfil creado exitosamente.' });
        }
    } catch (err) {
        console.error('Error al manejar el perfil del técnico:', err);
        res.status(500).json({ error: 'Error interno al manejar el perfil del técnico.', detalle: err.message });
    }
});

// Verificar si el perfil del técnico está completo
router.get('/completo', verificarSesion, async (req, res) => {
    const tecnicoId = req.tecnico.id;

    try {
        const pool = await db.connect();
        const query = 'SELECT * FROM perfil_tecnico WHERE tecnico_id = @tecnicoId';
        const result = await pool.request()
            .input('tecnicoId', tecnicoId)
            .query(query);

        if (result.recordset.length === 0) {
            return res.status(200).json({ completo: false });
        }

        res.status(200).json({ completo: true });
    } catch (err) {
        console.error('Error al verificar el perfil del técnico:', err);
        res.status(500).json({ error: 'Error interno al verificar el perfil del técnico.', detalle: err.message });
    }
});

// Obtener detalles del perfil del técnico
router.get('/detalles', verificarSesion, async (req, res) => {
    const tecnicoId = req.tecnico.id;

    try {
        const pool = await db.connect();
        const query = `
            SELECT nombre, apellido, telefono, genero, especialidad, experiencia
            FROM perfil_tecnico
            WHERE tecnico_id = @tecnicoId
        `;
        const result = await pool.request()
            .input('tecnicoId', tecnicoId)
            .query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ error: 'Perfil no encontrado.' });
        }

        res.status(200).json(result.recordset[0]);
    } catch (err) {
        console.error('Error al obtener el perfil del técnico:', err);
        res.status(500).json({ error: 'Error interno al obtener el perfil del técnico.', detalle: err.message });
    }
});

module.exports = router;
