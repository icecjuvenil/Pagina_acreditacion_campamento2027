
/*
 * ICEC JUVENIL 2027
 * Exportación administrativa
 * Datos recuperados desde Cloudflare D1
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

export async function manejarExportacion(
    request,
    env,
    { usuarioDeSesion, ORIGENES_PERMITIDOS }
) {
    if (request.method !== "GET") {
        return responder({
            mensaje: "Método no permitido."
        }, 405);
    }

    const origen = request.headers.get("Origin");

    if (!origen ||
        !ORIGENES_PERMITIDOS.includes(origen)) {
        return responder({
            mensaje: "Origen no autorizado."
        }, 403);
    }

    const usuario = await usuarioDeSesion(request, env);

    if (!usuario || usuario.rol !== "ADMINISTRADOR") {
        return responder({
            mensaje: "Acceso exclusivo para administradores."
        }, 403);
    }

    if (!env.DB) {
        return responder({
            mensaje: "Base de datos no disponible."
        }, 503);
    }

    try {
        const resultado = await env.DB.prepare(`
            SELECT
                p.id AS inscripcion_id,
                'PARTICIPANTE' AS tipo,
                p.nombre_completo AS nombre,
                p.telefono,
                u.correo,
                COALESCE(h.nombre, 'Sin asignar')
                    AS habitacion,
                
pg.estado AS estado_pago,
pg.monto_total,
CASE
    WHEN p.cancelada = 1 THEN 'CANCELADA'
    ELSE 'ACTIVA'
END AS estado_inscripcion,
p.fecha_cancelacion,
p.motivo_cancelacion,
p.estado_devolucion


            FROM participantes p

            INNER JOIN usuarios u
                ON u.id = p.usuario_id

            LEFT JOIN pagos pg
                ON pg.participante_id = p.id

            LEFT JOIN asignaciones_habitaciones ah
                ON ah.participante_id = p.id

            LEFT JOIN habitaciones h
                ON h.id = ah.habitacion_id

            UNION ALL

            SELECT
                a.participante_id AS inscripcion_id,
                'Acompañante de: ' || p.nombre_completo AS tipo,
                a.nombre_completo AS nombre,
                a.telefono,
                a.correo,
                COALESCE(h.nombre, 'Sin asignar')
                    AS habitacion,
                
pg.estado AS estado_pago,
NULL AS monto_total,
CASE
    WHEN p.cancelada = 1 THEN 'CANCELADA'
    ELSE 'ACTIVA'
END AS estado_inscripcion,
p.fecha_cancelacion,
p.motivo_cancelacion,
p.estado_devolucion


            FROM acompanantes a
            INNER JOIN participantes p
                ON p.id = a.participante_id

            LEFT JOIN pagos pg
                ON pg.participante_id = a.participante_id

            LEFT JOIN asignaciones_habitaciones ah
                ON ah.acompanante_id = a.id

            LEFT JOIN habitaciones h
                ON h.id = ah.habitacion_id

            ORDER BY inscripcion_id, tipo DESC
        `).all();

        
        // Información de salud de participantes
        // y acompañantes para el respaldo privado.

        const resultadoSalud = await env.DB.prepare(`
            SELECT
                'PARTICIPANTE' AS tipo,
                p.nombre_completo AS nombre,
                p.nombre_completo AS responsable,
                COALESCE(h.nombre, 'Sin asignar') AS habitacion,
                im.tiene_alergias,
                im.detalle_alergias,
                im.tiene_enfermedad,
                im.detalle_enfermedad,
                im.toma_medicamentos,
                im.detalle_medicamentos,
                im.restriccion_alimentaria,
                im.detalle_alimentacion

            FROM participantes p

            LEFT JOIN informacion_medica im
                ON im.participante_id = p.id

            LEFT JOIN asignaciones_habitaciones ah
                ON ah.participante_id = p.id

            LEFT JOIN habitaciones h
                ON h.id = ah.habitacion_id

            UNION ALL

            SELECT
                'ACOMPAÑANTE' AS tipo,
                a.nombre_completo AS nombre,
                p.nombre_completo AS responsable,
                COALESCE(h.nombre, 'Sin asignar') AS habitacion,
                im.tiene_alergias,
                im.detalle_alergias,
                im.tiene_enfermedad,
                im.detalle_enfermedad,
                im.toma_medicamentos,
                im.detalle_medicamentos,
                im.restriccion_alimentaria,
                im.detalle_alimentacion

            FROM acompanantes a

            INNER JOIN participantes p
                ON p.id = a.participante_id

            LEFT JOIN informacion_medica im
                ON im.acompanante_id = a.id

            LEFT JOIN asignaciones_habitaciones ah
                ON ah.acompanante_id = a.id

            LEFT JOIN habitaciones h
                ON h.id = ah.habitacion_id

            ORDER BY responsable, tipo, nombre
        `).all();


        
            return responder({
                estado: "OK",
                fechaExportacion: new Date().toISOString(),
                registros: resultado.results || [],
                salud: resultadoSalud.results || []
            });


    } catch (error) {
        console.error(
            "Error de exportación:",
            error?.message
        );

        return responder({
            mensaje: "No se pudieron recuperar los registros."
        }, 500);
    }
}
