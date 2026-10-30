
/*
 * Campamento Juvenil ICEC 2027
 * Backend: Cloudflare Workers + D1
 * Registro de participantes con Turnstile
 */

const FECHA_CAMPAMENTO = "2027-01-08";

const URL_TURNSTILE =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

// ==========================================
// RESPUESTAS JSON
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
// FUNCIONES DE VALIDACIÓN
// ==========================================

function limpiar(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

function textoValido(valor, maximo, obligatorio = true) {
  if (valor === undefined || valor === null || valor === "") {
    return !obligatorio;
  }

  return (
    typeof valor === "string" &&
    valor.trim().length <= maximo &&
    (!obligatorio || valor.trim().length > 0)
  );
}

function validarTelefono(valor, obligatorio = true) {
  if (!obligatorio && !valor) return true;
  if (typeof valor !== "string") return false;

  const texto = valor.trim();
  const digitos = texto.replace(/\D/g, "");

  return (
    /^\+?[\d\s()-]{8,20}$/.test(texto) &&
    digitos.length >= 8 &&
    digitos.length <= 15
  );
}

function normalizarRut(rut) {
  return limpiar(rut)
    .replace(/[.\-\s]/g, "")
    .toUpperCase();
}

function validarRut(rut) {
  const limpio = normalizarRut(rut);

  if (!/^\d{7,8}[0-9K]$/.test(limpio)) {
    return false;
  }

  const cuerpo = limpio.slice(0, -1);
  const verificador = limpio.slice(-1);

  let suma = 0;
  let factor = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }

  const resultado = 11 - (suma % 11);

  const esperado =
    resultado === 11
      ? "0"
      : resultado === 10
        ? "K"
        : String(resultado);

  return verificador === esperado;
}

function validarFecha(fecha) {
  if (
    typeof fecha !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
  ) {
    return false;
  }

  const valor = new Date(fecha + "T00:00:00Z");

  if (
    Number.isNaN(valor.getTime()) ||
    valor.toISOString().slice(0, 10) !== fecha
  ) {
    return false;
  }

  const hoy = new Date().toISOString().slice(0, 10);

  return fecha <= hoy && fecha <= FECHA_CAMPAMENTO;
}

function calcularAcreditacion(fecha) {
  const [anio, mes, dia] = fecha.split("-").map(Number);

  let edad = 2027 - anio;

  if (mes > 1 || (mes === 1 && dia > 8)) {
    edad--;
  }

  return edad <= 9 ? 10000 : 20000;
}

function siNo(valor) {
  return valor === "si" || valor === "no";
}

function validarDatos(datos) {
  if (
    !datos ||
    typeof datos !== "object" ||
    Array.isArray(datos)
  ) {
    return "Los datos enviados no son válidos.";
  }

  const correo = limpiar(datos.correo);

  if (
    correo.length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
  ) {
    return "Correo electrónico no válido.";
  }

  if (
    typeof datos.contrasena !== "string" ||
    datos.contrasena.length < 8 ||
    datos.contrasena.length > 128
  ) {
    return "La contraseña debe tener entre 8 y 128 caracteres.";
  }

  if (!textoValido(datos.nombreCompleto, 150)) {
    return "Nombre completo no válido.";
  }

  if (!textoValido(datos.alias, 40, false)) {
    return "El alias no es válido.";
  }

  if (!validarRut(datos.rut)) {
    return "RUT no válido.";
  }

  const genero = limpiar(datos.genero).toUpperCase();

  if (!["MASCULINO", "FEMENINO"].includes(genero)) {
    return "Género no válido.";
  }

  if (!validarFecha(datos.fechaNacimiento)) {
    return "Fecha de nacimiento no válida.";
  }

  if (!validarTelefono(datos.telefono)) {
    return "Teléfono no válido.";
  }

  const preguntasMedicas = [
    ["tieneAlergias", "detalleAlergias"],
    ["tieneEnfermedad", "detalleEnfermedad"],
    ["tomaMedicamentos", "detalleMedicamentos"],
    ["restriccionAlimentaria", "detalleAlimentacion"]
  ];

  for (const [pregunta, detalle] of preguntasMedicas) {
    if (!siNo(datos[pregunta])) {
      return `Respuesta obligatoria: ${pregunta}.`;
    }

    if (
      !textoValido(
        datos[detalle],
        500,
        datos[pregunta] === "si"
      )
    ) {
      return `Detalle médico no válido: ${detalle}.`;
    }
  }

  if (!textoValido(datos.nombreEmergencia, 150)) {
    return "Nombre del contacto de emergencia no válido.";
  }

  const parentescos = [
    "madre-padre",
    "tutor",
    "hermano",
    "pareja",
    "otro"
  ];

  if (!parentescos.includes(datos.parentesco)) {
    return "Parentesco no válido.";
  }

  if (!validarTelefono(datos.telefonoEmergencia)) {
    return "Teléfono de emergencia no válido.";
  }

  if (!validarTelefono(datos.telefonoAlternativo, false)) {
    return "Teléfono alternativo no válido.";
  }

  if (!siNo(datos.tieneAcompanantes)) {
    return "Indica si asistirás con acompañantes.";
  }

  if (
    datos.confirmaInformacion !== true &&
    datos.confirmaInformacion !== "on"
  ) {
    return "Debes confirmar la información.";
  }

  return null;
}

// ==========================================
// PROTECCIÓN DE CONTRASEÑAS
// ==========================================

async function crearHashContrasena(contrasena) {
  const encoder = new TextEncoder();

  const salt = crypto.getRandomValues(
    new Uint8Array(16)
  );

  const clave = await crypto.subtle.importKey(
    "raw",
    encoder.encode(contrasena),
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

  const hex = (bytes) =>
    Array.from(bytes)
      .map(n => n.toString(16).padStart(2, "0"))
      .join("");

  return [
    "pbkdf2_sha256",
    iteraciones,
    hex(salt),
    hex(new Uint8Array(hash))
  ].join("$");
}

// ==========================================
// VERIFICACIÓN DE CLOUDFARE TURNSTILE
// ==========================================

async function verificarTurnstile(token, request, env) {
  if (!env.TURNSTILE_SECRET_KEY) {
    return {
      correcto: false,
      estado: 503,
      mensaje: "La verificación de seguridad no está configurada."
    };
  }

  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > 2048
  ) {
    return {
      correcto: false,
      estado: 403,
      mensaje: "Debes completar la verificación de seguridad."
    };
  }

  const parametros = new URLSearchParams();

  parametros.set("secret", env.TURNSTILE_SECRET_KEY);
  parametros.set("response", token);

  const ip = request.headers.get("CF-Connecting-IP");

  if (ip) {
    parametros.set("remoteip", ip);
  }

  try {
    const respuesta = await fetch(URL_TURNSTILE, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: parametros.toString(),
      signal: AbortSignal.timeout(10000)
    });

    if (!respuesta.ok) {
      return {
        correcto: false,
        estado: 503,
        mensaje: "No se pudo verificar la seguridad. Intenta nuevamente."
      };
    }

    const resultado = await respuesta.json();

    if (resultado.success !== true) {
      return {
        correcto: false,
        estado: 403,
        mensaje: "La verificación de seguridad falló. Intenta nuevamente."
      };
    }

    // Durante las pruebas, el widget solo
    // está autorizado para localhost.
    // Al publicar la página agregaremos
    // su dominio real a esta lista.

    const HOSTNAMES_PERMITIDOS = [
      "localhost",
      "127.0.0.1"
    ];

    if (!HOSTNAMES_PERMITIDOS.includes(resultado.hostname)) {
      return {
        correcto: false,
        estado: 403,
        mensaje: "El origen de la verificación no está autorizado."
      };
    }

    return {
      correcto: true
    };

  } catch (error) {
    console.error(
      "Error al consultar Turnstile:",
      error?.name
    );

    return {
      correcto: false,
      estado: 503,
      mensaje: "No fue posible verificar la seguridad. Intenta nuevamente."
    };
  }
}

// ==========================================
// REGISTRAR PARTICIPANTE EN D1
// ==========================================

async function registrarParticipante(datos, env) {
  const error = validarDatos(datos);

  if (error) {
    return responder({
      mensaje: error
    }, 400);
  }

  const correo = limpiar(datos.correo).toLowerCase();
  const rut = normalizarRut(datos.rut);
  const genero = limpiar(datos.genero).toUpperCase();

  // Comprobar duplicados.

  const duplicado = await env.DB.prepare(
    `SELECT
      (SELECT COUNT(*) FROM usuarios
       WHERE correo = ?) AS correos,
      (SELECT COUNT(*) FROM participantes
       WHERE rut = ?) AS participantes,
      (SELECT COUNT(*) FROM acompanantes
       WHERE rut = ?) AS acompanantes`
  ).bind(correo, rut, rut).first();

  if (
    duplicado.correos > 0 ||
    duplicado.participantes > 0 ||
    duplicado.acompanantes > 0
  ) {
    return responder({
      mensaje: "El correo o RUT ya está registrado."
    }, 409);
  }

  const hash = await crearHashContrasena(
    datos.contrasena
  );

  const monto = calcularAcreditacion(
    datos.fechaNacimiento
  );

  const bandera = (valor) =>
    valor === "si" ? 1 : 0;

  const detalle = (pregunta, campo) =>
    datos[pregunta] === "si"
      ? limpiar(datos[campo])
      : null;

  const idParticipante = `
    SELECT p.id
    FROM participantes p
    JOIN usuarios u ON u.id = p.usuario_id
    WHERE u.correo = ?
  `;

  // El lote evita guardar registros incompletos.

  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO usuarios
         (correo, contrasena_hash, rol, genero)
         VALUES (?, ?, 'PARTICIPANTE', ?)`
      ).bind(correo, hash, genero),

      env.DB.prepare(
        `INSERT INTO participantes
         (
           usuario_id,
           nombre_completo,
           alias,
           rut,
           fecha_nacimiento,
           genero,
           telefono,
           valor_acreditacion
         )
         SELECT
           id, ?, ?, ?, ?, ?, ?, ?
         FROM usuarios
         WHERE correo = ?`
      ).bind(
        limpiar(datos.nombreCompleto),
        limpiar(datos.alias) || null,
        rut,
        datos.fechaNacimiento,
        genero,
        limpiar(datos.telefono),
        monto,
        correo
      ),

      env.DB.prepare(
        `INSERT INTO informacion_medica
         (
           participante_id,
           tiene_alergias,
           detalle_alergias,
           tiene_enfermedad,
           detalle_enfermedad,
           toma_medicamentos,
           detalle_medicamentos,
           restriccion_alimentaria,
           detalle_alimentacion
         )
         SELECT
           (${idParticipante}),
           ?, ?, ?, ?, ?, ?, ?, ?`
      ).bind(
        correo,
        bandera(datos.tieneAlergias),
        detalle(
          "tieneAlergias",
          "detalleAlergias"
        ),
        bandera(datos.tieneEnfermedad),
        detalle(
          "tieneEnfermedad",
          "detalleEnfermedad"
        ),
        bandera(datos.tomaMedicamentos),
        detalle(
          "tomaMedicamentos",
          "detalleMedicamentos"
        ),
        bandera(datos.restriccionAlimentaria),
        detalle(
          "restriccionAlimentaria",
          "detalleAlimentacion"
        )
      ),

      env.DB.prepare(
        `INSERT INTO contactos_emergencia
         (
           participante_id,
           nombre_completo,
           parentesco,
           telefono_principal,
           telefono_alternativo
         )
         SELECT
           (${idParticipante}),
           ?, ?, ?, ?`
      ).bind(
        correo,
        limpiar(datos.nombreEmergencia),
        datos.parentesco,
        limpiar(datos.telefonoEmergencia),
        limpiar(datos.telefonoAlternativo) || null
      ),

      env.DB.prepare(
        `INSERT INTO pagos
         (
           participante_id,
           monto_total,
           monto_pagado,
           estado
         )
         SELECT
           id, ?, 0, 'PENDIENTE'
         FROM participantes
         WHERE usuario_id = (
           SELECT id
           FROM usuarios
           WHERE correo = ?
         )`
      ).bind(monto, correo)
    ]);

    return responder({
      mensaje: "Inscripción registrada correctamente.",
      estado: "REGISTRADA",
      montoTotal: monto,
      pago: "PENDIENTE",
      acompanantesPendientes:
        datos.tieneAcompanantes === "si"
    }, 201);

  } catch (error) {
    console.error(
      "Error al registrar participante:",
      error?.message
    );

    const mensaje = String(
      error?.message || ""
    );

    if (
      mensaje.includes("UNIQUE constraint") ||
      mensaje.includes("SQLITE_CONSTRAINT_UNIQUE")
    ) {
      return responder({
        mensaje: "El correo o RUT ya está registrado."
      }, 409);
    }

    return responder({
      mensaje: "No se pudo completar la inscripción."
    }, 500);
  }
}

// ==========================================
// CONFIGURACIÓN CORS
// ==========================================

// Direcciones autorizadas durante desarrollo.
// Agregar el dominio real antes del lanzamiento.

const ORIGENES_PERMITIDOS = [
  "http://localhost:5500",
  "http://127.0.0.1:5500"
];

function obtenerHeadersCORS(request) {
  const origen = request.headers.get("Origin");

  if (!ORIGENES_PERMITIDOS.includes(origen)) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origen,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin"
  };
}

function aplicarCORS(respuesta, request) {
  const cabeceras = new Headers(respuesta.headers);
  const headersCORS = obtenerHeadersCORS(request);

  for (const [clave, valor] of Object.entries(headersCORS)) {
    cabeceras.set(clave, valor);
  }

  return new Response(respuesta.body, {
    status: respuesta.status,
    statusText: respuesta.statusText,
    headers: cabeceras
  });
}

// ==========================================
// RUTAS DE LA API
// ==========================================

async function manejarSolicitud(request, env) {
  const url = new URL(request.url);

  // ----------------------------------------
  // ESTADO DEL BACKEND Y LA BASE DE DATOS
  // ----------------------------------------

  if (url.pathname === "/api/estado") {
    if (request.method !== "GET") {
      return responder({
        mensaje: "Método no permitido."
      }, 405);
    }

    try {
      const resultado = await env.DB.prepare(
        `SELECT COUNT(*) AS total
         FROM sqlite_master
         WHERE type = 'table'
         AND name NOT LIKE 'sqlite_%'`
      ).first();

      return responder({
        estado: "OK",
        baseDatos: "Conectada",
        tablas: resultado.total
      });

    } catch (error) {
      console.error(
        "Error de conexión D1:",
        error?.message
      );

      return responder({
        estado: "ERROR",
        baseDatos: "No disponible"
      }, 500);
    }
  }

  // ----------------------------------------
  // REGISTRO DE PARTICIPANTES
  // ----------------------------------------

  if (url.pathname === "/api/registro") {
    if (request.method !== "POST") {
      return responder({
        mensaje: "Método no permitido."
      }, 405);
    }

    // Revisar el tipo de contenido.

    if (
      !request.headers.get("content-type")
        ?.toLowerCase()
        .startsWith("application/json")
    ) {
      return responder({
        mensaje: "Se requiere JSON."
      }, 415);
    }

    // Revisar tamaño de la solicitud.

    const tamano = Number(
      request.headers.get("content-length") || 0
    );

    if (tamano > 16384) {
      return responder({
        mensaje: "Solicitud demasiado grande."
      }, 413);
    }

    let datos;

    try {
      const cuerpo = await request.text();

      if (
        new TextEncoder().encode(cuerpo).length > 16384
      ) {
        return responder({
          mensaje: "Solicitud demasiado grande."
        }, 413);
      }

      datos = JSON.parse(cuerpo);

    } catch {
      return responder({
        mensaje: "JSON no válido."
      }, 400);
    }

    if (
      !datos ||
      typeof datos !== "object" ||
      Array.isArray(datos)
    ) {
      return responder({
        mensaje: "Los datos enviados no son válidos."
      }, 400);
    }

    // --------------------------------------
    // VERIFICAR PERMISO PARA REGISTRAR
    // --------------------------------------

    // Opción 1:
    // Registro privado desde Postman.
    // Se conserva para las pruebas internas.

    const tokenPrivado = request.headers.get(
      "X-Registro-Prueba"
    );

    const pruebaAutorizada =
      Boolean(env.REGISTRO_PRUEBA_TOKEN) &&
      Boolean(tokenPrivado) &&
      tokenPrivado === env.REGISTRO_PRUEBA_TOKEN;

    // Opción 2:
    // Registro desde el formulario público,
    // utilizando Cloudflare Turnstile.

    if (!pruebaAutorizada) {
      const tokenTurnstile =
        datos.turnstileToken ||
        datos["cf-turnstile-response"];

      const verificacion = await verificarTurnstile(
        tokenTurnstile,
        request,
        env
      );

      if (!verificacion.correcto) {
        return responder({
          mensaje: verificacion.mensaje
        }, verificacion.estado);
      }
    }

    // --------------------------------------
    // GUARDAR PARTICIPANTE EN D1
    // --------------------------------------

    try {
      return await registrarParticipante(
        datos,
        env
      );

    } catch (error) {
      console.error(
        "Fallo inesperado en el registro:",
        error?.name,
        error?.message
      );

      return responder({
        mensaje: "Error interno del registro."
      }, 500);
    }
  }

  return responder({
    mensaje: "Ruta no encontrada."
  }, 404);
}

// ==========================================
// WORKER PRINCIPAL
// ==========================================

export default {
  async fetch(request, env) {

    // Responder a las verificaciones CORS.

    if (request.method === "OPTIONS") {
      const origen = request.headers.get("Origin");

      if (!ORIGENES_PERMITIDOS.includes(origen)) {
        return new Response(null, {
          status: 403
        });
      }

      return new Response(null, {
        status: 204,
        headers: obtenerHeadersCORS(request)
      });
    }

    try {
      const respuesta = await manejarSolicitud(
        request,
        env
      );

      return aplicarCORS(
        respuesta,
        request
      );

    } catch (error) {
      console.error(
        "Error inesperado en el Worker:",
        error?.message
      );

      return aplicarCORS(
        responder({
          mensaje: "Error interno del servidor."
        }, 500),
        request
      );
    }
  }
};
