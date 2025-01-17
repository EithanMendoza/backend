const db = require('../database'); // Conexión a la base de datos

// Middleware para verificar la sesión del técnico
const verificarTecnico = async (req, res, next) => {
    const token = req.headers['authorization']; // Token enviado en el encabezado

    if (!token) {
        return res.status(401).json({ error: 'Token de sesión no proporcionado.' });
    }

    try {
        // Conexión al pool de la base de datos
        const pool = await db.connect();

        // Obtener el tecnico_id a partir del token de sesión
        const queryTecnicoId = `
            SELECT tecnico_id 
            FROM sesiones_tecnico 
            WHERE session_token = @token AND tiempo_cierre IS NULL
        `;
        const tecnicoIdResult = await pool
            .request()
            .input('token', db.VarChar, token)
            .query(queryTecnicoId);

        if (tecnicoIdResult.recordset.length === 0) {
            return res.status(401).json({ error: 'Sesión no válida o expirada.' });
        }

        const tecnicoId = tecnicoIdResult.recordset[0].tecnico_id;

        // Verificar que el técnico exista en la tabla tecnicos_servicio
        const queryTecnico = `
            SELECT id 
            FROM tecnicos_servicio 
            WHERE id = @tecnicoId
        `;
        const tecnicoResult = await pool
            .request()
            .input('tecnicoId', db.BigInt, tecnicoId)
            .query(queryTecnico);

        if (tecnicoResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Técnico no encontrado.' });
        }

        // Asigna el tecnico_id a la solicitud para su uso en el endpoint
        req.tecnico = { id: tecnicoId };
        next(); // Continúa con la siguiente función middleware
    } catch (err) {
        console.error('Error al verificar la sesión del técnico:', err);
        return res.status(500).json({ error: 'Error interno al verificar la sesión del técnico.', detalle: err.message });
    }
};

module.exports = verificarTecnico;
