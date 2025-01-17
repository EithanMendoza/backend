const express = require('express');
const router = express.Router();
const db = require('../database'); // Conexión a la base de datos
const verificarSesion = require('../middleware/authMiddleware'); // Middleware de autenticación

// Endpoint para obtener el progreso y detalles del servicio
router.get('/progreso-servicio/:solicitudId', verificarSesion, async (req, res) => {
    const { solicitudId } = req.params;

    try {
        const pool = await db.connect();

        const query = `
            SELECT 
                p.estado AS estado_progreso,
                p.timestamp AS fecha_progreso,
                p.detalles AS detalle_progreso,
                t.nombre_usuario AS nombre_tecnico,
                t.especialidad AS especialidad_tecnico,
                s.nombre_servicio,
                s.direccion,
                s.fecha AS fecha_solicitud,
                s.hora AS hora_solicitud,
                s.tipo_ac,
                s.marca_ac,
                s.detalles AS detalles_servicio,
                s.codigo_inicial,
                s.estado AS estado_solicitud
            FROM progreso_servicio p
            INNER JOIN tecnicos_servicio t ON p.tecnico_id = t.id
            INNER JOIN solicitudes_servicio s ON p.solicitud_id = s.id
            WHERE p.solicitud_id = @solicitudId
            ORDER BY p.timestamp ASC;
        `;

        const result = await pool.request()
            .input('solicitudId', solicitudId)
            .query(query);

        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'No se encontró el progreso para la solicitud especificada' });
        }

        // Datos adicionales de la solicitud (detalles del servicio)
        const servicioDetails = {
            solicitudId,
            nombre_servicio: result.recordset[0].nombre_servicio,
            direccion: result.recordset[0].direccion,
            fecha_solicitud: result.recordset[0].fecha_solicitud,
            hora_solicitud: result.recordset[0].hora_solicitud,
            tipo_ac: result.recordset[0].tipo_ac,
            marca_ac: result.recordset[0].marca_ac,
            detalles_servicio: result.recordset[0].detalles_servicio,
            codigo_inicial: result.recordset[0].codigo_inicial, // Incluye el código inicial
            estado_solicitud: result.recordset[0].estado_solicitud // Estado actual de la solicitud
        };

        res.status(200).json({
            detallesServicio: servicioDetails,
            progreso: result.recordset.map(row => ({
                estado_progreso: row.estado_progreso,
                fecha_progreso: row.fecha_progreso,
                detalle_progreso: row.detalle_progreso,
                nombre_tecnico: row.nombre_tecnico,
                especialidad_tecnico: row.especialidad_tecnico
            }))
        });
    } catch (error) {
        console.error('Error al obtener el progreso y detalles del servicio:', error);
        res.status(500).json({ message: 'Error al obtener el progreso y detalles del servicio', detalle: error.message });
    }
});

module.exports = router;
