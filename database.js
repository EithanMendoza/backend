const sql = require('mssql'); // Importar el paquete mssql
require('dotenv').config(); // Cargar variables de entorno desde el archivo .env

// Configurar los parámetros de conexión
const config = {
    user: 'sqlserver',          // Usuario de la base de datos
    password: 'admin',          // Contraseña del usuario
    server: '34.71.106.69',     // Dirección IP o DNS del host
    database: 'AirTecs',        // Nombre de la base de datos
    options: {
        encrypt: true,          // Activar si usas Azure o HTTPS
        trustServerCertificate: true, // Desactivar validación estricta del certificado
    },
    port: 1433                  // Puerto de SQL Server (por defecto: 1433)
};

// Conectar a la base de datos
const dbConnect = async () => {
    try {
        const pool = await sql.connect(config);
        console.log('Conexión exitosa a SQL Server');
        return pool;
    } catch (err) {
        console.error('Error conectando a la base de datos:', err);
    }
};

module.exports = { dbConnect, sql };
