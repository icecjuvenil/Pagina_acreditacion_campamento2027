
/*
 * ICEC JUVENIL 2027
 * Comprobantes de pago en efectivo
 * Acceso exclusivo para administradores
 * Cloudflare Workers + D1 + R2
 */

const MAX_ARCHIVO = 5 * 1024 * 1024;

function responder(datos, codigo = 200) {
    return Response.json(datos, {
        status: codigo,
        headers: {
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff"
        }
    });
}

function identificarFormato(archivo, bytes) {
    const nombre = archivo.name.toLowerCase();

    if (
        nombre.endsWith(".pdf") &&
        archivo.type === "application/pdf" &&
        bytes[0] === 0x25 &&
        bytes[1] === 0x50 &&
        bytes[2] === 0x44 &&
        bytes[3] === 0x46 &&
        bytes[4] === 0x2D
    ) {
        return {
            extension: "pdf",
            tipo: "application/pdf"
        };
    }

    if (
        nombre.endsWith(".png") &&
        archivo.type === "image/png" &&
        [137, 80, 78, 71, 13, 10, 26, 10]
            .every((valor, i) => bytes[i] === valor)
    ) {
        return {
            extension: "png",
            tipo: "image/png"
        };
    }

    if (
        /\.(jpg|jpeg)$/.test(nombre) &&
        archivo.type === "image/jpeg" &&
        bytes[0] === 0xFF &&
        bytes[1] === 0xD8 &&
        bytes[2] === 0xFF
    ) {
        return {
            extension: "jpg",
            tipo: "image/jpeg"
        };
    }

    return null;
}

export async function manejarComprobanteEfectivoAdmin(
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

    if (!env.DB || !env.COMPROBANTES) {
        return responder({
            mensaje: "Almacenamiento no disponible."
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

    const tipoSolicitud =
        request.headers.get("Content-Type") || "";

    if (!/^multipart\/form-data\s*;/i.test(tipoSolicitud)) {
        return responder({
            mensaje: "Debes adjuntar un archivo."
        }, 415);
    }

    const longitud = Number(
        request.headers.get("Content-Length") || 0
    );

    if (longitud > MAX_ARCHIVO + 65536) {
        return responder({
            mensaje: "El archivo supera el tamaño permitido."
        }, 413);
    }

    try {
        const pago = await env.DB.prepare(`
            SELECT
                pg.id,
                pg.estado,
                pg.monto_pagado,
                pg.comprobante_efectivo_key
            FROM pagos pg
            INNER JOIN participantes p
                ON p.id = pg.participante_id
            WHERE pg.id = ?
              AND p.cancelada = 0
            LIMIT 1
        `).bind(id).first();

        

if (
    !pago ||
    !["PENDIENTE", "EN_REVISION", "RECHAZADO"].includes(
        pago.estado
    ) ||
    Number(pago.monto_pagado) !== 0
) {
    return responder({
        mensaje: "El pago no está disponible para adjuntar comprobantes."
    }, 409);
}


        // Leer la solicitud con límite de tamaño
        const lector = request.body?.getReader();

        if (!lector) {
            return responder({
                mensaje: "No se recibió el archivo."
            }, 400);
        }

        const partes = [];
        let total = 0;

        try {
            while (true) {
                const { done, value } = await lector.read();

                if (done) break;

                total += value.byteLength;

                if (total > MAX_ARCHIVO + 65536) {
                    return responder({
                        mensaje: "El archivo supera el tamaño permitido."
                    }, 413);
                }

                partes.push(value);
            }
        } finally {
            await lector.cancel().catch(() => {});
        }

        const cuerpo = new Uint8Array(total);
        let posicion = 0;

        for (const parte of partes) {
            cuerpo.set(parte, posicion);
            posicion += parte.byteLength;
        }

        const copia = new Request(request.url, {
            method: "POST",
            headers: {
                "Content-Type": tipoSolicitud
            },
            body: cuerpo
        });

        const formulario = await copia.formData();
        const archivo = formulario.get("comprobante");

        if (
            !(archivo instanceof File) ||
            archivo.size === 0 ||
            archivo.size > MAX_ARCHIVO
        ) {
            return responder({
                mensaje: "Selecciona un comprobante válido de máximo 5 MB."
            }, 400);
        }

        const contenido = await archivo.arrayBuffer();

        const formato = identificarFormato(
            archivo,
            new Uint8Array(contenido)
        );

        if (!formato) {
            return responder({
                mensaje: "Solo se permiten archivos PDF, JPG o PNG válidos."
            }, 400);
        }

        const clave =
            `comprobantes/efectivo/pago-${id}/` +
            `${crypto.randomUUID()}.${formato.extension}`;

        await env.COMPROBANTES.put(
            clave,
            contenido,
            {
                httpMetadata: {
                    contentType: formato.tipo,
                    contentDisposition: "attachment",
                    cacheControl: "private, no-store"
                }
            }
        );

        let actualizado;

        try {
            

actualizado = await env.DB.prepare(`
    UPDATE pagos
    SET comprobante_efectivo_key = ?,
        estado = 'EN_REVISION',
        observaciones = NULL,
        fecha_revision = NULL
    WHERE id = ?
      AND estado IN (
          'PENDIENTE',
          'EN_REVISION',
          'RECHAZADO'
      )
      AND monto_pagado = 0
      AND EXISTS (
          SELECT 1
          FROM participantes p
          WHERE p.id = pagos.participante_id
            AND p.cancelada = 0
      )
`).bind(clave, id).run();


        } catch (error) {
            await env.COMPROBANTES.delete(clave);
            throw error;
        }

        if (actualizado.meta?.changes !== 1) {
            await env.COMPROBANTES.delete(clave);

            return responder({
                mensaje: "El pago cambió de estado. Actualiza el panel."
            }, 409);
        }

        // Eliminar el archivo anterior después de
        // confirmar que D1 guardó el nuevo.
        if (
            pago.comprobante_efectivo_key &&
            pago.comprobante_efectivo_key !== clave
        ) {
            try {
                await env.COMPROBANTES.delete(
                    pago.comprobante_efectivo_key
                );
            } catch (error) {
                console.error(
                    "No se pudo limpiar el comprobante anterior:",
                    error?.message
                );
            }
        }

        return responder({
            estado: "OK",
            mensaje: "Comprobante de efectivo guardado correctamente."
        });

    } catch (error) {
        console.error(
            "Error al guardar comprobante de efectivo:",
            error?.message
        );

        return responder({
            mensaje: "No se pudo guardar el comprobante."
        }, 500);
    }
}
