
/*
 * Campamento Juvenil ICEC 2027
 * Cloudflare Workers + D1
 * Registro privado de prueba del participante principal
 */

const FECHA_CAMPAMENTO = "2027-01-08";

function responder(datos, estado = 200) {
  return Response.json(datos, {
    status: estado,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

function limpiar(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}

function textoValido(valor, maximo, obligatorio = true) {
  if (valor === undefined || valor === null || valor === "") {
    return !obligatorio;
  }

  return typeof valor === "string" &&
    valor.trim().length <= maximo &&
    (!obligatorio || valor.trim().length > 0);
}

function validarTelefono(valor, obligatorio = true) {
  if (!obligatorio && !valor) return true;
  if (typeof valor !== "string") return false;

  const texto = valor.trim();
  const digitos = texto.replace(/\D/g, "");

  return /^\+?[\d\s()-]{8,20}$/.test(texto) &&
    digitos.length >= 8 &&
    digitos.length <= 15;
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
  const esperado = resultado === 11
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
    datos.contrasena.length < 12 ||
    datos.contrasena.length > 128
  ) {
    return "La contraseña debe tener entre 12 y 128 caracteres.";
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

async function crearHashContrasena(contrasena) {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));

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

  const hex = (bytes) => Array.from(bytes)
    .map(n => n.toString(16).padStart(2, "0"))
    .join("");

  return [
    "pbkdf2_sha256",
    iteraciones,
    hex(salt),
    hex(new Uint8Array(hash))
  ].join("$");
}

async function registrarParticipante(datos, env) {
  const error = validarDatos(datos);

  if (error) {
    return responder({ mensaje: error }, 400);
  }

  const correo = limpiar(datos.correo).toLowerCase();
  const rut = normalizarRut(datos.rut);
  const genero = limpiar(datos.genero).toUpperCase();

  // Evitar duplicados conocidos.
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

  const bandera = (valor) => valor === "si" ? 1 : 0;

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

  /*
   * El lote es atómico: se completan todas
   * las inserciones o no se guarda ninguna.
   */
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
           usuario_id, nombre_completo, alias, rut,
           fecha_nacimiento, genero, telefono,
           valor_acreditacion
         )
         SELECT
           id, ?, ?, ?, ?, ?, ?, ?
         FROM usuarios WHERE correo = ?`
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
           tiene_alergias, detalle_alergias,
           tiene_enfermedad, detalle_enfermedad,
           toma_medicamentos, detalle_medicamentos,
           restriccion_alimentaria, detalle_alimentacion
         )
         SELECT
           (${idParticipante}),
           ?, ?, ?, ?, ?, ?, ?, ?`
      ).bind(
        correo,
        bandera(datos.tieneAlergias),
        detalle("tieneAlergias", "detalleAlergias"),
        bandera(datos.tieneEnfermedad),
        detalle("tieneEnfermedad", "detalleEnfermedad"),
        bandera(datos.tomaMedicamentos),
        detalle("tomaMedicamentos", "detalleMedicamentos"),
        bandera(datos.restriccionAlimentaria),
        detalle(
          "restriccionAlimentaria",
          "detalleAlimentacion"
        )
      ),

      env.DB.prepare(
        `INSERT INTO contactos_emergencia
         (
           participante_id, nombre_completo,
           parentesco, telefono_principal,
           telefono_alternativo
         )
         SELECT (${idParticipante}), ?, ?, ?, ?`
      ).bind(
        correo,
        limpiar(datos.nombreEmergencia),
        datos.parentesco,
        limpiar(datos.telefonoEmergencia),
        limpiar(datos.telefonoAlternativo) || null
      ),

      env.DB.prepare(
        `INSERT INTO pagos
         (participante_id, monto_total, monto_pagado, estado)
         SELECT id, ?, 0, 'PENDIENTE'
         FROM participantes
         WHERE usuario_id = (
           SELECT id FROM usuarios WHERE correo = ?
         )`
      ).bind(monto, correo)
    ]);

    return responder({
      mensaje: "Inscripción de prueba registrada correctamente.",
      estado: "REGISTRADA",
      montoTotal: monto,
      pago: "PENDIENTE",
      acompanantesPendientes:
        datos.tieneAcompanantes === "si"
    }, 201);

  } catch (error) {
    console.error("Error al registrar participante");

    const mensaje = String(error?.message || "");

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
// RUTAS
// ==========================================

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Comprobación de conexión D1.
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
        return responder({
          estado: "ERROR",
          baseDatos: "No disponible"
        }, 500);
      }
    }

    // Registro privado para pruebas.
    if (url.pathname === "/api/registro") {
      if (request.method !== "POST") {
        return responder({
          mensaje: "Método no permitido."
        }, 405);
      }

      // Sin secreto configurado, no se registra nadie.
      if (!env.REGISTRO_PRUEBA_TOKEN) {
        return responder({
          mensaje: "Registro deshabilitado."
        }, 503);
      }

      const token = request.headers.get(
        "X-Registro-Prueba"
      );

      if (!token || token !== env.REGISTRO_PRUEBA_TOKEN) {
        return responder({
          mensaje: "Acceso no autorizado."
        }, 403);
      }

      if (
        !request.headers.get("content-type")
          ?.toLowerCase()
          .startsWith("application/json")
      ) {
        return responder({
          mensaje: "Se requiere JSON."
        }, 415);
      }

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

        if (cuerpo.length > 16384) {
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

      try {
        return await registrarParticipante(datos, env);
      
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
};
