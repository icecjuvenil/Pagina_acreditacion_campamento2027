
/*
 * ICEC Campamento Juvenil 2027
 * Backend Cloudflare Workers + D1
 *
 * Etapa actual:
 * - Validación de inscripciones
 * - Protección de contraseñas
 * - Comprobación de conexión D1
 *
 * El guardado de inscripciones permanece deshabilitado.
 */

// ==========================================
// 1. UTILIDADES
// ==========================================

function responderJSON(datos, estado = 200) {
  return Response.json(datos, {
    status: estado,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

function textoValido(valor, maximo, obligatorio = true) {
  if (valor === undefined || valor === null) {
    return !obligatorio;
  }

  if (typeof valor !== "string") {
    return false;
  }

  const texto = valor.trim();

  if (obligatorio && texto.length === 0) {
    return false;
  }

  return texto.length <= maximo;
}

function respuestaSiNo(valor) {
  return valor === "si" || valor === "no";
}

// ==========================================
// 2. PROTECCIÓN DE CONTRASEÑAS
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

  const iteraciones = 210000;

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

  const convertirHex = (bytes) =>
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

// ==========================================
// 3. VALIDACIÓN DEL RUT CHILENO
// ==========================================

function normalizarRut(rut) {
  if (typeof rut !== "string") {
    return "";
  }

  return rut
    .replace(/\./g, "")
    .replace(/-/g, "")
    .replace(/\s/g, "")
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
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador;

    multiplicador =
      multiplicador === 7 ? 2 : multiplicador + 1;
  }

  const resultado = 11 - (suma % 11);

  const esperado =
    resultado === 11 ? "0" :
    resultado === 10 ? "K" :
    String(resultado);

  return verificador === esperado;
}

// ==========================================
// 4. VALIDACIÓN DE FECHAS
// ==========================================

function validarFechaNacimiento(fecha) {
  if (
    typeof fecha !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
  ) {
    return false;
  }

  const nacimiento = new Date(
    fecha + "T00:00:00Z"
  );

  if (
    Number.isNaN(nacimiento.getTime()) ||
    nacimiento.toISOString().slice(0, 10) !== fecha
  ) {
    return false;
  }

  const hoy = new Date();
  const fechaActual = hoy.toISOString().slice(0, 10);

  const inicioCampamento = "2027-01-08";

  return (
    fecha <= fechaActual &&
    fecha <= inicioCampamento
  );
}

// ==========================================
// 5. VALIDACIÓN DE TELÉFONOS
// ==========================================

function validarTelefono(telefono, obligatorio = true) {
  if (!obligatorio &&
      (telefono === undefined ||
       telefono === null ||
       telefono === "")) {
    return true;
  }

  if (typeof telefono !== "string") {
    return false;
  }

  const limpio = telefono.trim();

  if (!/^\+?[\d\s()-]{8,20}$/.test(limpio)) {
    return false;
  }

  const digitos = limpio.replace(/\D/g, "");

  return digitos.length >= 8 &&
         digitos.length <= 15;
}

// ==========================================
// 6. VALIDACIÓN DE INFORMACIÓN MÉDICA
// ==========================================

function validarInformacionMedica(datos) {
  const preguntas = [
    {
      respuesta: "tieneAlergias",
      detalle: "detalleAlergias",
      mensaje: "alergias"
    },
    {
      respuesta: "tieneEnfermedad",
      detalle: "detalleEnfermedad",
      mensaje: "condiciones médicas"
    },
    {
      respuesta: "tomaMedicamentos",
      detalle: "detalleMedicamentos",
      mensaje: "medicamentos"
    },
    {
      respuesta: "restriccionAlimentaria",
      detalle: "detalleAlimentacion",
      mensaje: "restricciones alimentarias"
    }
  ];

  for (const pregunta of preguntas) {
    const respuesta = datos[pregunta.respuesta];
    const detalle = datos[pregunta.detalle];

    if (!respuestaSiNo(respuesta)) {
      return `Selecciona una respuesta para ${pregunta.mensaje}.`;
    }

    if (
      respuesta === "si" &&
      !textoValido(detalle, 500, true)
    ) {
      return `Debes completar el detalle de ${pregunta.mensaje}.`;
    }

    if (
      respuesta === "no" &&
      !textoValido(detalle, 500, false)
    ) {
      return `El detalle de ${pregunta.mensaje} no es válido.`;
    }
  }

  return null;
}

// ==========================================
// 7. VALIDACIÓN DEL CONTACTO DE EMERGENCIA
// ==========================================

function validarContactoEmergencia(datos) {
  if (!textoValido(datos.nombreEmergencia, 150)) {
    return "Ingresa el nombre del contacto de emergencia.";
  }

  const parentescosPermitidos = [
    "madre-padre",
    "tutor",
    "hermano",
    "pareja",
    "otro"
  ];

  if (!parentescosPermitidos.includes(datos.parentesco)) {
    return "Selecciona un parentesco válido.";
  }

  if (!validarTelefono(datos.telefonoEmergencia)) {
    return "El teléfono de emergencia no es válido.";
  }

  if (!validarTelefono(datos.telefonoAlternativo, false)) {
    return "El teléfono alternativo no es válido.";
  }

  return null;
}

// ==========================================
// 8. VALIDACIÓN COMPLETA DEL REGISTRO
// ==========================================

function validarDatosRegistro(datos) {
  if (
    !datos ||
    typeof datos !== "object" ||
    Array.isArray(datos)
  ) {
    return "Los datos del registro no son válidos.";
  }

  // Cuenta
  if (
    typeof datos.correo !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      datos.correo.trim()
    ) ||
    datos.correo.trim().length > 150
  ) {
    return "Ingresa un correo electrónico válido.";
  }

  if (
    typeof datos.contrasena !== "string" ||
    datos.contrasena.length < 12 ||
    datos.contrasena.length > 128
  ) {
    return "La contraseña debe tener entre 12 y 128 caracteres.";
  }

  // Datos personales
  if (!textoValido(datos.nombreCompleto, 150)) {
    return "Ingresa un nombre completo válido.";
  }

  if (!textoValido(datos.alias, 40, false)) {
    return "El alias no puede superar los 40 caracteres.";
  }

  if (!validarRut(datos.rut)) {
    return "El RUT ingresado no es válido.";
  }

  const genero = typeof datos.genero === "string"
    ? datos.genero.trim().toUpperCase()
    : "";

  if (!["MASCULINO", "FEMENINO"].includes(genero)) {
    return "Selecciona un género válido.";
  }

  if (!validarFechaNacimiento(datos.fechaNacimiento)) {
    return "La fecha de nacimiento no es válida.";
  }

  if (!validarTelefono(datos.telefono)) {
    return "Ingresa un teléfono válido.";
  }

  // Información médica
  const errorMedico = validarInformacionMedica(datos);

  if (errorMedico) {
    return errorMedico;
  }

  // Contacto de emergencia
  const errorEmergencia =
    validarContactoEmergencia(datos);

  if (errorEmergencia) {
    return errorEmergencia;
  }

  // Acompañantes
  if (!respuestaSiNo(datos.tieneAcompanantes)) {
    return "Indica si asistirás con acompañantes.";
  }

  // Confirmación
  const confirmacionValida =
    datos.confirmaInformacion === true ||
    datos.confirmaInformacion === "on";

  if (!confirmacionValida) {
    return "Debes confirmar la información ingresada.";
  }

  return null;
}

// ==========================================
// 9. RUTAS DEL WORKER
// ==========================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Consulta de estado
    if (url.pathname === "/api/estado") {
      if (request.method !== "GET") {
        return responderJSON(
          { mensaje: "Método no permitido." },
          405
        );
      }

      try {
        const resultado = await env.DB.prepare(
          `SELECT COUNT(*) AS total
           FROM sqlite_master
           WHERE type = 'table'
           AND name NOT LIKE 'sqlite_%'`
        ).first();

        return responderJSON({
          estado: "OK",
          baseDatos: "Conectada",
          tablas: resultado.total
        });
      } catch (error) {
        console.error("Error al consultar D1:", error);

        return responderJSON({
          estado: "ERROR",
          baseDatos: "No disponible"
        }, 500);
      }
    }

    // Registro de participantes
    if (url.pathname === "/api/registro") {
      if (request.method !== "POST") {
        return responderJSON(
          { mensaje: "Método no permitido." },
          405
        );
      }

      /*
       * El registro sigue deshabilitado.
       *
       * Antes de guardar datos debemos implementar:
       * - Protección contra registros abusivos.
       * - Comprobación de duplicados.
       * - Inserciones atómicas en D1.
       * - Gestión de sesiones y permisos.
       * - Controles de protección de datos médicos.
       * - Guardado de acompañantes y pagos.
       */

      return responderJSON({
        mensaje: "El registro todavía no está habilitado.",
        registroHabilitado: false
      }, 503);
    }

    // Cualquier otra ruta
    return responderJSON({
      mensaje: "Ruta no encontrada."
    }, 404);
  }
};
