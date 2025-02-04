const progresoModel = require('../models/progresoModel');
const notificacionesModel = require('../models/notificaciones');

// ✅ Definir los estados del servicio en orden
const ordenEstados = ['en_camino', 'en_lugar', 'en_proceso', 'finalizado'];

// ✅ Actualizar el estado de una solicitud con validaciones
exports.actualizarEstadoServicio = async (req, res) => {
  const { estado, codigoConfirmacion, detalles } = req.body;
  const { solicitudId } = req.params;
  const tecnicoId = req.tecnico ? req.tecnico.id : null;

  if (!tecnicoId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    // ✅ Verificar el código de confirmación solo para `en_proceso` y `finalizado`
    // ✅ Verificar el código de confirmación solo para `en_proceso` y `finalizado`
if (['en_lugar', 'finalizado'].includes(estado)) {
  if (!codigoConfirmacion) {
    return res.status(400).json({ error: 'Se requiere un código de confirmación para este estado.' });
  }

  // 🔥 Asegurar que comparamos con el campo correcto en la BD
  const solicitud = await progresoModel.obtenerSolicitudPorId(solicitudId);
  if (!solicitud) {
    return res.status(404).json({ error: 'Solicitud no encontrada.' });
  }

  console.log("📌 Código guardado en la BD:", solicitud.codigo);
  console.log("📩 Código recibido en la petición:", codigoConfirmacion);

  if (solicitud.codigo !== codigoConfirmacion) {
    return res.status(400).json({ error: 'Código de confirmación incorrecto.' });
  }
}

    // ✅ Verificar el orden de los estados
    const ultimoEstado = await progresoModel.obtenerUltimoEstado(solicitudId);
    const indiceUltimoEstado = ordenEstados.indexOf(ultimoEstado);
    const indiceNuevoEstado = ordenEstados.indexOf(estado);

    if (indiceNuevoEstado === -1 || indiceNuevoEstado !== indiceUltimoEstado + 1) {
      return res.status(400).json({ error: 'El estado no sigue el orden requerido.' });
    }

    // ✅ Obtener el `user_id` asociado a la solicitud
    const userId = await progresoModel.obtenerUserIdDeSolicitud(solicitudId);
    if (!userId) {
      return res.status(500).json({ error: 'Error interno: No se encontró el user_id asociado a la solicitud.' });
    }

    // ✅ Registrar el progreso
    await progresoModel.registrarProgreso(solicitudId, tecnicoId, estado, detalles);

    // ✅ Crear una notificación para el usuario
    const mensaje = `El estado de tu servicio ha cambiado a: ${estado}. ${detalles || ''}`;
    await notificacionesModel.crearNotificacion(userId, mensaje);

    res.status(200).json({ mensaje: 'Estado del servicio y notificación actualizados correctamente.' });
  } catch (err) {
    console.error('❌ Error al actualizar el estado del servicio:', err);
    res.status(500).json({ error: 'Error al actualizar el estado del servicio.', detalle: err.message });
  }
};

// ✅ Obtener los servicios finalizados para el técnico
exports.obtenerServiciosFinalizados = async (req, res) => {
  const tecnicoId = req.tecnico.id;

  try {
    const servicios = await progresoModel.obtenerServiciosFinalizadosPorTecnico(tecnicoId);
    res.status(200).json(servicios);
  } catch (err) {
    console.error('❌ Error al obtener los servicios finalizados:', err);
    res.status(500).json({ error: 'Error al obtener los servicios finalizados.', detalle: err.message });
  }
};
