
/*
 * ICEC JUVENIL 2027
 * Aprobación y rechazo de pagos
 * Acceso exclusivo para administradores
 */

import { enviarCorreo } from "./correo-api.js";

function responder(datos, codigo = 200) {
    return Response.json(datos, {
        status: codigo,
        headers: {
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff"
        }
    });
}

export async function manejarValidacionPagoAdmin(
    request,
    env,
    { usuarioDeSesion, ORIGENES_PERMITIDOS },
    pagoId
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

    if (!env.DB) {
        return responder({
            mensaje: "Base de datos no disponible."
        }, 503);
    }

    const usuario = await usuarioDeSesion(request, env);

    if (!usuario) {
        return responder({
            mensaje: "Debes iniciar sesión."
        }, 401);
    }

    if (usuario.rol !== "ADMINISTRADOR") {
        return responder({
            mensaje: "Acceso denegado."
        }, 403);
    }

    const id = Number(pagoId);

    if (!Number.isSafeInteger(id) || id <= 0) {
        return responder({
            mensaje: "Identificador de pago inválido."
        }, 400);
    }

    let datos;

    try {
        datos = await request.json();
    } catch {
        return responder({
            mensaje: "Datos de solicitud inválidos."
        }, 400);
    }

    const accion = datos?.accion;

    if (!["APROBAR", "RECHAZAR"].includes(accion)) {
        return responder({
            mensaje: "Acción no permitida."
        }, 400);
    }

    const motivo = String(datos?.motivo ?? "").trim();

    if (
        accion === "RECHAZAR" &&
        (motivo.length < 10 || motivo.length > 500)
    ) {
        return responder({
            mensaje: "Indica un motivo de rechazo de 10 a 500 caracteres."
        }, 400);
    }

    try {
        let resultado;

        if (accion === "APROBAR") {
            resultado = await env.DB.prepare(`
                UPDATE pagos
                SET estado = 'APROBADO',
                    monto_pagado = monto_total,
                    fecha_revision = CURRENT_TIMESTAMP,
                    observaciones = NULL
                WHERE id = ?
                  AND estado = 'EN_REVISION'
                  AND comprobante_key IS NOT NULL
                  AND monto_total > 0
                  AND monto_pagado = 0
            `).bind(id).run();
        } else {
            resultado = await env.DB.prepare(`
                UPDATE pagos
                SET estado = 'RECHAZADO',
                    fecha_revision = CURRENT_TIMESTAMP,
                    observaciones = ?
                WHERE id = ?
                  AND estado = 'EN_REVISION'
                  AND comprobante_key IS NOT NULL
                  AND monto_pagado = 0
            `).bind(motivo, id).run();
        }

        if (resultado.meta?.changes !== 1) {
            return responder({
                mensaje: "El pago no está disponible para esta revisión. Actualiza el panel."
            }, 409);
        }

        // ==========================================
        // NOTIFICACIÓN DE RECHAZO - PRUEBA LOCAL
        // ==========================================

        if (
            accion === "RECHAZAR" &&
            env.ENTORNO === "local" &&
            env.RESEND_TEST_EMAIL
        ) {
            try {
                const participante = await env.DB.prepare(`
                    SELECT p.nombre_completo
                    FROM pagos pg
                    INNER JOIN participantes p
                        ON p.id = pg.participante_id
                    WHERE pg.id = ?
                    LIMIT 1
                `).bind(id).first();

                await enviarCorreo(env, {
                    destinatario: env.RESEND_TEST_EMAIL.trim(),
                    asunto: "Comprobante rechazado - ICEC Juvenil 2027",
                    mensaje:
                        `Campamento Juvenil ICEC 2027\n\n` +
                        `Participante: ${participante?.nombre_completo || "No identificado"}\n\n` +
                        `Tu comprobante de pago fue rechazado.\n\n` +
                        `Motivo del rechazo:\n${motivo}\n\n` +
                        `Para corregirlo, inicia sesión en la plataforma ` +
                        `y sube un nuevo comprobante.\n\n` +
                        `ICEC Juvenil 2027`
                });

                console.log(
                    "Notificación de rechazo aceptada por Resend."
                );

            } catch (errorCorreo) {
                console.error(
                    "No se pudo enviar la notificación de rechazo:",
                    errorCorreo?.message
                );
            }
        }

        return responder({
            estado: "OK",
            mensaje: accion === "APROBAR"
                ? "Pago aprobado correctamente."
                : "Pago rechazado correctamente.",
            estadoPago: accion === "APROBAR"
                ? "APROBADO"
                : "RECHAZADO"
        });

    } catch (error) {
        console.error(
            "Error al revisar pago:",
            error?.message
        );

        return responder({
            mensaje: "No se pudo actualizar el pago."
        }, 500);
    }
}
