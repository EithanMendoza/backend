const db = require('../database'); // Conexión a la base de datos

// Middleware de autenticación para verificar el token de sesión de usuarios
const verificarSesion = async (req, res, next) => {
  const token = req.headers['authorization']; // El token de sesión debe enviarse en el header de autorización

  if (!token) {
    console.error('Token de sesión no proporcionado');
    return res.status(401).json({ error: 'No se ha proporcionado un token de sesión.' });
  }

  try {
    // Verificar el token en la tabla `login` para usuarios
    const pool = await db.connect(); // Obtener la conexión del pool
    const query = `
      SELECT user_id 
      FROM login 
      WHERE session_token = @token 
        AND tiempo_cierre IS NULL
    `;
    const result = await pool
      .request()
      .input('token', db.VarChar, token) // Pasar el token como parámetro
      .query(query);

    if (result.recordset.length === 0) {
      console.warn('Token inválido o sesión expirada');
      return res.status(401).json({ error: 'Token de sesión inválido o sesión expirada.' });
    }

    // Si la sesión es válida, asigna el `user_id` y continúa con la solicitud
    req.user = { id: result.recordset[0].user_id };
    console.log('Usuario autenticado con user_id:', result.recordset[0].user_id);
    next();
  } catch (err) {
    console.error('Error en la consulta de sesión:', err);
    return res.status(500).json({ error: 'Error al verificar la sesión', detalle: err.message });
  }
};

module.exports = verificarSesion;
