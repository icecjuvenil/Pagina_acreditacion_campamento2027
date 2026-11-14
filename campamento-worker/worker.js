
/*
 * CAMPAMENTO JUVENIL ICEC 2027
 * Backend: Cloudflare Workers + D1
 *
 * Registro de participantes
 * Cloudflare Turnstile
 * Inicio y cierre de sesión
 * Protección de contraseñas
 * Límite de intentos de acceso
 */

// ==========================================
// CONFIGURACIÓN
// ==========================================
import { manejarAcompanantes } from "./acompanantes-api.js";
import { manejarBeneficioLider } from "./lideres-api.js";
import { manejarComprobantes } from "./comprobantes-api.js";
import { manejarResumen } from "./resumen-api.js";
import { manejarPagosAdmin } from "./admin-api.js";
import { manejarValidacionPagoAdmin } from "./admin-validacion-api.js";
import { manejarComprobanteEfectivoAdmin } from "./admin-efectivo-api.js";
import { manejarCancelacionAdmin } from "./admin-cancelacion-api.js";
import { manejarHabitaciones } from "./habitaciones-api.js";
import { manejarExportacion } from "./exportacion-api.js";
import {
    solicitarRecuperacion,
    guardarNuevaContrasena
} from "./recuperacion-api.js";

import {
    manejarDetalleAdmin,
    manejarComprobanteAdmin
} from "./admin-detalle-api.js";



const FECHA_CAMPAMENTO = "2027-01-08";

const DURACION_SESION_SEGUNDOS = 8 * 60 * 60;

const NOMBRE_COOKIE_SESION = "icec_sesion";

const VENTANA_LOGIN_SEGUNDOS = 15 * 60;

const MAX_INTENTOS_LOGIN = 8;

const URL_TURNSTILE =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const ORIGENES_PERMITIDOS = [
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:5501",
  "http://127.0.0.1:5501",
  "https://pagina-acreditacion-campamento2027.pages.dev",
  "https://icec.cl",
  "https://www.icec.cl"
];

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

function respuestaConCookie(datos, estado, cookie) {
  const respuesta = responder(datos, estado);

  respuesta.headers.set("Set-Cookie", cookie);

  return respuesta;
}

// ==========================================
// VALIDACIONES
// ==========================================

function limpiar(valor) {
  return typeof valor === "string"
    ? valor.trim()
    : "";
}

function textoValido(valor, maximo, obligatorio = true) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
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

// ==========================================
// VALORES DE ACREDITACIÓN
// ==========================================

function calcularAcreditacion(fecha) {
  const [anio, mes, dia] = fecha
    .split("-")
    .map(Number);

  let edad = 2027 - anio;

  if (mes > 1 || (mes === 1 && dia > 8)) {
    edad--;
  }

  if (edad >= 0 && edad <= 5) {
    return 0;
  }

  if (edad >= 6 && edad <= 10) {
    return 10000;
  }

  return 20000;
}

function siNo(valor) {
  return valor === "si" || valor === "no";
}

// ==========================================
// VALIDAR DATOS DEL PARTICIPANTE
// ==========================================

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
// CREAR HASH DE CONTRASEÑA
// ==========================================

async function crearHashContrasena(contrasena) {
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

  const hex = bytes =>
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
// VERIFICAR CONTRASEÑA
// ==========================================

async function verificarContrasena(
  contrasena,
  hashGuardado
) {
  if (
    typeof contrasena !== "string" ||
    typeof hashGuardado !== "string"
  ) {
    return false;
  }

  const partes = hashGuardado.split("$");

  if (
    partes.length !== 4 ||
    partes[0] !== "pbkdf2_sha256"
  ) {
    return false;
  }

  if (Number(partes[1]) !== 100000) {
    return false;
  }

  const convertirHex = texto => {
    if (!/^(?:[0-9a-f]{2})+$/i.test(texto)) {
      throw new Error("Formato de hash no válido.");
    }

    return Uint8Array.from(
      texto.match(/.{2}/g),
      byte => parseInt(byte, 16)
    );
  };

  try {
    const salt = convertirHex(partes[2]);

    const hashOriginal = convertirHex(partes[3]);

    if (
      salt.length !== 16 ||
      hashOriginal.length !== 32
    ) {
      return false;
    }

    const clave = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(contrasena),
      "PBKDF2",
      false,
      ["deriveBits"]
    );

    const hashCalculado = new Uint8Array(
      await crypto.subtle.deriveBits(
        {
          name: "PBKDF2",
          salt,
          iterations: 100000,
          hash: "SHA-256"
        },
        clave,
        256
      )
    );

    let diferencias = 0;

    for (let i = 0; i < hashOriginal.length; i++) {
      diferencias |=
        hashOriginal[i] ^ hashCalculado[i];
    }

    return diferencias === 0;

  } catch {
    return false;
  }
}

// ==========================================
// SESIONES FIRMADAS
// ==========================================

function convertirBase64Url(bytes) {
  const binario = Array.from(
    bytes,
    byte => String.fromCharCode(byte)
  ).join("");

  return btoa(binario)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function firmarSesion(contenido, secreto) {
  const clave = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    {
      name: "HMAC",
      hash: "SHA-256"
    },
    false,
    ["sign"]
  );

  const firma = await crypto.subtle.sign(
    "HMAC",
    clave,
    new TextEncoder().encode(contenido)
  );

  return convertirBase64Url(
    new Uint8Array(firma)
  );
}

async function crearTokenSesion(usuarioId, env) {
  if (!env.LOGIN_SESSION_SECRET) {
    throw new Error(
      "Clave de sesiones no configurada."
    );
  }

  const ahora = Math.floor(Date.now() / 1000);

  const identificador = crypto.randomUUID();

  const contenido = [
    usuarioId,
    ahora + DURACION_SESION_SEGUNDOS,
    identificador
  ].join(".");

  const firma = await firmarSesion(
    contenido,
    env.LOGIN_SESSION_SECRET
  );

  return `${contenido}.${firma}`;
}

async function verificarTokenSesion(token, env) {
  if (
    typeof token !== "string" ||
    !env.LOGIN_SESSION_SECRET
  ) {
    return null;
  }

  const partes = token.split(".");

  if (partes.length !== 4) {
    return null;
  }

  const [
    usuarioIdTexto,
    vencimientoTexto,
    identificador,
    firma
  ] = partes;

  const usuarioId = Number(usuarioIdTexto);

  const vencimiento = Number(vencimientoTexto);

  const ahora = Math.floor(Date.now() / 1000);

  if (
    !Number.isSafeInteger(usuarioId) ||
    usuarioId <= 0 ||
    !Number.isSafeInteger(vencimiento) ||
    vencimiento <= ahora ||
    vencimiento > ahora + DURACION_SESION_SEGUNDOS ||
    !/^[0-9a-f-]{36}$/i.test(identificador)
  ) {
    return null;
  }

  const contenido = [
    usuarioIdTexto,
    vencimientoTexto,
    identificador
  ].join(".");

  const firmaEsperada = await firmarSesion(
    contenido,
    env.LOGIN_SESSION_SECRET
  );

  if (firma.length !== firmaEsperada.length) {
    return null;
  }

  let diferencias = 0;

  for (let i = 0; i < firma.length; i++) {
    diferencias |=
      firma.charCodeAt(i) ^
      firmaEsperada.charCodeAt(i);
  }

  return diferencias === 0
    ? { usuarioId, vencimiento }
    : null;
}

// ==========================================
// COOKIES
// ==========================================

function crearCookieSesion(token) {
  return [
    `${NOMBRE_COOKIE_SESION}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Secure",
    "SameSite=None",
    "Path=/",
    `Max-Age=${DURACION_SESION_SEGUNDOS}`
  ].join("; ");
}

function obtenerCookieSesion(request) {
  const cookies =
    request.headers.get("Cookie") || "";

  for (const cookie of cookies.split(";")) {
    const separador = cookie.indexOf("=");

    if (separador === -1) continue;

    const nombre =
      cookie.slice(0, separador).trim();

    const valor =
      cookie.slice(separador + 1).trim();

    if (nombre === NOMBRE_COOKIE_SESION) {
      try {
        return decodeURIComponent(valor);
      } catch {
        return null;
      }
    }
  }

  return null;
}

function eliminarCookieSesion() {
  return [
    `${NOMBRE_COOKIE_SESION}=`,
    "HttpOnly",
    "Secure",
    "SameSite=None",
    "Path=/",
    "Max-Age=0"
  ].join("; ");
}

// ==========================================
// CLOUDFARE TURNSTILE
// ==========================================

async function verificarTurnstile(
  token,
  request,
  env
) {
  if (!env.TURNSTILE_SECRET_KEY) {
    return {
      correcto: false,
      estado: 503,
      mensaje:
        "La verificación de seguridad no está configurada."
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
      mensaje:
        "Debes completar la verificación de seguridad."
    };
  }

  const parametros = new URLSearchParams();

  parametros.set(
    "secret",
    env.TURNSTILE_SECRET_KEY
  );

  parametros.set("response", token);

  const ip = request.headers.get(
    "CF-Connecting-IP"
  );

  if (ip) {
    parametros.set("remoteip", ip);
  }

  try {
    const respuesta = await fetch(
      URL_TURNSTILE,
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded"
        },
        body: parametros.toString(),
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!respuesta.ok) {
      return {
        correcto: false,
        estado: 503,
        mensaje:
          "No se pudo verificar la seguridad."
      };
    }

    const resultado = await respuesta.json();
    console.log("Hostname recibido de Turnstile:", resultado.hostname);

    if (resultado.success !== true) {
      return {
        correcto: false,
        estado: 403,
        mensaje:
          "La verificación de seguridad falló."
      };
    }

  
const HOSTNAMES_PERMITIDOS = [
  "localhost",
  "pagina-acreditacion-campamento2027.pages.dev",
  "icec.cl",
  "www.icec.cl"
];

    if (
      !HOSTNAMES_PERMITIDOS.includes(
        resultado.hostname
      )
    ) {
      return {
        correcto: false,
        estado: 403,
        mensaje:
          "El origen de la verificación no está autorizado."
      };
    }

    return {
      correcto: true
    };

  } catch (error) {
    console.error(
      "Error al verificar Turnstile:",
      error?.name
    );

    return {
      correcto: false,
      estado: 503,
      mensaje:
        "No fue posible verificar la seguridad."
    };
  }
}

// ==========================================
// REGISTRO DE PARTICIPANTES
// ==========================================

async function registrarParticipante(datos, env) {
  const error = validarDatos(datos);

  if (error) {
    return responder({
      mensaje: error
    }, 400);
  }

  const correo =
    limpiar(datos.correo).toLowerCase();

  const rut = normalizarRut(datos.rut);

  const genero =
    limpiar(datos.genero).toUpperCase();

  const duplicado = await env.DB.prepare(
    `SELECT
       (SELECT COUNT(*)
        FROM usuarios
        WHERE correo = ?) AS correos,

       (SELECT COUNT(*)
        FROM participantes
        WHERE rut = ?) AS participantes,

       (SELECT COUNT(*)
        FROM acompanantes
        WHERE rut = ?) AS acompanantes`
  ).bind(
    correo,
    rut,
    rut
  ).first();

  if (
    duplicado.correos > 0 ||
    duplicado.participantes > 0 ||
    duplicado.acompanantes > 0
  ) {
    return responder({
      mensaje:
        "El correo o RUT ya está registrado."
    }, 409);
  }

  const hash = await crearHashContrasena(
    datos.contrasena
  );

  const monto = calcularAcreditacion(
    datos.fechaNacimiento
  );

  const bandera = valor =>
    valor === "si" ? 1 : 0;

  const detalle = (pregunta, campo) =>
    datos[pregunta] === "si"
      ? limpiar(datos[campo])
      : null;

  const idParticipante = `
    SELECT p.id
    FROM participantes p
    JOIN usuarios u
      ON u.id = p.usuario_id
    WHERE u.correo = ?
  `;

  try {
    await env.DB.batch([

      // USUARIO
      env.DB.prepare(
        `INSERT INTO usuarios
         (
           correo,
           contrasena_hash,
           rol,
           genero
         )
         VALUES (?, ?, 'PARTICIPANTE', ?)`
      ).bind(
        correo,
        hash,
        genero
      ),

      // PARTICIPANTE
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

      // INFORMACIÓN MÉDICA
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

      // CONTACTO DE EMERGENCIA
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
        limpiar(
          datos.telefonoAlternativo
        ) || null
      ),

      // PAGO PENDIENTE
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
      ).bind(
        monto,
        correo
      )
    ]);

    
const usuarioCreado = await env.DB.prepare(
  `SELECT id
   FROM usuarios
   WHERE correo = ?
   LIMIT 1`
).bind(correo).first();

if (!usuarioCreado) {
  throw new Error(
    "No se pudo identificar la cuenta creada."
  );
}

const tokenSesion = await crearTokenSesion(
  usuarioCreado.id,
  env
);

return respuestaConCookie({
  mensaje: "Inscripción registrada correctamente.",
  estado: "REGISTRADA",
  montoTotal: monto,
  pago: "PENDIENTE",
  acompanantesPendientes:
    datos.tieneAcompanantes === "si"
}, 201, crearCookieSesion(tokenSesion));


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
      mensaje.includes(
        "SQLITE_CONSTRAINT_UNIQUE"
      )
    ) {
      return responder({
        mensaje:
          "El correo o RUT ya está registrado."
      }, 409);
    }

    return responder({
      mensaje:
        "No se pudo completar la inscripción."
    }, 500);
  }
}

// ==========================================
// CONFIGURACIÓN CORS
// ==========================================

function obtenerHeadersCORS(request) {
  const origen = request.headers.get(
    "Origin"
  );

  if (!ORIGENES_PERMITIDOS.includes(origen)) {
    return {};
  }

  
return {
  "Access-Control-Allow-Origin": origen,
  "Access-Control-Allow-Methods":
    "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, X-ICEC-Solicitud",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Max-Age": "600",
  "Vary": "Origin"
};

}

function aplicarCORS(respuesta, request) {
  const cabeceras =
    new Headers(respuesta.headers);

  const headersCORS =
    obtenerHeadersCORS(request);

  for (
    const [clave, valor]
    of Object.entries(headersCORS)
  ) {
    cabeceras.set(clave, valor);
  }

  return new Response(respuesta.body, {
    status: respuesta.status,
    statusText: respuesta.statusText,
    headers: cabeceras
  });
}

function validarOrigenPrivado(request) {
  const origen = request.headers.get(
    "Origin"
  );

  return (
    origen !== null &&
    ORIGENES_PERMITIDOS.includes(origen)
  );
}

// ==========================================
// LEER JSON
// ==========================================

async function leerJSON(request, maximo = 4096) {
  const tipo = request.headers.get(
    "content-type"
  );

  if (
    !tipo?.toLowerCase()
      .startsWith("application/json")
  ) {
    throw new Error(
      "Se requiere JSON."
    );
  }

  const cuerpo = await request.text();

  if (
    new TextEncoder().encode(cuerpo).length >
    maximo
  ) {
    throw new Error(
      "Solicitud demasiado grande."
    );
  }

  const datos = JSON.parse(cuerpo);

  if (
    !datos ||
    typeof datos !== "object" ||
    Array.isArray(datos)
  ) {
    throw new Error(
      "JSON no válido."
    );
  }

  return datos;
}

// ==========================================
// IDENTIFICAR USUARIO AUTENTICADO
// ==========================================

async function usuarioDeSesion(request, env) {
  const token = obtenerCookieSesion(request);

  const sesion = await verificarTokenSesion(
    token,
    env
  );

  if (!sesion) {
    return null;
  }

  const usuario = await env.DB.prepare(
    `SELECT
       u.id,
       u.correo,
       u.rol,
       u.activo,
       p.id AS participante_id,
       p.nombre_completo
     FROM usuarios u
     LEFT JOIN participantes p
       ON p.usuario_id = u.id
     WHERE u.id = ?`
  ).bind(
    sesion.usuarioId
  ).first();

  if (
    !usuario ||
    Number(usuario.activo) !== 1
  ) {
    return null;
  }

  return usuario;
}

// ==========================================
// LÍMITE DE INTENTOS DE LOGIN
// ==========================================

async function limitarIntentosLogin(
  request,
  env
) {
  const ip = request.headers.get(
    "CF-Connecting-IP"
  );

  if (!ip) {
    return responder({
      mensaje:
        "No se pudo validar el origen de la solicitud."
    }, 403);
  }

  // No guardamos la IP en texto plano.
  const datos = new TextEncoder().encode(
    `${env.LOGIN_SESSION_SECRET}:login:${ip}`
  );

  const digest = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      datos
    )
  );

  const clave = Array.from(digest)
    .map(n => n.toString(16).padStart(2, "0"))
    .join("");

  const ahora = Math.floor(Date.now() / 1000);

  const vence = ahora + VENTANA_LOGIN_SEGUNDOS;

  // Contador con actualización atómica en D1.
  const fila = await env.DB.prepare(
    `INSERT INTO login_intentos
       (clave, intentos, vence)
     VALUES (?, 1, ?)
     ON CONFLICT(clave)
     DO UPDATE SET
       intentos = CASE
         WHEN login_intentos.vence <= ?
           THEN 1
         ELSE login_intentos.intentos + 1
       END,
       vence = CASE
         WHEN login_intentos.vence <= ?
           THEN excluded.vence
         ELSE login_intentos.vence
       END
     RETURNING intentos, vence`
  ).bind(
    clave,
    vence,
    ahora,
    ahora
  ).first();

  if (
    Number(fila.intentos) >
    MAX_INTENTOS_LOGIN
  ) {
    const segundos = Math.max(
      1,
      Number(fila.vence) - ahora
    );

    const respuesta = responder({
      mensaje:
        "Demasiados intentos de acceso. " +
        "Intenta nuevamente más tarde."
    }, 429);

    respuesta.headers.set(
      "Retry-After",
      String(segundos)
    );

    return respuesta;
  }

  return null;
}

// ==========================================
// INICIO DE SESIÓN
// ==========================================

async function iniciarSesion(request, env) {
  if (!validarOrigenPrivado(request)) {
    return responder({
      mensaje: "Origen no autorizado."
    }, 403);
  }

  if (
    request.headers.get(
      "X-ICEC-Solicitud"
    ) !== "web"
  ) {
    return responder({
      mensaje:
        "Solicitud no autorizada."
    }, 403);
  }

  if (!env.LOGIN_SESSION_SECRET) {
    return responder({
      mensaje:
        "El inicio de sesión no está configurado."
    }, 503);
  }

  // Comprobar límite antes de validar credenciales.
  const limite = await limitarIntentosLogin(
    request,
    env
  );

  if (limite) {
    return limite;
  }

  let datos;

  try {
    datos = await leerJSON(request);
  } catch {
    return responder({
      mensaje:
        "Solicitud de inicio de sesión no válida."
    }, 400);
  }

  // Turnstile obligatorio
  const verificacion = await verificarTurnstile(
    datos.turnstileToken,
    request,
    env
  );

  if (!verificacion.correcto) {
    return responder({
      mensaje: verificacion.mensaje
    }, verificacion.estado);
  }

  const correo =
    limpiar(datos.correo).toLowerCase();

  const contrasena = datos.contrasena;

  if (
    correo.length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) ||
    typeof contrasena !== "string" ||
    contrasena.length > 128
  ) {
    return responder({
      mensaje:
        "Correo o contraseña incorrectos."
    }, 401);
  }

  const usuario = await env.DB.prepare(
    `SELECT
       id,
       correo,
       contrasena_hash,
       rol,
       activo
     FROM usuarios
     WHERE correo = ?`
  ).bind(
    correo
  ).first();

  const contrasenaCorrecta =
    await verificarContrasena(
      contrasena,
      usuario?.contrasena_hash || ""
    );

  if (
    !usuario ||
    Number(usuario.activo) !== 1 ||
    !contrasenaCorrecta
  ) {
    return responder({
      mensaje:
        "Correo o contraseña incorrectos."
    }, 401);
  }

  const token = await crearTokenSesion(
    usuario.id,
    env
  );

  return respuestaConCookie(
    {
      mensaje:
        "Sesión iniciada correctamente.",
      rol: usuario.rol
    },
    200,
    crearCookieSesion(token)
  );
}

// ==========================================
// CONSULTAR SESIÓN
// ==========================================

async function consultarSesion(request, env) {
  if (!validarOrigenPrivado(request)) {
    return responder({
      mensaje: "Origen no autorizado."
    }, 403);
  }

  const usuario = await usuarioDeSesion(
    request,
    env
  );

  if (!usuario) {
    return responder({
      autenticado: false,
      mensaje:
        "No has iniciado sesión."
    }, 401);
  }

  return responder({
    autenticado: true,
    usuario: {
      id: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
      participanteId: usuario.participante_id,
      nombreCompleto: usuario.nombre_completo
    }
  });
}

// ==========================================
// CERRAR SESIÓN
// ==========================================

function cerrarSesion(request) {
  if (!validarOrigenPrivado(request)) {
    return responder({
      mensaje: "Origen no autorizado."
    }, 403);
  }

  if (
    request.headers.get(
      "X-ICEC-Solicitud"
    ) !== "web"
  ) {
    return responder({
      mensaje: "Solicitud no autorizada."
    }, 403);
  }

  return respuestaConCookie(
    {
      mensaje: "Sesión cerrada."
    },
    200,
    eliminarCookieSesion()
  );
}

// ==========================================
// RUTAS DE LA API
// ==========================================

async function manejarSolicitud(request, env) {
  const url = new URL(request.url);
    // ==========================================
  // ADMINISTRACIÓN DE PAGOS
  // ==========================================



  
  // ==========================================
  // CANCELAR INSCRIPCIÓN - ADMINISTRADORES
  // ==========================================

  const rutaCancelacionAdmin = url.pathname.match(
    /^\/api\/admin\/inscripciones\/([1-9]\d*)\/cancelar$/
  );

  if (rutaCancelacionAdmin) {
    return manejarCancelacionAdmin(
      request,
      env,
      {
        usuarioDeSesion,
        ORIGENES_PERMITIDOS
      },
      rutaCancelacionAdmin[1]
    );
  }
  // ==========================================
  // DETALLE DE INSCRIPCIONES ADMINISTRATIVAS
  // ==========================================


  const rutaDetalleAdmin = url.pathname.match(
    /^\/api\/admin\/inscripciones\/([1-9]\d*)$/
  );

  if (rutaDetalleAdmin) {
    return manejarDetalleAdmin(
      request,
      env,
      {
        usuarioDeSesion,
        ORIGENES_PERMITIDOS
      },
      rutaDetalleAdmin[1]
    );
  }

  
  // ==========================================
  // CONSULTAR COMPROBANTE ADMINISTRATIVO
  // ==========================================

  const rutaComprobanteAdmin = url.pathname.match(
    /^\/api\/admin\/comprobantes\/([1-9]\d*)$/
  );

  if (rutaComprobanteAdmin) {
    return manejarComprobanteAdmin(
      request,
      env,
      {
        usuarioDeSesion,
        ORIGENES_PERMITIDOS
      },
      rutaComprobanteAdmin[1]
    );
  }

  
  // ==========================================
  // COMPROBANTES DE PAGOS EN EFECTIVO
  // SOLO ADMINISTRADORES
  // ==========================================

  const rutaComprobanteEfectivo = url.pathname.match(
    /^\/api\/admin\/pagos\/([1-9]\d*)\/comprobante-efectivo$/
  );

  if (rutaComprobanteEfectivo) {
    return manejarComprobanteEfectivoAdmin(
      request,
      env,
      {
        usuarioDeSesion,
        ORIGENES_PERMITIDOS
      },
      rutaComprobanteEfectivo[1]
    );
  }

  // ==========================================
  // VALIDAR O RECHAZAR PAGOS
  // SOLO ADMINISTRADORES
  // ==========================================

  const rutaValidacionPago = url.pathname.match(
    /^\/api\/admin\/pagos\/([1-9]\d*)\/revision$/
  );

  if (rutaValidacionPago) {
    return manejarValidacionPagoAdmin(
      request,
      env,
      {
        usuarioDeSesion,
        ORIGENES_PERMITIDOS
      },
      rutaValidacionPago[1]
    );
  }


  // ==========================================
  // EXPORTACIÓN ADMINISTRATIVA A EXCEL
  // ==========================================

  if (url.pathname === "/api/admin/exportacion") {
    return manejarExportacion(
      request,
      env,
      {
        usuarioDeSesion,
        ORIGENES_PERMITIDOS
      }
    );
  }

  

  if (url.pathname === "/api/admin/pagos") {
    return manejarPagosAdmin(
      request,
      env,
      {
        usuarioDeSesion,
        ORIGENES_PERMITIDOS
      }
    );
  }
  // ==========================================
  // RESUMEN PRIVADO DE INSCRIPCIÓN
  // ==========================================

  if (url.pathname === "/api/resumen") {
    return manejarResumen(
      request,
      env,
      {
        usuarioDeSesion,
        ORIGENES_PERMITIDOS
      }
    );
  }

    // ==========================================
  // COMPROBANTES DE TRANSFERENCIA
  // ==========================================

  if (url.pathname === "/api/comprobantes") {
    return manejarComprobantes(
      request,
      env,
      {
        usuarioDeSesion,
        ORIGENES_PERMITIDOS
      }
    );
  }

  if (
  url.pathname === "/api/acompanantes" ||
  /^\/api\/acompanantes\/[1-9]\d*$/.test(url.pathname)
) {
  return manejarAcompanantes(
    request,
    env,
    {
      usuarioDeSesion,
      ORIGENES_PERMITIDOS
    },
    url.pathname
  );
}

  // ----------------------------------------
  // ESTADO DEL BACKEND
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

    const tipo =
      request.headers.get("content-type");

    if (
      !tipo?.toLowerCase()
        .startsWith("application/json")
    ) {
      return responder({
        mensaje: "Se requiere JSON."
      }, 415);
    }

    const tamano = Number(
      request.headers.get(
        "content-length"
      ) || 0
    );

    if (tamano > 16384) {
      return responder({
        mensaje:
          "Solicitud demasiado grande."
      }, 413);
    }

    let datos;

    try {
      const cuerpo = await request.text();

      if (
        new TextEncoder()
          .encode(cuerpo).length > 16384
      ) {
        return responder({
          mensaje:
            "Solicitud demasiado grande."
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
        mensaje:
          "Los datos enviados no son válidos."
      }, 400);
    }

    // Registro privado desde Postman.
    const tokenPrivado =
      request.headers.get(
        "X-Registro-Prueba"
      );

    const pruebaAutorizada =
      Boolean(env.REGISTRO_PRUEBA_TOKEN) &&
      Boolean(tokenPrivado) &&
      tokenPrivado ===
        env.REGISTRO_PRUEBA_TOKEN;

    // Registro público protegido por Turnstile.
    if (!pruebaAutorizada) {
      const tokenTurnstile =
        datos.turnstileToken ||
        datos["cf-turnstile-response"];

      const verificacion =
        await verificarTurnstile(
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

    try {
      return await registrarParticipante(
        datos,
        env
      );

    } catch (error) {
      console.error(
        "Fallo inesperado en el registro:",
        error?.message
      );

      return responder({
        mensaje:
          "Error interno del registro."
      }, 500);
    }
  }
  
  // ==========================================
  // CUPOS PÚBLICOS DEL CAMPAMENTO
  // ==========================================

  if (url.pathname === "/api/cupos") {
    if (request.method !== "GET") {
      return responder({
        mensaje: "Método no permitido."
      }, 405);
    }

    if (!env.DB) {
      return responder({
        mensaje: "Base de datos no disponible."
      }, 503);
    }

    const cupos = await env.DB.prepare(
      `SELECT
        (
          SELECT COALESCE(SUM(capacidad), 0)
          FROM habitaciones
          WHERE activa = 1
        ) AS total,
        (
          SELECT COUNT(*)
          FROM asignaciones_habitaciones a
          INNER JOIN habitaciones h
            ON h.id = a.habitacion_id
          WHERE h.activa = 1
        ) + (
          SELECT COUNT(*)
          FROM reservas_especiales r
          INNER JOIN habitaciones h
            ON h.id = r.habitacion_id
          WHERE h.activa = 1
        ) AS ocupados`
    ).first();

    const total = Number(cupos.total);
    const ocupados = Number(cupos.ocupados);

    return responder({
      estado: "OK",
      total,
      ocupados,
      disponibles: Math.max(0, total - ocupados)
    });
  }

  // ==========================================
  // HABITACIONES Y CUPOS DISPONIBLES
  // ==========================================

  if (url.pathname === "/api/habitaciones") {
    return manejarHabitaciones(
      request,
      env,
      {
        usuarioDeSesion,
        ORIGENES_PERMITIDOS
      }
    );
  }
// ==========================================
// BENEFICIO PARA LÍDERES
// ==========================================

if (url.pathname === "/api/lideres/validar") {
  return manejarBeneficioLider(
    request,
    env,
    {
      usuarioDeSesion,
      ORIGENES_PERMITIDOS
    }
  );
}
// ==========================================
// SOLICITAR RECUPERACIÓN DE CONTRASEÑA
// ==========================================

if (url.pathname === "/api/recuperar-contrasena") {
    if (request.method !== "POST") {
        return responder({
            mensaje: "Método no permitido."
        }, 405);
    }
if (
    !validarOrigenPrivado(request) ||
    request.headers.get("X-ICEC-Solicitud") !== "web"
) {
    return responder({
        mensaje: "Solicitud no autorizada."
    }, 403);
}
    const datos = await request.clone().json().catch(() => null);

const verificacion = await verificarTurnstile(
    datos?.turnstileToken,
    request,
    env
);

if (!verificacion.correcto) {
    return responder({
        mensaje: verificacion.mensaje
    }, verificacion.estado);
}

return solicitarRecuperacion(request, env);
}

// ==========================================
// GUARDAR NUEVA CONTRASEÑA
// ==========================================

if (url.pathname === "/api/nueva-contrasena") {
    if (request.method !== "POST") {
        return responder({
            mensaje: "Método no permitido."
        }, 405);
    }
if (
    !validarOrigenPrivado(request) ||
    request.headers.get("X-ICEC-Solicitud") !== "web"
) {
    return responder({
        mensaje: "Solicitud no autorizada."
    }, 403);
}
    return guardarNuevaContrasena(request, env);
}
  // ----------------------------------------
  // INICIAR SESIÓN
  // ----------------------------------------

  if (url.pathname === "/api/login") {
    if (request.method !== "POST") {
      return responder({
        mensaje: "Método no permitido."
      }, 405);
    }

    return iniciarSesion(request, env);
  }

  // ----------------------------------------
  // CONSULTAR SESIÓN
  // ----------------------------------------

  if (url.pathname === "/api/sesion") {
    if (request.method !== "GET") {
      return responder({
        mensaje: "Método no permitido."
      }, 405);
    }

    return consultarSesion(request, env);
  }

  // ----------------------------------------
  // CERRAR SESIÓN
  // ----------------------------------------

  if (url.pathname === "/api/logout") {
    if (request.method !== "POST") {
      return responder({
        mensaje: "Método no permitido."
      }, 405);
    }

    return cerrarSesion(request);
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

    // Responder a solicitudes CORS.
    if (request.method === "OPTIONS") {
      const origen =
        request.headers.get("Origin");

      if (
        !ORIGENES_PERMITIDOS.includes(origen)
      ) {
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
          mensaje:
            "Error interno del servidor."
        }, 500),
        request
      );
    }
  }
};
