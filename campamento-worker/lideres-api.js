
/*
 * CAMPAMENTO ICEC 2027
 * Beneficio de inscripción gratuita para líderes
 * Cloudflare Workers + D1
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

export async function manejarBeneficioLider(
  request,
  env,
  { usuarioDeSesion, ORIGENES_PERMITIDOS }
) {
  if (request.method !== "POST") {
    return responder({
      mensaje: "Método no permitido."
    }, 405);
  }

  const origen = request.headers.get("Origin");

  if (
    !origen ||
    !ORIGENES_PERMITIDOS.includes(origen) ||
    request.headers.get("X-ICEC-Solicitud") !== "web"
  ) {
    return responder({
      mensaje: "Solicitud no autorizada."
    }, 403);
  }

  if (!env.DB || !env.CLAVE_LIDER) {
    return responder({
      mensaje: "El beneficio para líderes no está configurado."
    }, 503);
  }

  const usuario = await usuarioDeSesion(request, env);

  if (!usuario) {
    return responder({
      mensaje: "Debes iniciar sesión."
    }, 401);
  }

  if (
    usuario.rol !== "PARTICIPANTE" ||
    !Number.isSafeInteger(Number(usuario.participante_id)) ||
    Number(usuario.participante_id) <= 0
  ) {
    return responder({
      mensaje: "No tienes permiso para esta operación."
    }, 403);
  }

  
  // Leer la palabra clave enviada por el participante.
  let datos;

  try {
    datos = await request.json();
  } catch {
    return responder({
      mensaje: "Solicitud inválida."
    }, 400);
  }

  const claveIngresada = datos?.clave;

  if (
    typeof claveIngresada !== "string" ||
    claveIngresada.length === 0 ||
    claveIngresada.length > 128
  ) {
    return responder({
      mensaje: "La palabra clave no es válida."
    }, 400);
  }

  // ==========================================
// VERIFICAR BLOQUEO DE CLAVE DE LÍDER
// ==========================================

const usuarioId = Number(usuario.id);
const ahora = Math.floor(Date.now() / 1000);

const controlIntentos = await env.DB.prepare(
  `SELECT
     intentos,
     inicio_ventana,
     bloqueado_hasta
   FROM intentos_clave_lider
   WHERE usuario_id = ?
   LIMIT 1`
).bind(usuarioId).first();

if (
  controlIntentos &&
  Number(controlIntentos.bloqueado_hasta) > ahora
) {
  return responder({
    mensaje:
      "Has alcanzado el límite de intentos. " +
      "Podrás volver a intentarlo en 15 minutos."
  }, 429);
}

  // Comparar hashes para no comparar directamente
  // las palabras clave.
  const codificador = new TextEncoder();

  const [hashIngresado, hashCorrecto] =
    await Promise.all([
      crypto.subtle.digest(
        "SHA-256",
        codificador.encode(claveIngresada)
      ),
      crypto.subtle.digest(
        "SHA-256",
        codificador.encode(env.CLAVE_LIDER)
      )
    ]);

  const bytesIngresados = new Uint8Array(hashIngresado);
  const bytesCorrectos = new Uint8Array(hashCorrecto);

  let diferencia = 0;

  for (let i = 0; i < bytesIngresados.length; i++) {
    diferencia |= bytesIngresados[i] ^ bytesCorrectos[i];
  }


if (diferencia !== 0) {
  // Registrar el intento incorrecto de forma atómica en D1.
  await env.DB.prepare(
    `INSERT INTO intentos_clave_lider
       (usuario_id, intentos, inicio_ventana, bloqueado_hasta)
     VALUES (?, 1, unixepoch(), 0)
     ON CONFLICT(usuario_id) DO UPDATE SET
       bloqueado_hasta = CASE
         WHEN inicio_ventana <= unixepoch() - 900
           THEN 0
         WHEN intentos >= 2
           THEN unixepoch() + 900
         ELSE 0
       END,
       intentos = CASE
         WHEN inicio_ventana <= unixepoch() - 900
           THEN 1
         ELSE intentos + 1
       END,
       inicio_ventana = CASE
         WHEN inicio_ventana <= unixepoch() - 900
           THEN unixepoch()
         ELSE inicio_ventana
       END`
  ).bind(usuarioId).run();

  const registro = await env.DB.prepare(
    `SELECT intentos, bloqueado_hasta
     FROM intentos_clave_lider
     WHERE usuario_id = ?`
  ).bind(usuarioId).first();

  if (Number(registro?.bloqueado_hasta) > ahora) {
    return responder({
      mensaje:
        "Has alcanzado el límite de intentos. " +
        "Inténtalo nuevamente más tarde."
    }, 429);
  }

  return responder({
    mensaje: "La palabra clave es incorrecta."
  }, 400);
}


 
  // Consultar el pago del participante autenticado.
  const participanteId = Number(usuario.participante_id);

  const pago = await env.DB.prepare(
    `SELECT
       pg.id,
       pg.estado,
       pg.monto_pagado,
       pg.comprobante_key,
       pg.comprobante_efectivo_key,
       p.beneficio_lider
     FROM pagos pg
     INNER JOIN participantes p
       ON p.id = pg.participante_id
     WHERE pg.participante_id = ?
       AND p.usuario_id = ?
       AND p.cancelada = 0
     LIMIT 1`
  ).bind(
    participanteId,
    Number(usuario.id)
  ).first();

  if (!pago) {
    return responder({
      mensaje: "No se encontró una inscripción activa."
    }, 404);
  }

  // Evitar aplicar el beneficio más de una vez.
  if (Number(pago.beneficio_lider) === 1) {
    return responder({
      mensaje: "Ya tienes aplicado el beneficio de líder."
    }, 409);
  }

  // No modificar inscripciones con pagos realizados
  // o comprobantes que ya fueron enviados.
  if (
    pago.estado !== "PENDIENTE" ||
    Number(pago.monto_pagado) !== 0 ||
    pago.comprobante_key !== null ||
    pago.comprobante_efectivo_key !== null
  ) {
    return responder({
      mensaje:
        "No puedes aplicar este beneficio porque " +
        "tu inscripción ya tiene un pago o comprobante registrado."
    }, 409);
  }

 
  // ==========================================
  // APLICAR BENEFICIO DE LÍDER EN D1
  // ==========================================

  try {
    // Primera operación:
    // Registrar el beneficio y dejar gratuita
    // solamente la inscripción principal.

    
    // Aplicar el beneficio en una sola operación.
    // El trigger de D1 recalcula el pago automáticamente.

    const resultado = await env.DB.prepare(
      `UPDATE participantes
       SET beneficio_lider = 1,
           valor_acreditacion = 0
       WHERE id = ?
         AND usuario_id = ?
         AND cancelada = 0
         AND beneficio_lider = 0
         AND EXISTS (
           SELECT 1
           FROM pagos
           WHERE participante_id = participantes.id
             AND estado = 'PENDIENTE'
             AND monto_pagado = 0
             AND comprobante_key IS NULL
             AND comprobante_efectivo_key IS NULL
         )
         AND NOT EXISTS (
           SELECT 1
           FROM asignaciones_habitaciones
           WHERE participante_id = participantes.id
         )`
    ).bind(
      participanteId,
      Number(usuario.id)
    ).run();

  


    // Consultar el resultado definitivo.
    const resultadoFinal = await env.DB.prepare(
      `SELECT
         pg.monto_total,
         pg.estado,
         p.beneficio_lider
       FROM pagos pg
       INNER JOIN participantes p
         ON p.id = pg.participante_id
       WHERE pg.participante_id = ?
         AND p.usuario_id = ?
       LIMIT 1`
    ).bind(
      participanteId,
      Number(usuario.id)
    ).first();

    const montoFinal =
      Number(resultadoFinal?.monto_total);

    if (
      !resultadoFinal ||
      Number(resultadoFinal.beneficio_lider) !== 1 ||
      !Number.isSafeInteger(montoFinal) ||
      montoFinal < 0
    ) {
      return responder({
        mensaje:
          "No fue posible confirmar el estado del beneficio."
      }, 500);
    }

    return responder({
      estado: "OK",
      beneficioLider: true,
      valorLider: 0,
      montoTotal: montoFinal,
      estadoPago: resultadoFinal.estado,
      requiereComprobante: montoFinal > 0,
      requiereHabitacionLider: false,
      mensaje: montoFinal === 0
        ? "Beneficio aplicado. Tu inscripción fue aprobada automáticamente."
        : "Beneficio aplicado. Solo debes pagar las inscripciones de tus acompañantes."
    });

  } catch (error) {
    console.error(
      "Error al aplicar beneficio de líder:",
      error?.message
    );

    return responder({
      mensaje:
        "No fue posible aplicar el beneficio."
    }, 500);
  }



}
