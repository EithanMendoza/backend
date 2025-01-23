const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Cargar variables de entorno
const { dbConnect } = require('./database'); // Conexión a MongoDB

// Crear instancia de la aplicación Express
const app = express();
const port = process.env.PORT || 3000;

// Habilitar CORS
app.use(cors());

// Middleware para parsear JSON
app.use(express.json());

// Conexión a MongoDB
(async () => {
  try {
    const db = await dbConnect();
    app.locals.db = db; // Hacer que la conexión esté disponible globalmente
    console.log('Conexión establecida con MongoDB');
  } catch (err) {
    console.error('Error al conectar con MongoDB:', err);
    process.exit(1); // Detener el servidor si no se puede conectar a MongoDB
  }
})();

// Importar rutas
const autenticacionTecnicosRoutes = require('./routes/autenticacionTecnicos');
const aceptacionSolicitudRouter = require('./routes/AceptacionSolicitudT');
const actualizacionRouter = require('./routes/actualizacion');
const completadoRouter = require('./routes/completado');
const formularioRouter = require('./routes/formulario');
const homeRouter = require('./routes/home');
const autenticacionUsuariosRoutes = require('./routes/autenticacionUsuario');
const progresoRouter = require('./routes/progreso');

// Configurar rutas
app.use('/autenticacionTecnicos', autenticacionTecnicosRoutes);
app.use('/aceptacionSolicitud', aceptacionSolicitudRouter);
app.use('/actualizacion', actualizacionRouter);
app.use('/completado', completadoRouter);
app.use('/formulario', formularioRouter);
app.use('/home', homeRouter);
app.use('/progreso', progresoRouter);
app.use('/autenticacionUsuario', autenticacionUsuariosRoutes);

// Middleware para manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Error interno del servidor', detalle: err.message });
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
