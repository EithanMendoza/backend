const pagosModel = require('../models/pago');
const notificacionesModel = require('../models/notificaciones'); // Asume que tienes un modelo para notificaciones

// Iniciar y completar un pago
exports.procesarPago = async (req, res) => { 
  const { metodoPago, monto } = req.body;
  const { solicitudId } = req.params;
  const userId = req.user ? req.user.id : null;

  if (!userId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    // Verificar el estado del progreso
    const estado = await pagosModel.getProgresoEstado(solicitudId);
    if (estado !== 'finalizado') {
      return res.status(400).json({ error: 'El servicio no está listo para ser pagado.' });
    }

    // Registrar el pago
    const pagoId = await pagosModel.registrarPago(solicitudId, monto, metodoPago);

    // Completar el pago
    const pagoCompletado = await pagosModel.completarPago(pagoId);

    if (!pagoCompletado) {
      return res.status(500).json({ error: 'Error al completar el pago.' });
    }

    // Enviar notificación al usuario
    await notificacionesModel.crearNotificacion(userId, 'El pago ha sido completado y el servicio marcado como completado.');

    res.status(200).json({ mensaje: 'Pago completado y servicio marcado como completado.' });
  } catch (err) {
    console.error('Error al procesar el pago:', err);
    res.status(500).json({
      error: 'Error interno al procesar el pago.',
      detalle: err.message,
    });
  }
};

// Obtener pagos completados para un técnico
exports.getPagosCompletados = async (req, res) => {
  const tecnicoId = req.user.id;

  try {
    const pagos = await pagosModel.getPagosCompletadosPorTecnico(tecnicoId);
    res.status(200).json(pagos);
  } catch (err) {
    console.error('Error al obtener los pagos completados:', err);
    res.status(500).json({
      error: 'Error interno al obtener los pagos completados.',
      detalle: err.message,
    });
  }
};
