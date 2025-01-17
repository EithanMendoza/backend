const express = require('express');
const router = express.Router();
const db = require('../database'); // Conexión directa a la base de datos

// Obtener los servicios desde la tabla `tipos_servicio`
router.get('/servicios', async (req, res) => {
  try {
    const pool = await db.connect(); // Conectar al pool de SQL Server
    const query = 'SELECT * FROM tipos_servicio'; // Consulta SQL

    const results = await pool.request().query(query); // Ejecutar la consulta
    res.status(200).json(results.recordset); // Enviar los resultados al frontend
  } catch (err) {
    console.error('Error al obtener los tipos de servicio:', err);
    res.status(500).json({
      error: 'Error al obtener los tipos de servicio',
      detalle: err.message
    });
  }
});

module.exports = router;
