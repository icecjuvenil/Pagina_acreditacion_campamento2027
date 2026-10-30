
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

>>>>>>> 2ada3b262e5a642b4995470ac1b7b81dc93021c3
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/api/estado") {
      return new Response("Ruta no encontrada", {
        status: 404
      });
    }

    try {
      const resultado = await env.DB.prepare(
        "SELECT COUNT(*) AS total FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
      ).first();

      return Response.json({
        estado: "OK",
        baseDatos: "Conectada",
        tablas: resultado.total
      });
    } catch (error) {
      console.error("Error al consultar D1:", error);

      return Response.json({
        estado: "ERROR",
        baseDatos: "No disponible"
      }, { status: 500 });
    }
  }
};
