/*
 * CAMPAMENTO ICEC 2027
 * Recuperación segura de contraseñas
 * Cloudflare Workers + D1 + Resend
 */

import { enviarCorreo } from "./correo-api.js";

// El código provisorio tendrá una duración de 15 minutos.
const DURACION_CODIGO = 15 * 60;

// Tiempo mínimo entre solicitudes de recuperación.
const ESPERA_SOLICITUD = 60;

// Máximo de intentos para ingresar el código.
const MAX_INTENTOS = 3;

// Dirección pública del campamento.
const URL_CAMPAMENTO = "https://icec.cl";

// ==========================================
// GENERAR CÓDIGO PROVISORIO
// ==========================================


function generarCodigoProvisorio() {
    const numeros = new Uint32Array(1);
    const limite = Math.floor(4294967296 / 90000000) * 90000000;

    let numero;

    do {
        crypto.getRandomValues(numeros);
        numero = numeros[0];
    } while (numero >= limite);

    return String(
        10000000 + (numero % 90000000)
    );
}


// ==========================================
// PROTEGER CÓDIGO CON HMAC-SHA256
// ==========================================

async function crearHashCodigo(codigo, env) {
    if (!env.RECUPERACION_SECRET) {
        throw new Error(
            "La clave de seguridad no está configurada."
        );
    }

    const codificador = new TextEncoder();

    const clave = await crypto.subtle.importKey(
        "raw",
        codificador.encode(env.RECUPERACION_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    );

    const firma = await crypto.subtle.sign(
        "HMAC",
        clave,
        codificador.encode(`recuperacion:${codigo}`)
    );

    return Array.from(new Uint8Array(firma))
        .map(byte => byte.toString(16).padStart(2, "0"))
        .join("");
}

// ==========================================
// RESPUESTAS DE LA API
// ==========================================

function responder(datos, estado = 200) {
    return Response.json(datos, {
        status: estado,
        headers: {
            "Cache-Control": "no-store"
        }
    });
}


// ==========================================
// VALIDAR CORREO ELECTRÓNICO
// ==========================================

function normalizarCorreo(correo) {
    if (typeof correo !== "string") {
        return null;
    }

    const correoLimpio = correo.trim().toLowerCase();

    if (
        correoLimpio.length > 150 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoLimpio)
    ) {
        return null;
    }

    return correoLimpio;
}
// ==========================================
// BUSCAR USUARIO POR CORREO
// ==========================================

async function buscarUsuarioPorCorreo(correo, env) {

    const usuario = await env.DB.prepare(`
        SELECT id, correo
        FROM usuarios
        WHERE correo = ?
          AND activo = 1
        LIMIT 1
    `)
    .bind(correo)
    .first();

    return usuario;
}
// ==========================================
// LIMITAR SOLICITUDES DE RECUPERACIÓN
// ==========================================

async function puedeSolicitarCodigo(usuarioId, env) {

    const ahora = Math.floor(Date.now() / 1000);

    const resultado = await env.DB.prepare(`
        SELECT
            MAX(creado_en) AS ultima_solicitud,
            COUNT(*) AS solicitudes_recientes
        FROM recuperaciones_contrasena
        WHERE usuario_id = ?
          AND creado_en > ?
    `)
    .bind(usuarioId, ahora - 3600)
    .first();

    // Esperar al menos 60 segundos entre solicitudes.
    if (
        resultado?.ultima_solicitud &&
        ahora - resultado.ultima_solicitud < ESPERA_SOLICITUD
    ) {
        return false;
    }

    // Permitir como máximo 3 solicitudes por hora.
    if (resultado?.solicitudes_recientes >= 3) {
        return false;
    }

    return true;
}

export async function solicitarRecuperacion(request, env) {
    const mensajeGenerico =
        "Si el correo está registrado, recibirás un código de recuperación.";

    try {
        const texto = await request.text();

        if (texto.length > 4096) {
            return responder({
                mensaje: "Solicitud demasiado grande."
            }, 413);
        }

        let datos;

        try {
            datos = JSON.parse(texto);
        } catch {
            return responder({
                mensaje: "Solicitud inválida."
            }, 400);
        }

        const correo = normalizarCorreo(datos?.correo);

        if (!correo) {
            return responder({
                mensaje: "Ingresa un correo electrónico válido."
            }, 400);
        }

        const usuario = await buscarUsuarioPorCorreo(
            correo,
            env
        );

        // No revelar si el correo está registrado.
        if (!usuario) {
            return responder({ mensaje: mensajeGenerico });
        }

        const permitido = await puedeSolicitarCodigo(
            usuario.id,
            env
        );

        if (!permitido) {
            return responder({ mensaje: mensajeGenerico });
        }

        const codigo = generarCodigoProvisorio();
        const tokenHash = await crearHashCodigo(codigo, env);

        const ahora = Math.floor(Date.now() / 1000);
        const vencimiento = ahora + DURACION_CODIGO;
        // Invalidar códigos anteriores del participante.
        await env.DB.prepare(`
            UPDATE recuperaciones_contrasena
            SET utilizado_en = ?
            WHERE usuario_id = ?
            AND utilizado_en IS NULL
        `).bind(
            ahora,
            usuario.id
        ).run();

        const registro = await env.DB.prepare(`
            INSERT INTO recuperaciones_contrasena
                (usuario_id, token_hash, expira_en, creado_en)
            VALUES (?, ?, ?, ?)
        `).bind(
            usuario.id,
            tokenHash,
            vencimiento,
            ahora
        ).run();

        try {
            await enviarCorreo(env, {
                destinatario: usuario.correo,
                asunto: "Recuperar contraseña - ICEC Juvenil 2027",
                mensaje:
                    `Campamento ICEC Juvenil 2027\n\n` +
                    `Tu código de recuperación es: ${codigo}\n\n` +
                    `Este código vence en 15 minutos.\n\n` +
                    `Ingresa a:\n${URL_CAMPAMENTO}/nueva-contrasena.html\n\n` +
                    `Si no solicitaste este cambio, ignora este correo.`
            });
        } catch (errorCorreo) {
            console.error(
                "Error al enviar recuperación:",
                errorCorreo?.message
            );

            // Eliminar el código si el envío falló.
            if (registro.meta?.last_row_id) {
                await env.DB.prepare(`
                    DELETE FROM recuperaciones_contrasena
                    WHERE id = ?
                `).bind(registro.meta.last_row_id).run();
            }
        }

        return responder({ mensaje: mensajeGenerico });

    } catch (error) {
        console.error(
            "Error en recuperación:",
            error?.message
        );

        return responder({
            mensaje: "No se pudo procesar la solicitud."
        }, 500);
    }
}

/* ==========================================
   VALIDAR CÓDIGO DE RECUPERACIÓN
   ========================================== */



async function validarCodigoRecuperacion(
    usuarioId,
    codigo,
    env
) {
    const ahora = Math.floor(Date.now() / 1000);

    const recuperacion = await env.DB.prepare(`
        SELECT
            id,
            token_hash,
            expira_en,
            intentos_fallidos
        FROM recuperaciones_contrasena
        WHERE usuario_id = ?
          AND utilizado_en IS NULL
        ORDER BY creado_en DESC, id DESC
        LIMIT 1
    `)
    .bind(usuarioId)
    .first();

    if (!recuperacion) {
        return null;
    }

    // Rechazar códigos vencidos o bloqueados.
    if (
        recuperacion.expira_en <= ahora ||
        recuperacion.intentos_fallidos >= MAX_INTENTOS
    ) {
        return null;
    }

    // Cada código debe tener exactamente 8 dígitos.
    if (
        typeof codigo !== "string" ||
        !/^\d{8}$/.test(codigo)
    ) {
        await registrarIntentoFallido(
            recuperacion.id,
            env
        );
        return null;
    }

    const hashIngresado = await crearHashCodigo(
        codigo,
        env
    );

    const esperado = recuperacion.token_hash;

    let diferencias = 0;

    if (
        typeof esperado !== "string" ||
        esperado.length !== hashIngresado.length
    ) {
        diferencias = 1;
    } else {
        for (let i = 0; i < esperado.length; i++) {
            diferencias |=
                esperado.charCodeAt(i) ^
                hashIngresado.charCodeAt(i);
        }
    }

    if (diferencias !== 0) {
        await registrarIntentoFallido(
            recuperacion.id,
            env
        );
        return null;
    }

    return recuperacion;
}




/* ==========================================
   REGISTRAR INTENTO FALLIDO
   ========================================== */

async function registrarIntentoFallido(recuperacionId, env) {

    const resultado = await env.DB.prepare(`
        UPDATE recuperaciones_contrasena
        SET intentos_fallidos = intentos_fallidos + 1
        WHERE id = ?
          AND utilizado_en IS NULL
          AND expira_en > unixepoch()
          AND intentos_fallidos < ?
    `)
    .bind(recuperacionId, MAX_INTENTOS)
    .run();

    return resultado.meta?.changes === 1;
}


/* ==========================================
   PROTEGER LA NUEVA CONTRASEÑA
   ========================================== */

async function crearHashNuevaContrasena(contrasena) {

    const salt = crypto.getRandomValues(
        new Uint8Array(16)
    );

    const clave = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(contrasena),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const iteraciones = 100000;

    const hash = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt,
            iterations: iteraciones,
            hash: "SHA-256"
        },
        clave,
        256
    );

    const convertirHex = bytes =>
        Array.from(bytes)
            .map(byte => byte.toString(16).padStart(2, "0"))
            .join("");

    return [
        "pbkdf2_sha256",
        iteraciones,
        convertirHex(salt),
        convertirHex(new Uint8Array(hash))
    ].join("$");
}

/* ==========================================
   ACTUALIZAR CONTRASEÑA Y CONSUMIR CÓDIGO
   ========================================== */


async function actualizarContrasenaConCodigo(
    usuarioId,
    recuperacion,
    codigo,
    nuevaContrasena,
    env
) {
    const ahora = Math.floor(Date.now() / 1000);

    const tokenHash = await crearHashCodigo(codigo, env);

    const contrasenaHash =
        await crearHashNuevaContrasena(nuevaContrasena);

    // Consumir el código y cambiar la contraseña
    // dentro de una única transacción D1.
    const resultados = await env.DB.batch([
        env.DB.prepare(`
            UPDATE recuperaciones_contrasena
            SET utilizado_en = ?
            WHERE id = ?
              AND usuario_id = ?
              AND token_hash = ?
              AND utilizado_en IS NULL
              AND expira_en > unixepoch()
              AND intentos_fallidos < ?
              AND id = (
                  SELECT id
                  FROM recuperaciones_contrasena
                  WHERE usuario_id = ?
                  ORDER BY creado_en DESC, id DESC
                  LIMIT 1
              )
        `).bind(
            ahora,
            recuperacion.id,
            usuarioId,
            tokenHash,
            MAX_INTENTOS,
            usuarioId
        ),

        env.DB.prepare(`
            UPDATE usuarios
            SET contrasena_hash = ?
            WHERE id = ?
              AND activo = 1
              AND changes() = 1
        `).bind(
            contrasenaHash,
            usuarioId
        )
    ]);

    return (
        resultados[0]?.meta?.changes === 1 &&
        resultados[1]?.meta?.changes === 1
    );
}


/* ==========================================
   ENDPOINT: CREAR NUEVA CONTRASEÑA
   ========================================== */

export async function guardarNuevaContrasena(request, env) {
    try {
        const texto = await request.text();

        if (texto.length > 4096) {
            return responder({
                mensaje: "Solicitud demasiado grande."
            }, 413);
        }

        let datos;

        try {
            datos = JSON.parse(texto);
        } catch {
            return responder({
                mensaje: "Solicitud inválida."
            }, 400);
        }

        const correo = normalizarCorreo(datos?.correo);
        const codigo = datos?.contrasenaProvisoria;
        const nuevaContrasena = datos?.nuevaContrasena;

        if (
            !correo ||
            typeof codigo !== "string" ||
            typeof nuevaContrasena !== "string" ||
            nuevaContrasena.length < 8 ||
            nuevaContrasena.length > 128
        ) {
            return responder({
                mensaje: "Verifica los datos ingresados. La nueva contraseña debe tener entre 8 y 128 caracteres."
            }, 400);
        }

        const usuario = await buscarUsuarioPorCorreo(
            correo,
            env
        );

        if (!usuario) {
            return responder({
                mensaje: "Código inválido, vencido o bloqueado."
            }, 400);
        }

        const recuperacion = await validarCodigoRecuperacion(
            usuario.id,
            codigo,
            env
        );

        if (!recuperacion) {
            return responder({
                mensaje: "Código inválido, vencido o bloqueado."
            }, 400);
        }

        const actualizado = await actualizarContrasenaConCodigo(
            usuario.id,
            recuperacion,
            codigo,
            nuevaContrasena,
            env
        );

        if (!actualizado) {
            return responder({
                mensaje: "No se pudo validar el código. Solicita uno nuevo."
            }, 409);
        }

        return responder({
            estado: "OK",
            mensaje: "Contraseña actualizada correctamente. Ya puedes iniciar sesión."
        });

    } catch (error) {
        console.error(
            "Error al actualizar contraseña:",
            error?.message
        );

        return responder({
            mensaje: "No fue posible actualizar la contraseña."
        }, 500);
    }
}
