const db = require('../database'); // Conexión a la base de datos

const verificarPerfil = async (req, res, next) => {
    const token = req.headers['authorization']; // Token enviado en el encabezado

    if (!token) {
        return res.status(401).json({ error: 'Sesión no válida o token no proporcionado.' });
    }

    try {
        // Conexión al pool de la base de datos
        const pool = await db.connect();

        // Obtener el user_id del token de sesión
        const queryUserId = `
            SELECT user_id 
            FROM login 
            WHERE session_token = @token AND tiempo_cierre IS NULL
        `;
        const userIdResult = await pool
            .request()
            .input('token', db.VarChar, token)
            .query(queryUserId);

        if (userIdResult.recordset.length === 0) {
            return res.status(401).json({ error: 'Sesión no válida o expirada.' });
        }

        const userId = userIdResult.recordset[0].user_id;

        // Verificar que el perfil del usuario esté completo
        console.log(`Verificando perfil para user_id: ${userId}`); // Debugging
        const queryPerfil = `
            SELECT nombre, apellido, telefono, genero 
            FROM perfiles 
            WHERE user_id = @userId
        `;
        const perfilResult = await pool
            .request()
            .input('userId', db.BigInt, userId)
            .query(queryPerfil);

        if (perfilResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Perfil no encontrado.' });
        }

        const perfil = perfilResult.recordset[0];
        if (!perfil.nombre || !perfil.apellido || !perfil.telefono || !perfil.genero) {
            return res.status(400).json({ error: 'El perfil debe estar completo para acceder a esta funcionalidad.' });
        }

        // Continuar con la solicitud
        next();
    } catch (err) {
        console.error('Error al verificar el perfil:', err);
        return res.status(500).json({ error: 'Error interno al verificar el perfil.', detalle: err.message });
    }
};

module.exports = verificarPerfil;
