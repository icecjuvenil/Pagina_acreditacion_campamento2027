
/*
 * CAMPAMENTO JUVENIL ICEC 2027
 * Consulta del resumen de inscripción
 * Cloudflare Workers + D1
 *
 * Solo permite consultar los datos
 * del participante que inició sesión.
 */

function responder(datos, estado = 200) {
  return Response.json(datos, {
    status: estado,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

export async function manejarResumen(
  request,
  env,
  { usuarioDeSesion, ORIGENES_PERMITIDOS }
) {
  // Solo se permiten consultas GET.
  if (request.method !== "GET") {
    return responder({
      mensaje: "Método no permitido."
    }, 405);
  }

  // Verificar que la solicitud provenga
  // de una página web autorizada.
  const origen = request.headers.get("Origin");

  if (
    !origen ||
    !ORIGENES_PERMITIDOS.includes(origen)
  ) {
    return responder({
      mensaje: "Origen no autorizado."
    }, 403);
  }

  if (!env.DB) {
    return responder({
      mensaje: "Base de datos no disponible."
    }, 503);
  }

  try {
    // Identificar al usuario mediante
    // su sesión autenticada.
    const usuario = await usuarioDeSesion(
      request,
      env
    );

    if (!usuario) {
      return responder({
        mensaje: "Debes iniciar sesión."
      }, 401);
    }

    if (usuario.rol !== "PARTICIPANTE") {
      return responder({
        mensaje: "No tienes permiso para consultar esta inscripción."
      }, 403);
    }

    const participanteId =
      Number(usuario.participante_id);

    if (
      !Number.isSafeInteger(participanteId) ||
      participanteId <= 0
    ) {
      return responder({
        mensaje: "No se encontró una inscripción asociada a tu cuenta."
      }, 404);
    }

    // Obtener solamente los datos del
    // participante autenticado.
    const participante = await env.DB.prepare(
      `SELECT
         p.id,
         p.nombre_completo,
         p.rut,
         p.fecha_nacimiento,
         p.genero,
         p.valor_acreditacion,
         u.correo
       FROM participantes p
       INNER JOIN usuarios u
         ON u.id = p.usuario_id
       WHERE p.id = ?
         AND u.id = ?
         AND u.activo = 1
       LIMIT 1`
    ).bind(
      participanteId,
      Number(usuario.id)
    ).first();

    if (!participante) {
      return responder({
        mensaje: "No se encontró tu inscripción."
      }, 404);
    }

    // Consultar acompañantes y pago.
    const [resultadoAcompanantes, pago] =
      await Promise.all([
        env.DB.prepare(
          `SELECT
             id,
             nombre_completo,
             rut,
             correo,
             fecha_nacimiento,
             genero,
             valor_acreditacion
           FROM acompanantes
           WHERE participante_id = ?
           ORDER BY id ASC`
        ).bind(participanteId).all(),

        env.DB.prepare(
          `SELECT
             id,
             monto_total,
             monto_pagado,
             estado,
             observaciones,
             comprobante_key
          FROM pagos
           WHERE participante_id = ?
           LIMIT 1`
        ).bind(participanteId).first()
      ]);

    if (!pago) {
      return responder({
        mensaje: "No se encontró el registro del pago."
      }, 404);
    }

    const acompanantes =
      (resultadoAcompanantes.results || [])
        .map((persona) => ({
          id: Number(persona.id),
          nombreCompleto: persona.nombre_completo,
          rut: persona.rut,
          correo: persona.correo || "",
          fechaNacimiento: persona.fecha_nacimiento,
          genero: persona.genero,
          valorAcreditacion:
            Number(persona.valor_acreditacion)
        }));

    // Responder sin exponer datos médicos,
    // contraseñas ni rutas privadas de R2.
    return responder({
      estado: "OK",

      participante: {
        id: Number(participante.id),
        nombreCompleto:
          participante.nombre_completo,
        rut: participante.rut,
        correo: participante.correo,
        fechaNacimiento:
        participante.fecha_nacimiento,
        genero: participante.genero,
        valorAcreditacion:
        Number(participante.valor_acreditacion)
      },

      acompanantes,

      cantidadInscritos:
        1 + acompanantes.length,

      pago: {
        id: Number(pago.id),
        montoTotal: Number(pago.monto_total),
        montoPagado: Number(pago.monto_pagado),
        
        estado: pago.estado,
        motivoRechazo:
            pago.estado === "RECHAZADO"
                ? (pago.observaciones || "")
                : "",
        comprobanteRecibido:
            Boolean(pago.comprobante_key)

      }
    });

  } catch (error) {
    console.error(
      "Error al consultar resumen:",
      error?.message
    );

    return responder({
      mensaje: "No fue posible recuperar la inscripción."
    }, 500);
  }
}
