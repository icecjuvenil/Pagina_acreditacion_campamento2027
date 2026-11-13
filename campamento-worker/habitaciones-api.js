
/*
 * CAMPAMENTO JUVENIL ICEC 2027
 * API de habitaciones - Cloudflare D1
 *
 * Consulta habitaciones y cupos reales.
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

export async function manejarHabitaciones(
    request,
    env,
    { usuarioDeSesion, ORIGENES_PERMITIDOS }
) {
    
if (
    request.method !== "GET" &&
    request.method !== "POST"
) {
    return responder({
        mensaje: "Método no permitido."
    }, 405);
}

// Protección adicional para solicitudes
// que modificarán la base de datos.
if (
    request.method === "POST" &&
    request.headers.get("X-ICEC-Solicitud") !== "web"
) {
    return responder({
        mensaje: "Solicitud no autorizada."
    }, 403);
}


    const origen = request.headers.get("Origin");

    if (!origen ||
        !ORIGENES_PERMITIDOS.includes(origen)) {
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
        const usuario = await usuarioDeSesion(
            request,
            env
        );

        if (
    !usuario ||
    !["PARTICIPANTE", "ADMINISTRADOR"].includes(usuario.rol)
) {
    return responder({
        mensaje: "Debes iniciar sesión."
    }, 401);
}

        const participanteId = Number(
            usuario.participante_id
        );

        if (
            !Number.isSafeInteger(participanteId) ||
            participanteId <= 0
        ) {
            return responder({
                mensaje: "Inscripción no encontrada."
            }, 403);
        }

        // Verificar que el pago esté aprobado.
        
            const pago = await env.DB.prepare(
                `SELECT
                    pg.estado,
                    p.cancelada
                FROM pagos pg
                INNER JOIN participantes p
                    ON p.id = pg.participante_id
                WHERE pg.participante_id = ?
                LIMIT 1`
            ).bind(participanteId).first();

            if (Number(pago?.cancelada) === 1) {
                return responder({
                    mensaje:
                        "Esta inscripción está cancelada. " +
                        "No es posible reservar habitaciones."
                }, 403);
            }


        if (
    usuario.rol !== "ADMINISTRADOR" &&
    pago?.estado !== "APROBADO"
) {
    return responder({
        mensaje: "Debes tener tu pago aprobado."
    }, 403);
}

        
        // ==========================================
        // RESERVAR HABITACIÓN EN D1
        // ==========================================

        if (request.method === "POST") {

    // Los administradores pueden consultar habitaciones,
    // pero no reservarlas.
    if (usuario.rol === "ADMINISTRADOR") {
        return responder({
            mensaje: "Los administradores no pueden reservar habitaciones."
        }, 403);
    }

    let datos;

            try {
                datos = await request.json();
            } catch {
                return responder({
                    mensaje: "Datos de reserva no válidos."
                }, 400);
            }

            const habitacionId = Number(
                datos?.habitacionId
            );

            const personaId = Number(
                datos?.personaId
            );

            const tipo = datos?.tipo;

            if (
                !Number.isSafeInteger(habitacionId) ||
                habitacionId <= 0 ||
                !Number.isSafeInteger(personaId) ||
                personaId <= 0 ||
                !["principal", "acompanante"].includes(tipo)
            ) {
                return responder({
                    mensaje: "Datos de habitación o participante no válidos."
                }, 400);
            }

            // Evitar que el titular asigne habitaciones
            // a participantes pertenecientes a otra cuenta.
            if (
                tipo === "principal" &&
                personaId !== participanteId
            ) {
                return responder({
                    mensaje: "No puedes modificar otra inscripción."
                }, 403);
            }

            const esPrincipal = tipo === "principal";

            // Cada INSERT comprueba en una sola operación:
            // - propiedad de la persona
            // - pago aprobado
            // - género correspondiente
            // - habitación activa
            // - capacidad disponible
            const sql = esPrincipal
                ? `INSERT INTO asignaciones_habitaciones
                     (habitacion_id, participante_id, asignado_por)
                   SELECT h.id, p.id, ?
                   FROM habitaciones h
                   INNER JOIN participantes p
                     ON p.id = ?
                   INNER JOIN pagos pg
                     ON pg.participante_id = p.id
                    WHERE h.id = ?
                    AND h.activa = 1
                    AND p.cancelada = 0
                    AND p.beneficio_lider = 0
                    AND pg.estado = 'APROBADO'
                     AND UPPER(TRIM(h.genero)) =
                         UPPER(TRIM(p.genero))
                     AND (
                         SELECT COUNT(*)
                         FROM asignaciones_habitaciones a
                         WHERE a.habitacion_id = h.id
                     ) < h.capacidad`
                : `INSERT INTO asignaciones_habitaciones
                     (habitacion_id, acompanante_id, asignado_por)
                   SELECT h.id, a.id, ?
                   FROM habitaciones h
                   INNER JOIN acompanantes a
                     ON a.id = ?
                   INNER JOIN pagos pg
                     ON pg.participante_id = a.participante_id             
                        WHERE h.id = ?
                        AND h.activa = 1
                        AND a.participante_id = ?
                        AND a.fecha_nacimiento <= '2021-01-08'
                        AND EXISTS (
                            SELECT 1
                            FROM participantes p
                            WHERE p.id = a.participante_id
                                AND p.cancelada = 0
                        )
                        AND pg.estado = 'APROBADO'
                     AND UPPER(TRIM(h.genero)) =
                         UPPER(TRIM(a.genero))
                     AND (
                         SELECT COUNT(*)
                         FROM asignaciones_habitaciones x
                         WHERE x.habitacion_id = h.id
                     ) < h.capacidad`;

            try {
                const parametros = esPrincipal
                    ? [
                        Number(usuario.id),
                        personaId,
                        habitacionId
                    ]
                    : [
                        Number(usuario.id),
                        personaId,
                        habitacionId,
                        participanteId
                    ];

                const resultado = await env.DB.prepare(
                    sql
                ).bind(...parametros).run();

                if (resultado.meta?.changes !== 1) {
                    return responder({
                        mensaje:
                            "No se pudo asignar la habitación. " +
                            "Verifica el género, los cupos y " +
                            "que la inscripción esté aprobada."
                    }, 409);
                }

                return responder({
                    estado: "ASIGNADA",
                    mensaje: "Habitación asignada correctamente.",
                    habitacionId,
                    personaId,
                    tipo
                }, 201);

            } catch (error) {
                // Los índices UNIQUE impiden asignar
                // dos habitaciones a la misma persona.
                if (
                    String(error?.message || "")
                        .includes("UNIQUE constraint failed")
                ) {
                    return responder({
                        mensaje:
                            "Esta persona ya tiene una habitación asignada."
                    }, 409);
                }

                throw error;
            }
        }

        // Consultar ocupación real de D1.

        
        // Obtener nombres de las personas asignadas
        // a cada habitación desde D1.
        const resultadoOcupantes = await env.DB.prepare(
            `SELECT
                a.habitacion_id,
                COALESCE(
                    p.nombre_completo,
                    ac.nombre_completo
                ) AS nombre_completo
             FROM asignaciones_habitaciones a
             INNER JOIN habitaciones h
               ON h.id = a.habitacion_id
             LEFT JOIN participantes p
               ON p.id = a.participante_id
             LEFT JOIN acompanantes ac
               ON ac.id = a.acompanante_id
             WHERE h.activa = 1
             ORDER BY a.fecha_asignacion, a.id`
        ).all();

        const ocupantesPorHabitacion = new Map();

        for (const persona of resultadoOcupantes.results || []) {
            const id = Number(persona.habitacion_id);

            if (!ocupantesPorHabitacion.has(id)) {
                ocupantesPorHabitacion.set(id, []);
            }

            if (persona.nombre_completo) {
                ocupantesPorHabitacion.get(id).push(
                    persona.nombre_completo
                );
            }
        }

        const resultado = await env.DB.prepare(
            `SELECT
                h.id,
                h.nombre,
                h.genero,
                h.capacidad,
                COUNT(a.id) AS ocupados
             FROM habitaciones h
             LEFT JOIN asignaciones_habitaciones a
               ON a.habitacion_id = h.id
             WHERE h.activa = 1
             GROUP BY
                h.id,
                h.nombre,
                h.genero,
                h.capacidad
             ORDER BY h.id`
        ).all();

        
const habitaciones = (
    resultado.results || []
).map(h => ({
    id: Number(h.id),
    nombre: h.nombre,
    genero: h.genero,
    capacidad: Number(h.capacidad),
    ocupados: Number(h.ocupados),
    disponibles: Math.max(
        0,
        Number(h.capacidad) - Number(h.ocupados)
    ),
    ocupantes:
        ocupantesPorHabitacion.get(Number(h.id)) || []
}));


        
        // Consultar las habitaciones asignadas
        // al titular y a sus acompañantes.

        const resultadoAsignaciones = await env.DB.prepare(
            `SELECT
                a.habitacion_id,
                a.participante_id,
                a.acompanante_id,
                h.nombre AS nombre_habitacion
             FROM asignaciones_habitaciones a
             INNER JOIN habitaciones h
               ON h.id = a.habitacion_id
             WHERE a.participante_id = ?
                OR a.acompanante_id IN (
                    SELECT id
                    FROM acompanantes
                    WHERE participante_id = ?
                )`
        ).bind(
            participanteId,
            participanteId
        ).all();

        const asignaciones = (
            resultadoAsignaciones.results || []
        ).map(a => ({
            habitacionId: Number(a.habitacion_id),
            personaId: Number(
                a.participante_id ?? a.acompanante_id
            ),
            tipo: a.participante_id !== null
                ? "principal"
                : "acompanante",
            nombreHabitacion: a.nombre_habitacion
        }));

        return responder({
            estado: "OK",
            habitaciones,
            asignaciones
        });


    } catch (error) {
        console.error(
            "Error en API de habitaciones:",
            error
        );

        return responder({
            mensaje: "No se pudieron consultar las habitaciones."
        }, 500);
    }
}
