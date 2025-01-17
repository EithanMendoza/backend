const db = require('../database'); // Conexión a la base de datos

const verificarPerfilCompleto = async (req, res, next) => {
    const tecnicoId = req.tecnico.id; // Asegúrate de que `req.tecnico.id` esté asignado previamente en un middleware anterior

    try {
        // Conexión al pool de la base de datos
        const pool = await db.connect();

        // Consulta para verificar el perfil del técnico
        const query = `
            SELECT * 
            FROM perfil_tecnico 
            WHERE tecnico_id = @tecnicoId
        `;
        const result = await pool
            .request()
            .input('tecnicoId', db.BigInt, tecnicoId) // Pasar tecnicoId como parámetro
            .query(query);

        if (result.recordset.length === 0) {
            // Si no se encuentra el perfil, devolver un error
            return res.status(403).json({ error: 'Debes completar tu perfil antes de aceptar solicitudes de servicio.' });
        }

        // Continuar al siguiente middleware si el perfil existe
        next();
    } catch (err) {
        console.error('Error al verificar el perfil del técnico:', err);
        return res.status(500).json({ error: 'Error al verificar el perfil del técnico' });
    }
};

module.exports = verificarPerfilCompleto;
