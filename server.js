const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Crear instancia de la aplicación Express
const app = express();
const port = 3000;

// Importar la conexión a la base de datos
require('./database'); // Verifica que el archivo database.js esté correctamente configurado

// Habilitar CORS para todas las solicitudes
app.use(cors());

// Middleware para parsear JSON y datos codificados
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Importar rutas y modelos
const autenticacionTecnicos = require('./models/autenticacionTecnicos');
const autenticacionUsuario = require('./models/autenticacionUsuario');
const formulario = require('./routes/formulario');
const home = require('./routes/home');
const aceptacionSolicitudT = require('./routes/AceptacionSolicitudT');
const notificaciones = require('./models/notificaciones');
const perfil = require('./routes/perfil');
const perfilTRouter = require('./routes/perfilT'); 
const actualizacion = require('./routes/actualizacion');
const pago = require('./models/pago');
const reportar = require('./models/reportar');
const finalizacion = require('./models/finalizacion');
const serviciosfinalizadosT = require('./models/serviciosfinalizadosT');
const progreso = require('./routes/progreso');
const completado = require('./routes/completado');
const administrador = require('./models/administrador');

// Configurar rutas
app.use('/autenticacionTecnicos', autenticacionTecnicos);
app.use('/autenticacionUsuario', autenticacionUsuario);
app.use('/formulario', formulario);
app.use('/home', home);
app.use('/aceptacionSolicitudT', aceptacionSolicitudT);
app.use('/notificaciones', notificaciones);
app.use('/perfil', perfil);
app.use('/perfilT', perfilTRouter);
app.use('/actualizacion', actualizacion);
app.use('/pago', pago);
app.use('/reportar', reportar);
app.use('/finalizacion', finalizacion);
app.use('/serviciosfinalizadosT', serviciosfinalizadosT);
app.use('/progreso', progreso);
app.use('/completado', completado);
app.use('/administrador', administrador);

// Middleware global para manejar errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Algo salió mal.');
});

// Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
