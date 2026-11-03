
/*
 * ICEC JUVENIL 2027
 * API de detalles administrativos
 *
 * Acceso exclusivo para ADMINISTRADOR.
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

// ==========================================
// INFORMACIÓN DE SALUD
// ==========================================

function obtenerSalud(fila) {

    if (fila.salud_id == null) {
        return null;
    }

    return {
        tieneAlergias: Boolean(fila.tiene_alergias),
        detalleAlergias: fila.detalle_alergias || "",

        tieneEnfermedad: Boolean(fila.tiene_enfermedad),
        detalleEnfermedad: fila.detalle_enfermedad || "",

        tomaMedicamentos: Boolean(fila.toma_medicamentos),
        detalleMedicamentos: fila.detalle_medicamentos || "",

        restriccionAlimentaria:
            Boolean(fila.restriccion_alimentaria),

        detalleAlimentacion:
            fila.detalle_alimentacion || ""
    };
}

// ==========================================
// CONTACTO DE EMERGENCIA
// ==========================================

function obtenerEmergencia(fila) {

    if (fila.emergencia_id == null) {
        return null;
    }

    return {
        nombreCompleto: fila.emergencia_nombre,
        parentesco: fila.emergencia_parentesco,
        telefonoPrincipal: fila.emergencia_telefono,
        telefonoAlternativo:
            fila.emergencia_alternativo || ""
    };
}

// ==========================================
// HABITACIÓN ASIGNADA
// ==========================================

function obtenerHabitacion(fila) {

    if (fila.habitacion_id == null) {
        return null;
    }

    return {
        nombre: fila.habitacion_nombre
    };
}

// ==========================================
// FORMATO DE DATOS DE UNA PERSONA
// ==========================================

function obtenerPersona(fila) {

    return {
        nombreCompleto: fila.nombre_completo,
        telefono: fila.telefono || "",

        salud: obtenerSalud(fila),

        contactoEmergencia:
            obtenerEmergencia(fila),

        habitacion: obtenerHabitacion(fila)
    };
}

// ==========================================
// CONSULTAR PARTICIPANTE O ACOMPAÑANTES
// ==========================================

async function consultarPersonas(env, tipo, id) {

    // Los nombres de tablas y columnas son
    // constantes internas, nunca datos del usuario.
    const esPrincipal = tipo === "principal";

    const tabla = esPrincipal
        ? "participantes"
        : "acompanantes";

    const columnaRelacion = esPrincipal
        ? "participante_id"
        : "acompanante_id";

    const condicion = esPrincipal
        ? "persona.id = ?"
        : "persona.participante_id = ?";

    const resultado = await env.DB.prepare(`
        SELECT
            persona.id,
            persona.nombre_completo,
            persona.telefono,

            im.id AS salud_id,
            im.tiene_alergias,
            im.detalle_alergias,
            im.tiene_enfermedad,
            im.detalle_enfermedad,
            im.toma_medicamentos,
            im.detalle_medicamentos,
            im.restriccion_alimentaria,
            im.detalle_alimentacion,

            ce.id AS emergencia_id,
            ce.nombre_completo AS emergencia_nombre,
            ce.parentesco AS emergencia_parentesco,
            ce.telefono_principal AS emergencia_telefono,
            ce.telefono_alternativo AS emergencia_alternativo,

            h.id AS habitacion_id,
            h.nombre AS habitacion_nombre

        FROM ${tabla} persona

        LEFT JOIN informacion_medica im
            ON im.${columnaRelacion} = persona.id

        LEFT JOIN contactos_emergencia ce
            ON ce.${columnaRelacion} = persona.id

        LEFT JOIN asignaciones_habitaciones ah
            ON ah.${columnaRelacion} = persona.id

        LEFT JOIN habitaciones h
            ON h.id = ah.habitacion_id

        WHERE ${condicion}

        ORDER BY persona.id
    `).bind(id).all();

    return (resultado.results || [])
        .map(obtenerPersona);
}

// ==========================================
// API ADMINISTRATIVA
// ==========================================

export async function manejarDetalleAdmin(
    request,
    env,
    {
        usuarioDeSesion,
        ORIGENES_PERMITIDOS
    },
    participanteId
) {

    if (request.method !== "GET") {
        return responder({
            mensaje: "Método no permitido."
        }, 405);
    }

    // Verificar origen
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

    // Verificar sesión
    let usuario;

    try {
        usuario = await usuarioDeSesion(request, env);
    } catch {
        return responder({
            mensaje: "Error al verificar la sesión."
        }, 500);
    }

    if (!usuario) {
        return responder({
            mensaje: "Debes iniciar sesión."
        }, 401);
    }

    // Permisos administrativos
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

    try {

        // Participante principal
        const participantes = await consultarPersonas(
            env,
            "principal",
            id
        );

        if (participantes.length === 0) {
            return responder({
                mensaje: "Participante no encontrado."
            }, 404);
        }

        // Todos sus acompañantes
        const acompanantes = await consultarPersonas(
            env,
            "acompanantes",
            id
        );

        // Pago más reciente de la inscripción
        const pago = await env.DB.prepare(`
            SELECT
                id,
                monto_total,
                monto_pagado,
                estado,
                titular_transferencia,
                fecha_transferencia,
                fecha_revision,
                observaciones,

                CASE
                    WHEN comprobante_key IS NOT NULL
                    THEN 1
                    ELSE 0
                END AS comprobante_recibido

            FROM pagos

            WHERE participante_id = ?

            ORDER BY id DESC

            LIMIT 1
        `).bind(id).first();

        return responder({
            estado: "OK",

            inscripcion: {
                participanteId: id,

                participante: participantes[0],

                acompanantes,

                pago: pago ? {
                    id: Number(pago.id),

                    montoTotal:
                        Number(pago.monto_total),

                    montoPagado:
                        Number(pago.monto_pagado),

                    estado: pago.estado,

                    titularTransferencia:
                        pago.titular_transferencia || "",

                    fechaTransferencia:
                        pago.fecha_transferencia,

                    fechaRevision:
                        pago.fecha_revision,

                    observaciones:
                        pago.observaciones || "",

                    comprobanteRecibido:
                        Boolean(pago.comprobante_recibido)
                } : null
            }
        });

    } catch (error) {

        console.error(
            "Error al consultar detalle administrativo:",
            error?.message
        );

        return responder({
            mensaje:
                "No fue posible obtener la información."
        }, 500);
    }
}
