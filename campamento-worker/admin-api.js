
/*
 * CAMPAMENTO JUVENIL ICEC 2027
 * API de administración
 *
 * Primera etapa:
 * consultar inscripciones y pagos.
 *
 * Solo usuarios con rol ADMINISTRADOR.
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

export async function manejarPagosAdmin(
  request,
  env,
  { usuarioDeSesion, ORIGENES_PERMITIDOS }
) {

  // ========================================
  // 1. VALIDAR MÉTODO
  // ========================================

  if (request.method !== "GET") {
    return responder({
      mensaje: "Método no permitido."
    }, 405);
  }

  // ========================================
  // 2. VALIDAR ORIGEN
  // ========================================

  const origen = request.headers.get("Origin");

  if (
    !origen ||
    !ORIGENES_PERMITIDOS.includes(origen)
  ) {
    return responder({
      mensaje: "Origen no autorizado."
    }, 403);
  }

  // ========================================
  // 3. VERIFICAR SESIÓN
  // ========================================

  const usuario = await usuarioDeSesion(
    request,
    env
  );

  if (!usuario) {
    return responder({
      mensaje: "Debes iniciar sesión."
    }, 401);
  }

  // ========================================
  // 4. VERIFICAR ROL ADMINISTRADOR
  // ========================================

  if (usuario.rol !== "ADMINISTRADOR") {
    return responder({
      mensaje: "No tienes permisos de administrador."
    }, 403);
  }

  if (!env.DB) {
    return responder({
      mensaje: "Base de datos no disponible."
    }, 503);
  }

  // ========================================
  // 5. CONSULTAR INSCRIPCIONES Y PAGOS
  // ========================================

  try {

    const resultado = await env.DB.prepare(
      `SELECT
         pg.id AS pago_id,
         pg.participante_id,
        p.nombre_completo,
        p.rut,
        p.beneficio_lider,
        p.cancelada,
        p.fecha_cancelacion,
        p.motivo_cancelacion,
        p.estado_devolucion,
        u.correo,
         pg.monto_total,
         pg.monto_pagado,
         pg.estado,
         pg.titular_transferencia,
         pg.fecha_transferencia,
         pg.fecha_registro,
         CASE
  WHEN pg.comprobante_key IS NOT NULL
    OR pg.comprobante_efectivo_key IS NOT NULL
  THEN 1
  ELSE 0
END AS comprobante_recibido,
         (
           SELECT COUNT(*)
           FROM acompanantes a
           WHERE a.participante_id = p.id
         ) AS cantidad_acompanantes
       FROM pagos pg
       INNER JOIN participantes p
         ON p.id = pg.participante_id
       INNER JOIN usuarios u
         ON u.id = p.usuario_id
       ORDER BY
         CASE pg.estado
           WHEN 'EN_REVISION' THEN 0
           WHEN 'PENDIENTE' THEN 1
           ELSE 2
         END,
         pg.id DESC
       LIMIT 250`
    ).all();

    const pagos = (resultado.results || [])
      .map((fila) => ({
        pagoId: Number(fila.pago_id),

        participanteId:
          Number(fila.participante_id),

        nombreCompleto:
          fila.nombre_completo,
          tipoParticipante:
          Number(fila.beneficio_lider) === 1
            ? "Líder"
            : "Joven",

          rut: fila.rut,

          cancelada: Number(fila.cancelada) === 1,

          fechaCancelacion: fila.fecha_cancelacion,

          motivoCancelacion: fila.motivo_cancelacion || "",

          estadoDevolucion: fila.estado_devolucion,

          correo: fila.correo,


        cantidadAcompanantes:
          Number(fila.cantidad_acompanantes),

        montoTotal:
          Number(fila.monto_total),

        montoPagado:
          Number(fila.monto_pagado),

        estado: fila.estado,

        titularTransferencia:
          fila.titular_transferencia || "",

        fechaTransferencia:
          fila.fecha_transferencia || null,

        fechaRegistro:
          fila.fecha_registro,

        comprobanteRecibido:
          Number(fila.comprobante_recibido) === 1
      }));
      // Excluir usuarios de prueba de las estadísticas.
      // Sus registros permanecen en D1 y en la tabla administrativa.
      const correosDePrueba = [
        "brantemarcoantonio@gmail.com"
      ];

      const pagosContabilizables = pagos.filter(
        (pago) =>
          !correosDePrueba.includes(
            (pago.correo || "").trim().toLowerCase()
          )
      );

            // Fecha de referencia para clasificar edades.
      const FECHA_CAMPAMENTO = "2027-01-08";

      // Límites de nacimiento para las categorías.
      const LIMITE_JOVENES = "2015-01-08";
      const LIMITE_NINOS = "2022-01-08";

            // Contar asistentes según su edad al 8 de enero de 2027.
      const resultadoEdades = await env.DB.prepare(`
          SELECT
              SUM(
                  CASE WHEN fecha_nacimiento <= ? THEN 1 ELSE 0 END
              ) AS jovenes,

              SUM(
                  CASE
                      WHEN fecha_nacimiento > ?
                      AND fecha_nacimiento <= ?
                      THEN 1 ELSE 0
                  END
              ) AS ninos,

              SUM(
                  CASE WHEN fecha_nacimiento > ? THEN 1 ELSE 0 END
              ) AS bebes

          FROM (
              -- Participantes que no son líderes.
              SELECT p.fecha_nacimiento
              FROM participantes p
              INNER JOIN usuarios u ON u.id = p.usuario_id
              WHERE COALESCE(p.beneficio_lider, 0) = 0
                AND LOWER(TRIM(u.correo)) <> 'brantemarcoantonio@gmail.com'
                AND COALESCE(p.cancelada, 0) = 0

              UNION ALL

              -- Acompañantes, incluidos los de líderes.
              SELECT a.fecha_nacimiento
              FROM acompanantes a
              INNER JOIN participantes p ON p.id = a.participante_id
              INNER JOIN usuarios u ON u.id = p.usuario_id
              WHERE LOWER(TRIM(u.correo)) <> 'brantemarcoantonio@gmail.com'
                AND COALESCE(p.cancelada, 0) = 0
          )
      `).bind(
          LIMITE_JOVENES,
          LIMITE_JOVENES,
          LIMITE_NINOS,
          LIMITE_NINOS
      ).first();
    // Resumen general para el panel.
    const resumen = {
  totalInscripciones: pagosContabilizables.length,

  lideres: pagosContabilizables.filter(
    (p) => p.tipoParticipante === "Líder"
  ).length,

  jovenes: Number(resultadoEdades?.jovenes || 0),

  ninos: Number(resultadoEdades?.ninos || 0),

  bebes: Number(resultadoEdades?.bebes || 0),

  pendientes: pagosContabilizables.filter(
    (p) => p.estado === "PENDIENTE"
  ).length,

  enRevision: pagosContabilizables.filter(
    (p) => p.estado === "EN_REVISION"
  ).length,

  aprobados: pagosContabilizables.filter(
    (p) => p.estado === "APROBADO"
  ).length,

  rechazados: pagosContabilizables.filter(
    (p) => p.estado === "RECHAZADO"
  ).length
};

    return responder({
      estado: "OK",

      administrador: {
        id: Number(usuario.id),
        correo: usuario.correo
      },

      resumen,
      pagos
    });

  } catch (error) {

    console.error(
      "Error en consulta administrativa:",
      error?.message
    );

    return responder({
      mensaje:
        "No fue posible consultar las inscripciones."
    }, 500);
  }
}
