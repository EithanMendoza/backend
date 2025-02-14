const crypto = require('crypto');
const notificacionesModel = require('../models/notificaciones'); // Asumiendo que existe este modelo
const solicitudesModel = require('../models/solicitudesModel.js');
// Obtener solicitudes pendientes
exports.getSolicitudesPendientes = async (req, res) => {
  try {
    const solicitudes = await solicitudesModel.getSolicitudesPendientesTecnicos();
    res.status(200).json(solicitudes);
  } catch (err) {
    console.error('❌ Error al obtener las solicitudes pendientes para técnicos:', err);
    res.status(500).json({ error: 'Error al obtener las solicitudes pendientes para técnicos', detalle: err.message });
  }
};

exports.aceptarSolicitud = async (req, res) => {
  const { solicitudId } = req.params;
  const tecnicoId = req.tecnico ? req.tecnico.id : null;

  console.log("🛠️ Técnico autenticado para aceptar solicitud:", tecnicoId);
  console.log("🔎 ID de la solicitud recibida:", solicitudId);

  if (!tecnicoId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    const codigoInicial = crypto.randomBytes(3).toString('hex').toUpperCase();

    const aceptada = await solicitudesModel.aceptarSolicitud(solicitudId, tecnicoId, codigoInicial);

    if (!aceptada) {
      console.warn("⚠️ Solicitud no encontrada o ya aceptada:", solicitudId);
      return res.status(404).json({ error: 'Solicitud no encontrada o ya ha sido aceptada.' });
    }

    console.log("✅ Solicitud aceptada:", solicitudId);

    res.status(200).json({ mensaje: 'Solicitud aceptada.' });
  } catch (err) {
    console.error("❌ Error al aceptar solicitud:", err);
    res.status(500).json({ error: 'Error al aceptar la solicitud.', detalle: err.message });
  }
};
// Cancelar una solicitud
exports.cancelarSolicitud = async (req, res) => {
  const { solicitudId } = req.params;
  const tecnicoId = req.tecnico ? req.tecnico.id : null;

  if (!tecnicoId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    const cancelada = await solicitudesModel.cancelarSolicitud(solicitudId, tecnicoId);

    if (!cancelada) {
      return res.status(404).json({ error: 'Solicitud no encontrada o no se puede cancelar.' });
    }

    res.status(200).json({ mensaje: 'Solicitud cancelada correctamente.' });
  } catch (err) {
    console.error('Error al cancelar la solicitud:', err);
    res.status(500).json({ error: 'Error al cancelar la solicitud.', detalle: err.message });
  }
};

// Obtener solicitudes aceptadas con nombre de servicio y nombre de usuario
exports.getSolicitudesAceptadas = async (req, res) => {
  const tecnicoId = req.tecnico ? req.tecnico.id : null;

  if (!tecnicoId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    const solicitudes = await solicitudesModel.getSolicitudesAceptadasPorTecnico(tecnicoId);

    // Obtener el nombre del servicio y el nombre del usuario solicitante para cada solicitud
    const solicitudesConDetalles = await Promise.all(solicitudes.map(async (solicitud) => {
      const nombreServicio = await obtenerNombreServicio(solicitud.tipo_servicio); // Función para obtener el nombre del servicio
      const nombreUsuario = await obtenerNombreUsuario(solicitud.user_id); // Función para obtener el nombre del usuario

      return {
        ...solicitud,
        nombre_servicio: nombreServicio,
        nombre_usuario: nombreUsuario,
      };
    }));

    res.status(200).json(solicitudesConDetalles);
  } catch (err) {
    console.error('Error al obtener las solicitudes aceptadas:', err);
    res.status(500).json({ error: 'Error al obtener las solicitudes aceptadas.', detalle: err.message });
  }
};

// Función para obtener el nombre del servicio
async function obtenerNombreServicio(serviceType) {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const service = await db.collection('servicios').findOne({ tipo_servicio: serviceType });

  await client.close();
  return service ? service.nombre_servicio : 'Servicio desconocido';
}

// Función para obtener el nombre del usuario
async function obtenerNombreUsuario(userId) {
  const client = await connectToDatabase();
  const db = client.db('AirTecs3');

  const user = await db.collection('usuarios').findOne({ _id: new ObjectId(userId) });

  await client.close();
  return user ? user.nombre_usuario : 'Usuario desconocido';
}

// 📌 Obtener la solicitud en curso del usuario autenticado
exports.getSolicitudUsuario = async (req, res) => {
  const userId = req.user ? req.user.id : null;

  if (!userId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    const solicitud = await solicitudesModel.getSolicitudEnCurso(userId);

    if (!solicitud) {
      return res.status(404).json({ error: 'No tienes ninguna solicitud en curso.' });
    }

    res.status(200).json(solicitud);
  } catch (err) {
    console.error('Error al obtener la solicitud del usuario:', err);
    res.status(500).json({ error: 'Error al obtener la solicitud del usuario.', detalle: err.message });
  }
};

exports.obtenerSolicitudUsuario = async (req, res) => {
  try {
    const userId = req.user.id; // Asumimos que el usuario está autenticado y se obtiene su ID

    const solicitud = await solicitudesModel.obtenerSolicitudPorUsuario(userId);

    if (!solicitud) {
      return res.status(404).json({ error: "No tienes ninguna solicitud activa." });
    }

    res.status(200).json(solicitud);
  } catch (err) {
    console.error("Error al obtener la solicitud del usuario:", err);
    res.status(500).json({ error: "Error al obtener la solicitud del usuario.", detalle: err.message });
  }
};

// ✅ Obtener solicitudes pendientes con info de usuario y servicio
exports.getSolicitudesPendientesTecnicos = async (req, res) => {
  try {
    const solicitudes = await solicitudesModel.getSolicitudesPendientesTecnicos();
    res.status(200).json(solicitudes);
  } catch (err) {
    console.error('❌ Error al obtener las solicitudes pendientes para técnicos:', err);
    res.status(500).json({ error: 'Error al obtener las solicitudes pendientes para técnicos', detalle: err.message });
  }
};

exports.getSolicitudById = async (req, res) => {
  const { id } = req.params; // ✅ Obtener el ID de la solicitud desde la URL

  try {
    const solicitud = await solicitudesModel.getSolicitudById(id);
    
    if (!solicitud) {
      return res.status(404).json({ error: "Solicitud no encontrada" });
    }

    res.status(200).json(solicitud);
  } catch (err) {
    console.error("❌ Error al obtener la solicitud:", err);
    res.status(500).json({ error: "Error al obtener la solicitud", detalle: err.message });
  }
};
