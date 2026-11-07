
/*
 * CAMPAMENTO JUVENIL ICEC 2027
 * Cancelación administrativa de inscripciones.
 *
 * Conserva los pagos y comprobantes.
 * Libera las habitaciones del titular
 * y de todos sus acompañantes.
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

export async function manejarCancelacionAdmin(
    request,
    env,
    { usuarioDeSesion, ORIGENES_PERMITIDOS },
    participanteId
) {

    // Solo se permiten cancelaciones mediante POST.
    if (request.method !== "POST") {
        return responder({
            mensaje: "Método no permitido."
        }, 405);
    }

    // Validar el origen y la protección
    // adicional para solicitudes que modifican D1.
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

    try {

        // Verificar que exista una sesión activa.
        const usuario = await usuarioDeSesion(
            request,
            env
        );

        if (!usuario) {
            return responder({
                mensaje: "Debes iniciar sesión."
            }, 401);
        }

        // Solo los administradores pueden cancelar.
        if (usuario.rol !== "ADMINISTRADOR") {
            return responder({
                mensaje: "Acceso denegado."
            }, 403);
        }

        const id = Number(participanteId);

        if (
            !Number.isSafeInteger(id) ||
            id <= 0
        ) {
            return responder({
                mensaje: "Identificador no válido."
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

        // Exigir un motivo de cancelación.
        const motivo =
            typeof datos?.motivo === "string"
                ? datos.motivo.trim()
                : "";

        if (
            motivo.length < 10 ||
            motivo.length > 500
        ) {
            return responder({
                mensaje:
                    "Indica un motivo de cancelación " +
                    "de 10 a 500 caracteres."
            }, 400);
        }

        // Comprobar que la inscripción exista
        // y que todavía esté activa.
        const participante = await env.DB.prepare(`
            SELECT
                id,
                nombre_completo,
                cancelada
            FROM participantes
            WHERE id = ?
            LIMIT 1
        `).bind(id).first();

        if (!participante) {
            return responder({
                mensaje: "Inscripción no encontrada."
            }, 404);
        }

        if (Number(participante.cancelada) === 1) {
            return responder({
                mensaje:
                    "Esta inscripción ya está cancelada."
            }, 409);
        }

        // Ejecutar en una misma transacción:
        // 1. Marcar la inscripción como cancelada.
        // 2. Registrar el motivo y la fecha.
        // 3. Establecer si hay devolución pendiente.
        // 4. Liberar las habitaciones de todos.
        //
        // No se elimina ningún pago ni comprobante.
        const resultados = await env.DB.batch([

            env.DB.prepare(`
                UPDATE participantes
                SET
                    cancelada = 1,
                    motivo_cancelacion = ?,
                    fecha_cancelacion = CURRENT_TIMESTAMP,
                    estado_devolucion = CASE
                        WHEN EXISTS (
                            SELECT 1
                            FROM pagos
                            WHERE participante_id = ?
                              AND monto_pagado > 0
                        )
                        THEN 'PENDIENTE'
                        ELSE 'NO_CORRESPONDE'
                    END
                WHERE id = ?
                  AND cancelada = 0
            `).bind(motivo, id, id),

            env.DB.prepare(`
                DELETE FROM asignaciones_habitaciones
                WHERE participante_id = ?
                   OR acompanante_id IN (
                       SELECT id
                       FROM acompanantes
                       WHERE participante_id = ?
                   )
            `).bind(id, id)

        ]);

        if (resultados[0]?.meta?.changes !== 1) {
            return responder({
                mensaje:
                    "No fue posible cancelar la inscripción. " +
                    "Actualiza el panel e inténtalo nuevamente."
            }, 409);
        }

        return responder({
            estado: "OK",
            mensaje:
                "Inscripción cancelada correctamente. " +
                "Se liberaron las habitaciones asignadas " +
                "y se conservaron los pagos.",
            participanteId: id,
            nombreCompleto: participante.nombre_completo,
            habitacionesLiberadas:
                Number(resultados[1]?.meta?.changes ?? 0)
        });

    } catch (error) {

        console.error(
            "Error al cancelar inscripción:",
            error?.message
        );

        return responder({
            mensaje:
                "No se pudo cancelar la inscripción."
        }, 500);
    }
}
