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

// Obtener solicitudes aceptadas con lookup para el nombre del servicio y nombre del usuario
exports.getSolicitudesAceptadas = async (req, res) => {
  const tecnicoId = req.tecnico ? req.tecnico.id : null;

  if (!tecnicoId) {
    return res.status(403).json({ error: 'Acceso no autorizado.' });
  }

  try {
    // Usamos el modelo para obtener las solicitudes aceptadas con lookup
    const solicitudes = await solicitudesModel.getSolicitudesAceptadasPorTecnico(tecnicoId);

    // Devuelvo las solicitudes con los datos agregados mediante el lookup
    res.status(200).json(solicitudes);
  } catch (err) {
    console.error('Error al obtener las solicitudes aceptadas:', err);
    res.status(500).json({ error: 'Error al obtener las solicitudes aceptadas.', detalle: err.message });
  }
};


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

// 📌 GET: Obtener todas las solicitudes pagadas del técnico autenticado
exports.getSolicitudesPagadas = async (req, res) => {
  try {
    const tecnicoId = req.tecnico.id; // 🔥 ID del técnico autenticado

    if (!tecnicoId) {
      return res.status(400).json({ error: "ID de técnico no encontrado en la sesión." });
    }

    const client = new MongoClient(process.env.MONGO_URI);
    await client.connect();
    const db = client.db("AirTecs3");
    const solicitudesCollection = db.collection("solicitudes_servicio");

    // 🔥 Buscar solicitudes donde el estado sea "pagado" y el técnico asignado sea el autenticado
    const solicitudesPagadas = await solicitudesCollection
      .find({ estado: "pagado", tecnicoId: new ObjectId(tecnicoId) })
      .toArray();

    await client.close();

    if (solicitudesPagadas.length === 0) {
      return res.status(404).json({ mensaje: "No hay solicitudes pagadas para este técnico." });
    }

    res.status(200).json(solicitudesPagadas);
  } catch (error) {
    console.error("❌ Error al obtener solicitudes pagadas:", error);
    res.status(500).json({ error: "Error interno al obtener solicitudes pagadas." });
  }
};
