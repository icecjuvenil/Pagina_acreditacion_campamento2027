var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// acompanantes-api.js
var MAX_ACOMPANANTES = 20;
var FECHA_CAMPAMENTO_ACOMP = "2027-01-08";
function respuesta(datos, estado = 200) {
  return Response.json(datos, {
    status: estado,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
__name(respuesta, "respuesta");
function texto(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}
__name(texto, "texto");
function normalizarRut(valor) {
  return texto(valor).replace(/[.\-\s]/g, "").toUpperCase();
}
__name(normalizarRut, "normalizarRut");
function validarRut(valor) {
  const rut = normalizarRut(valor);
  if (!/^\d{7,8}[0-9K]$/.test(rut)) {
    return false;
  }
  let suma = 0;
  let factor = 2;
  for (let i = rut.length - 2; i >= 0; i--) {
    suma += Number(rut[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const resto = 11 - suma % 11;
  const dv = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return dv === rut.slice(-1);
}
__name(validarRut, "validarRut");
function validarFecha(fecha) {
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false;
  }
  const fechaObjeto = /* @__PURE__ */ new Date(
    fecha + "T00:00:00Z"
  );
  if (Number.isNaN(fechaObjeto.getTime()) || fechaObjeto.toISOString().slice(0, 10) !== fecha) {
    return false;
  }
  const hoy = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return fecha <= hoy && fecha <= FECHA_CAMPAMENTO_ACOMP;
}
__name(validarFecha, "validarFecha");
function calcularValor(fecha) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  let edad = 2027 - anio;
  if (mes > 1 || mes === 1 && dia > 8) {
    edad--;
  }
  if (edad <= 5) return 0;
  if (edad <= 10) return 1e4;
  return 2e4;
}
__name(calcularValor, "calcularValor");
function validarTelefono(valor, obligatorio = true) {
  if (!obligatorio && !texto(valor)) {
    return true;
  }
  const telefono = texto(valor);
  const digitos = telefono.replace(/\D/g, "");
  return /^\+?[\d\s()-]{8,20}$/.test(telefono) && digitos.length >= 8 && digitos.length <= 15;
}
__name(validarTelefono, "validarTelefono");
function validarDatos(datos) {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return "Los datos enviados no son v\xE1lidos.";
  }
  if (!texto(datos.nombre) || texto(datos.nombre).length > 150) {
    return "Nombre completo no v\xE1lido.";
  }
  if (!validarRut(datos.rut)) {
    return "RUT no v\xE1lido.";
  }
  if (!validarFecha(datos.fechaNacimiento)) {
    return "Fecha de nacimiento no v\xE1lida.";
  }
  const genero = texto(datos.genero).toLowerCase();
  if (genero !== "masculino" && genero !== "femenino") {
    return "G\xE9nero no v\xE1lido.";
  }
  if (!validarTelefono(datos.telefono)) {
    return "Tel\xE9fono no v\xE1lido.";
  }
  const correo = texto(datos.correo).toLowerCase();
  if (correo && (correo.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo))) {
    return "Correo electr\xF3nico no v\xE1lido.";
  }
  const preguntasMedicas = [
    ["tieneAlergias", "detalleAlergias"],
    ["tieneEnfermedad", "detalleEnfermedad"],
    ["tomaMedicamentos", "detalleMedicamentos"],
    [
      "restriccionAlimentaria",
      "detalleAlimentacion"
    ]
  ];
  for (const [pregunta, detalle2] of preguntasMedicas) {
    if (datos[pregunta] !== "si" && datos[pregunta] !== "no") {
      return `Debes responder ${pregunta}.`;
    }
    if (datos[pregunta] === "si" && !texto(datos[detalle2])) {
      return `Debes completar ${detalle2}.`;
    }
    if (texto(datos[detalle2]).length > 500) {
      return `El campo ${detalle2} supera el l\xEDmite.`;
    }
  }
  if (!texto(datos.nombreEmergencia) || texto(datos.nombreEmergencia).length > 150) {
    return "Nombre del contacto de emergencia no v\xE1lido.";
  }
  const parentescosPermitidos = [
    "madre-padre",
    "tutor-tutora",
    "hermano-hermana",
    "pareja",
    "otro"
  ];
  if (!parentescosPermitidos.includes(
    datos.relacionEmergencia
  )) {
    return "Parentesco de emergencia no v\xE1lido.";
  }
  if (!validarTelefono(datos.telefonoEmergencia)) {
    return "Tel\xE9fono de emergencia no v\xE1lido.";
  }
  if (!validarTelefono(
    datos.telefonoAlternativo,
    false
  )) {
    return "Tel\xE9fono alternativo no v\xE1lido.";
  }
  return null;
}
__name(validarDatos, "validarDatos");
function indicador(valor) {
  return valor === "si" ? 1 : 0;
}
__name(indicador, "indicador");
function detalle(datos, pregunta, campo) {
  return datos[pregunta] === "si" ? texto(datos[campo]) : null;
}
__name(detalle, "detalle");
async function comprobarPermisos(request, env, dependencias) {
  const origen = request.headers.get("Origin");
  if (!dependencias.ORIGENES_PERMITIDOS.includes(
    origen
  )) {
    return {
      error: respuesta({
        mensaje: "Origen no autorizado."
      }, 403)
    };
  }
  if (request.method !== "GET" && request.headers.get(
    "X-ICEC-Solicitud"
  ) !== "web") {
    return {
      error: respuesta({
        mensaje: "Solicitud no autorizada."
      }, 403)
    };
  }
  const usuario = await dependencias.usuarioDeSesion(
    request,
    env
  );
  if (!usuario || usuario.rol !== "PARTICIPANTE" || !Number.isSafeInteger(
    Number(usuario.participante_id)
  ) || Number(usuario.participante_id) <= 0) {
    return {
      error: respuesta({
        mensaje: "Debes iniciar sesi\xF3n como participante."
      }, 401)
    };
  }
  return {
    participanteId: Number(
      usuario.participante_id
    )
  };
}
__name(comprobarPermisos, "comprobarPermisos");
async function obtenerLista(env, participanteId) {
  return env.DB.prepare(
    `SELECT
       id,
       nombre_completo AS nombre,
       rut,
       fecha_nacimiento AS fechaNacimiento,
       genero,
       telefono,
       correo,
       valor_acreditacion AS valorAcreditacion
     FROM acompanantes
     WHERE participante_id = ?
     ORDER BY id`
  ).bind(participanteId).all();
}
__name(obtenerLista, "obtenerLista");
async function obtenerTotal(env, participanteId) {
  const resultado = await env.DB.prepare(
    `SELECT
       p.valor_acreditacion +
       COALESCE((
         SELECT SUM(a.valor_acreditacion)
         FROM acompanantes a
         WHERE a.participante_id = p.id
       ), 0) AS total
     FROM participantes p
     WHERE p.id = ?`
  ).bind(participanteId).first();
  return Number(resultado?.total || 0);
}
__name(obtenerTotal, "obtenerTotal");
async function obtenerPago(env, participanteId) {
  return env.DB.prepare(
    `SELECT
       id,
       estado,
       monto_pagado
     FROM pagos
     WHERE participante_id = ?
     ORDER BY id DESC
     LIMIT 1`
  ).bind(participanteId).first();
}
__name(obtenerPago, "obtenerPago");
function pagoEditable(pago) {
  return pago?.estado === "PENDIENTE" && Number(pago.monto_pagado) === 0;
}
__name(pagoEditable, "pagoEditable");
async function obtenerResumen(env, participanteId, mensaje = null, estado = 200) {
  const lista = await obtenerLista(
    env,
    participanteId
  );
  const montoTotal = await obtenerTotal(
    env,
    participanteId
  );
  const datos = {
    acompanantes: lista.results,
    montoTotal
  };
  if (mensaje) {
    datos.mensaje = mensaje;
  }
  return respuesta(datos, estado);
}
__name(obtenerResumen, "obtenerResumen");
async function leerDatos(request) {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    throw new Error("TIPO_INVALIDO");
  }
  const cuerpo = await request.text();
  if (new TextEncoder().encode(cuerpo).length > 8192) {
    throw new Error("TAMANO_INVALIDO");
  }
  const datos = JSON.parse(cuerpo);
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    throw new Error("JSON_INVALIDO");
  }
  return datos;
}
__name(leerDatos, "leerDatos");
async function registrarAcompanante(request, env, participanteId) {
  let datos;
  try {
    datos = await leerDatos(request);
  } catch (error) {
    if (error.message === "TIPO_INVALIDO") {
      return respuesta({
        mensaje: "Se requiere JSON."
      }, 415);
    }
    if (error.message === "TAMANO_INVALIDO") {
      return respuesta({
        mensaje: "Solicitud demasiado grande."
      }, 413);
    }
    return respuesta({
      mensaje: "JSON no v\xE1lido."
    }, 400);
  }
  const errorValidacion = validarDatos(datos);
  if (errorValidacion) {
    return respuesta({
      mensaje: errorValidacion
    }, 400);
  }
  const pago = await obtenerPago(
    env,
    participanteId
  );
  if (!pagoEditable(pago)) {
    return respuesta({
      mensaje: "No puedes agregar acompa\xF1antes porque el pago ya est\xE1 en revisi\xF3n o procesado."
    }, 409);
  }
  const rut = normalizarRut(datos.rut);
  const correo = texto(datos.correo).toLowerCase();
  const genero = texto(datos.genero).toUpperCase();
  const valor = calcularValor(
    datos.fechaNacimiento
  );
  const condicionDisponible = `
    EXISTS (
      SELECT 1
      FROM pagos pg
      WHERE pg.id = ?
        AND pg.participante_id = ?
        AND pg.estado = 'PENDIENTE'
        AND pg.monto_pagado = 0
    )
    AND (
      SELECT COUNT(*)
      FROM acompanantes a
      WHERE a.participante_id = ?
    ) < ?
    AND NOT EXISTS (
      SELECT 1
      FROM participantes p
      WHERE p.rut = ?
    )
    AND NOT EXISTS (
      SELECT 1
      FROM acompanantes a
      WHERE a.rut = ?
    )
  `;
  try {
    await env.DB.batch([
      // 1. Datos personales.
      // nombre_completo es NOT NULL.
      // La operación falla si la condición
      // de autorización deja de cumplirse.
      env.DB.prepare(
        `INSERT INTO acompanantes (
          participante_id,
          nombre_completo,
          rut,
          fecha_nacimiento,
          genero,
          telefono,
          correo,
          valor_acreditacion
        )
        SELECT
          ?,
          CASE
            WHEN ${condicionDisponible}
            THEN ?
            ELSE NULL
          END,
          ?, ?, ?, ?, ?, ?`
      ).bind(
        participanteId,
        pago.id,
        participanteId,
        participanteId,
        MAX_ACOMPANANTES,
        rut,
        rut,
        texto(datos.nombre),
        rut,
        datos.fechaNacimiento,
        genero,
        texto(datos.telefono),
        correo || null,
        valor
      ),
      // 2. Información médica.
      env.DB.prepare(
        `INSERT INTO informacion_medica (
          acompanante_id,
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
          a.id,
          ?, ?, ?, ?, ?, ?, ?, ?
        FROM acompanantes a
        WHERE a.participante_id = ?
          AND a.rut = ?`
      ).bind(
        indicador(datos.tieneAlergias),
        detalle(
          datos,
          "tieneAlergias",
          "detalleAlergias"
        ),
        indicador(datos.tieneEnfermedad),
        detalle(
          datos,
          "tieneEnfermedad",
          "detalleEnfermedad"
        ),
        indicador(datos.tomaMedicamentos),
        detalle(
          datos,
          "tomaMedicamentos",
          "detalleMedicamentos"
        ),
        indicador(datos.restriccionAlimentaria),
        detalle(
          datos,
          "restriccionAlimentaria",
          "detalleAlimentacion"
        ),
        participanteId,
        rut
      ),
      // 3. Contacto de emergencia.
      env.DB.prepare(
        `INSERT INTO contactos_emergencia (
          acompanante_id,
          nombre_completo,
          parentesco,
          telefono_principal,
          telefono_alternativo
        )
        SELECT
          a.id,
          ?, ?, ?, ?
        FROM acompanantes a
        WHERE a.participante_id = ?
          AND a.rut = ?`
      ).bind(
        texto(datos.nombreEmergencia),
        datos.relacionEmergencia,
        texto(datos.telefonoEmergencia),
        texto(datos.telefonoAlternativo) || null,
        participanteId,
        rut
      ),
      // 4. Recalcular el monto del pago
      // sin modificar dinero ya pagado.
      env.DB.prepare(
        `UPDATE pagos
         SET monto_total = (
           SELECT
             p.valor_acreditacion +
             COALESCE((
               SELECT SUM(a.valor_acreditacion)
               FROM acompanantes a
               WHERE a.participante_id = p.id
             ), 0)
           FROM participantes p
           WHERE p.id = ?
         )
         WHERE id = ?
           AND participante_id = ?
           AND estado = 'PENDIENTE'
           AND monto_pagado = 0`
      ).bind(
        participanteId,
        pago.id,
        participanteId
      )
    ]);
  } catch (error) {
    console.error(
      "Error en registro de acompa\xF1ante:",
      error?.message
    );
    const mensaje = String(
      error?.message || ""
    );
    if (mensaje.includes("UNIQUE") || mensaje.includes("NOT NULL") || mensaje.includes("CONSTRAINT")) {
      return respuesta({
        mensaje: "No se pudo registrar el acompa\xF1ante. Comprueba que el RUT no est\xE9 repetido y que el pago siga pendiente."
      }, 409);
    }
    return respuesta({
      mensaje: "No fue posible registrar el acompa\xF1ante."
    }, 500);
  }
  return obtenerResumen(
    env,
    participanteId,
    "Acompa\xF1ante registrado correctamente.",
    201
  );
}
__name(registrarAcompanante, "registrarAcompanante");
async function eliminarAcompanante(env, participanteId, acompananteId) {
  const pago = await obtenerPago(
    env,
    participanteId
  );
  if (!pagoEditable(pago)) {
    return respuesta({
      mensaje: "No se puede eliminar un acompa\xF1ante con el pago en revisi\xF3n o procesado."
    }, 409);
  }
  const acompanante = await env.DB.prepare(
    `SELECT id
     FROM acompanantes
     WHERE id = ?
       AND participante_id = ?`
  ).bind(
    acompananteId,
    participanteId
  ).first();
  if (!acompanante) {
    return respuesta({
      mensaje: "Acompa\xF1ante no encontrado."
    }, 404);
  }
  const pagoPendiente = `
    EXISTS (
      SELECT 1
      FROM pagos pg
      WHERE pg.id = ?
        AND pg.participante_id = ?
        AND pg.estado = 'PENDIENTE'
        AND pg.monto_pagado = 0
    )
  `;
  let resultados;
  try {
    resultados = await env.DB.batch([
      // Eliminar información médica.
      env.DB.prepare(
        `DELETE FROM informacion_medica
         WHERE acompanante_id = ?
           AND ${pagoPendiente}
           AND EXISTS (
             SELECT 1
             FROM acompanantes a
             WHERE a.id = ?
               AND a.participante_id = ?
           )`
      ).bind(
        acompananteId,
        pago.id,
        participanteId,
        acompananteId,
        participanteId
      ),
      // Eliminar contacto de emergencia.
      env.DB.prepare(
        `DELETE FROM contactos_emergencia
         WHERE acompanante_id = ?
           AND ${pagoPendiente}
           AND EXISTS (
             SELECT 1
             FROM acompanantes a
             WHERE a.id = ?
               AND a.participante_id = ?
           )`
      ).bind(
        acompananteId,
        pago.id,
        participanteId,
        acompananteId,
        participanteId
      ),
      // Eliminar acompañante únicamente
      // si el pago continúa pendiente.
      env.DB.prepare(
        `DELETE FROM acompanantes
         WHERE id = ?
           AND participante_id = ?
           AND ${pagoPendiente}`
      ).bind(
        acompananteId,
        participanteId,
        pago.id,
        participanteId
      ),
      // Recalcular total del pago.
      env.DB.prepare(
        `UPDATE pagos
         SET monto_total = (
           SELECT
             p.valor_acreditacion +
             COALESCE((
               SELECT SUM(a.valor_acreditacion)
               FROM acompanantes a
               WHERE a.participante_id = p.id
             ), 0)
           FROM participantes p
           WHERE p.id = ?
         )
         WHERE id = ?
           AND participante_id = ?
           AND estado = 'PENDIENTE'
           AND monto_pagado = 0`
      ).bind(
        participanteId,
        pago.id,
        participanteId
      )
    ]);
  } catch (error) {
    console.error(
      "Error al eliminar acompa\xF1ante:",
      error?.message
    );
    return respuesta({
      mensaje: "No fue posible eliminar el acompa\xF1ante."
    }, 500);
  }
  const eliminados = Number(
    resultados?.[2]?.meta?.changes || 0
  );
  if (eliminados !== 1) {
    return respuesta({
      mensaje: "No se elimin\xF3 el acompa\xF1ante. Verifica el estado del pago."
    }, 409);
  }
  return obtenerResumen(
    env,
    participanteId,
    "Acompa\xF1ante eliminado correctamente."
  );
}
__name(eliminarAcompanante, "eliminarAcompanante");
async function manejarAcompanantes(request, env, dependencias, pathname) {
  const permiso = await comprobarPermisos(
    request,
    env,
    dependencias
  );
  if (permiso.error) {
    return permiso.error;
  }
  const participanteId = permiso.participanteId;
  if (pathname === "/api/acompanantes" && request.method === "GET") {
    return obtenerResumen(
      env,
      participanteId
    );
  }
  if (pathname === "/api/acompanantes" && request.method === "POST") {
    return registrarAcompanante(
      request,
      env,
      participanteId
    );
  }
  const coincidencia = pathname.match(
    /^\/api\/acompanantes\/([1-9]\d*)$/
  );
  if (coincidencia && request.method === "DELETE") {
    const acompananteId = Number(
      coincidencia[1]
    );
    if (!Number.isSafeInteger(acompananteId)) {
      return respuesta({
        mensaje: "Identificador no v\xE1lido."
      }, 400);
    }
    return eliminarAcompanante(
      env,
      participanteId,
      acompananteId
    );
  }
  return respuesta({
    mensaje: "M\xE9todo no permitido."
  }, 405);
}
__name(manejarAcompanantes, "manejarAcompanantes");

// worker.js
var FECHA_CAMPAMENTO = "2027-01-08";
var DURACION_SESION_SEGUNDOS = 8 * 60 * 60;
var NOMBRE_COOKIE_SESION = "icec_sesion";
var VENTANA_LOGIN_SEGUNDOS = 15 * 60;
var MAX_INTENTOS_LOGIN = 8;
var URL_TURNSTILE = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
var ORIGENES_PERMITIDOS = [
  "http://localhost:5500",
  "http://127.0.0.1:5500",
  "http://localhost:5501",
  "http://127.0.0.1:5501"
];
function responder(datos, estado = 200) {
  return Response.json(datos, {
    status: estado,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}
__name(responder, "responder");
function respuestaConCookie(datos, estado, cookie) {
  const respuesta2 = responder(datos, estado);
  respuesta2.headers.set("Set-Cookie", cookie);
  return respuesta2;
}
__name(respuestaConCookie, "respuestaConCookie");
function limpiar(valor) {
  return typeof valor === "string" ? valor.trim() : "";
}
__name(limpiar, "limpiar");
function textoValido(valor, maximo, obligatorio = true) {
  if (valor === void 0 || valor === null || valor === "") {
    return !obligatorio;
  }
  return typeof valor === "string" && valor.trim().length <= maximo && (!obligatorio || valor.trim().length > 0);
}
__name(textoValido, "textoValido");
function validarTelefono2(valor, obligatorio = true) {
  if (!obligatorio && !valor) return true;
  if (typeof valor !== "string") return false;
  const texto2 = valor.trim();
  const digitos = texto2.replace(/\D/g, "");
  return /^\+?[\d\s()-]{8,20}$/.test(texto2) && digitos.length >= 8 && digitos.length <= 15;
}
__name(validarTelefono2, "validarTelefono");
function normalizarRut2(rut) {
  return limpiar(rut).replace(/[.\-\s]/g, "").toUpperCase();
}
__name(normalizarRut2, "normalizarRut");
function validarRut2(rut) {
  const limpio = normalizarRut2(rut);
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
  const resultado = 11 - suma % 11;
  const esperado = resultado === 11 ? "0" : resultado === 10 ? "K" : String(resultado);
  return verificador === esperado;
}
__name(validarRut2, "validarRut");
function validarFecha2(fecha) {
  if (typeof fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false;
  }
  const valor = /* @__PURE__ */ new Date(fecha + "T00:00:00Z");
  if (Number.isNaN(valor.getTime()) || valor.toISOString().slice(0, 10) !== fecha) {
    return false;
  }
  const hoy = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  return fecha <= hoy && fecha <= FECHA_CAMPAMENTO;
}
__name(validarFecha2, "validarFecha");
function calcularAcreditacion(fecha) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  let edad = 2027 - anio;
  if (mes > 1 || mes === 1 && dia > 8) {
    edad--;
  }
  if (edad >= 0 && edad <= 5) {
    return 0;
  }
  if (edad >= 6 && edad <= 10) {
    return 1e4;
  }
  return 2e4;
}
__name(calcularAcreditacion, "calcularAcreditacion");
function siNo(valor) {
  return valor === "si" || valor === "no";
}
__name(siNo, "siNo");
function validarDatos2(datos) {
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    return "Los datos enviados no son v\xE1lidos.";
  }
  const correo = limpiar(datos.correo);
  if (correo.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
    return "Correo electr\xF3nico no v\xE1lido.";
  }
  if (typeof datos.contrasena !== "string" || datos.contrasena.length < 8 || datos.contrasena.length > 128) {
    return "La contrase\xF1a debe tener entre 8 y 128 caracteres.";
  }
  if (!textoValido(datos.nombreCompleto, 150)) {
    return "Nombre completo no v\xE1lido.";
  }
  if (!textoValido(datos.alias, 40, false)) {
    return "El alias no es v\xE1lido.";
  }
  if (!validarRut2(datos.rut)) {
    return "RUT no v\xE1lido.";
  }
  const genero = limpiar(datos.genero).toUpperCase();
  if (!["MASCULINO", "FEMENINO"].includes(genero)) {
    return "G\xE9nero no v\xE1lido.";
  }
  if (!validarFecha2(datos.fechaNacimiento)) {
    return "Fecha de nacimiento no v\xE1lida.";
  }
  if (!validarTelefono2(datos.telefono)) {
    return "Tel\xE9fono no v\xE1lido.";
  }
  const preguntasMedicas = [
    ["tieneAlergias", "detalleAlergias"],
    ["tieneEnfermedad", "detalleEnfermedad"],
    ["tomaMedicamentos", "detalleMedicamentos"],
    ["restriccionAlimentaria", "detalleAlimentacion"]
  ];
  for (const [pregunta, detalle2] of preguntasMedicas) {
    if (!siNo(datos[pregunta])) {
      return `Respuesta obligatoria: ${pregunta}.`;
    }
    if (!textoValido(
      datos[detalle2],
      500,
      datos[pregunta] === "si"
    )) {
      return `Detalle m\xE9dico no v\xE1lido: ${detalle2}.`;
    }
  }
  if (!textoValido(datos.nombreEmergencia, 150)) {
    return "Nombre del contacto de emergencia no v\xE1lido.";
  }
  const parentescos = [
    "madre-padre",
    "tutor",
    "hermano",
    "pareja",
    "otro"
  ];
  if (!parentescos.includes(datos.parentesco)) {
    return "Parentesco no v\xE1lido.";
  }
  if (!validarTelefono2(datos.telefonoEmergencia)) {
    return "Tel\xE9fono de emergencia no v\xE1lido.";
  }
  if (!validarTelefono2(datos.telefonoAlternativo, false)) {
    return "Tel\xE9fono alternativo no v\xE1lido.";
  }
  if (!siNo(datos.tieneAcompanantes)) {
    return "Indica si asistir\xE1s con acompa\xF1antes.";
  }
  if (datos.confirmaInformacion !== true && datos.confirmaInformacion !== "on") {
    return "Debes confirmar la informaci\xF3n.";
  }
  return null;
}
__name(validarDatos2, "validarDatos");
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
  const iteraciones = 1e5;
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
  const hex = /* @__PURE__ */ __name((bytes) => Array.from(bytes).map((n) => n.toString(16).padStart(2, "0")).join(""), "hex");
  return [
    "pbkdf2_sha256",
    iteraciones,
    hex(salt),
    hex(new Uint8Array(hash))
  ].join("$");
}
__name(crearHashContrasena, "crearHashContrasena");
async function verificarContrasena(contrasena, hashGuardado) {
  if (typeof contrasena !== "string" || typeof hashGuardado !== "string") {
    return false;
  }
  const partes = hashGuardado.split("$");
  if (partes.length !== 4 || partes[0] !== "pbkdf2_sha256") {
    return false;
  }
  if (Number(partes[1]) !== 1e5) {
    return false;
  }
  const convertirHex = /* @__PURE__ */ __name((texto2) => {
    if (!/^(?:[0-9a-f]{2})+$/i.test(texto2)) {
      throw new Error("Formato de hash no v\xE1lido.");
    }
    return Uint8Array.from(
      texto2.match(/.{2}/g),
      (byte) => parseInt(byte, 16)
    );
  }, "convertirHex");
  try {
    const salt = convertirHex(partes[2]);
    const hashOriginal = convertirHex(partes[3]);
    if (salt.length !== 16 || hashOriginal.length !== 32) {
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
          iterations: 1e5,
          hash: "SHA-256"
        },
        clave,
        256
      )
    );
    let diferencias = 0;
    for (let i = 0; i < hashOriginal.length; i++) {
      diferencias |= hashOriginal[i] ^ hashCalculado[i];
    }
    return diferencias === 0;
  } catch {
    return false;
  }
}
__name(verificarContrasena, "verificarContrasena");
function convertirBase64Url(bytes) {
  const binario = Array.from(
    bytes,
    (byte) => String.fromCharCode(byte)
  ).join("");
  return btoa(binario).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
__name(convertirBase64Url, "convertirBase64Url");
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
__name(firmarSesion, "firmarSesion");
async function crearTokenSesion(usuarioId, env) {
  if (!env.LOGIN_SESSION_SECRET) {
    throw new Error(
      "Clave de sesiones no configurada."
    );
  }
  const ahora = Math.floor(Date.now() / 1e3);
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
__name(crearTokenSesion, "crearTokenSesion");
async function verificarTokenSesion(token, env) {
  if (typeof token !== "string" || !env.LOGIN_SESSION_SECRET) {
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
  const ahora = Math.floor(Date.now() / 1e3);
  if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0 || !Number.isSafeInteger(vencimiento) || vencimiento <= ahora || vencimiento > ahora + DURACION_SESION_SEGUNDOS || !/^[0-9a-f-]{36}$/i.test(identificador)) {
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
    diferencias |= firma.charCodeAt(i) ^ firmaEsperada.charCodeAt(i);
  }
  return diferencias === 0 ? { usuarioId, vencimiento } : null;
}
__name(verificarTokenSesion, "verificarTokenSesion");
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
__name(crearCookieSesion, "crearCookieSesion");
function obtenerCookieSesion(request) {
  const cookies = request.headers.get("Cookie") || "";
  for (const cookie of cookies.split(";")) {
    const separador = cookie.indexOf("=");
    if (separador === -1) continue;
    const nombre = cookie.slice(0, separador).trim();
    const valor = cookie.slice(separador + 1).trim();
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
__name(obtenerCookieSesion, "obtenerCookieSesion");
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
__name(eliminarCookieSesion, "eliminarCookieSesion");
async function verificarTurnstile(token, request, env) {
  if (!env.TURNSTILE_SECRET_KEY) {
    return {
      correcto: false,
      estado: 503,
      mensaje: "La verificaci\xF3n de seguridad no est\xE1 configurada."
    };
  }
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) {
    return {
      correcto: false,
      estado: 403,
      mensaje: "Debes completar la verificaci\xF3n de seguridad."
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
    const respuesta2 = await fetch(
      URL_TURNSTILE,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: parametros.toString(),
        signal: AbortSignal.timeout(1e4)
      }
    );
    if (!respuesta2.ok) {
      return {
        correcto: false,
        estado: 503,
        mensaje: "No se pudo verificar la seguridad."
      };
    }
    const resultado = await respuesta2.json();
    console.log("Hostname recibido de Turnstile:", resultado.hostname);
    if (resultado.success !== true) {
      return {
        correcto: false,
        estado: 403,
        mensaje: "La verificaci\xF3n de seguridad fall\xF3."
      };
    }
    const ES_PRUEBA_LOCAL = ["localhost", "127.0.0.1"].includes(
      new URL(request.url).hostname
    ) && env.TURNSTILE_SECRET_KEY === "1x0000000000000000000000000000000AA";
    const HOSTNAMES_PERMITIDOS = [
      "localhost",
      "127.0.0.1",
      ...ES_PRUEBA_LOCAL ? ["example.com"] : []
    ];
    if (!HOSTNAMES_PERMITIDOS.includes(
      resultado.hostname
    )) {
      return {
        correcto: false,
        estado: 403,
        mensaje: "El origen de la verificaci\xF3n no est\xE1 autorizado."
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
      mensaje: "No fue posible verificar la seguridad."
    };
  }
}
__name(verificarTurnstile, "verificarTurnstile");
async function registrarParticipante(datos, env) {
  const error = validarDatos2(datos);
  if (error) {
    return responder({
      mensaje: error
    }, 400);
  }
  const correo = limpiar(datos.correo).toLowerCase();
  const rut = normalizarRut2(datos.rut);
  const genero = limpiar(datos.genero).toUpperCase();
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
  if (duplicado.correos > 0 || duplicado.participantes > 0 || duplicado.acompanantes > 0) {
    return responder({
      mensaje: "El correo o RUT ya est\xE1 registrado."
    }, 409);
  }
  const hash = await crearHashContrasena(
    datos.contrasena
  );
  const monto = calcularAcreditacion(
    datos.fechaNacimiento
  );
  const bandera = /* @__PURE__ */ __name((valor) => valor === "si" ? 1 : 0, "bandera");
  const detalle2 = /* @__PURE__ */ __name((pregunta, campo) => datos[pregunta] === "si" ? limpiar(datos[campo]) : null, "detalle");
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
        detalle2(
          "tieneAlergias",
          "detalleAlergias"
        ),
        bandera(datos.tieneEnfermedad),
        detalle2(
          "tieneEnfermedad",
          "detalleEnfermedad"
        ),
        bandera(datos.tomaMedicamentos),
        detalle2(
          "tomaMedicamentos",
          "detalleMedicamentos"
        ),
        bandera(datos.restriccionAlimentaria),
        detalle2(
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
    return responder({
      mensaje: "Inscripci\xF3n registrada correctamente.",
      estado: "REGISTRADA",
      montoTotal: monto,
      pago: "PENDIENTE",
      acompanantesPendientes: datos.tieneAcompanantes === "si"
    }, 201);
  } catch (error2) {
    console.error(
      "Error al registrar participante:",
      error2?.message
    );
    const mensaje = String(
      error2?.message || ""
    );
    if (mensaje.includes("UNIQUE constraint") || mensaje.includes(
      "SQLITE_CONSTRAINT_UNIQUE"
    )) {
      return responder({
        mensaje: "El correo o RUT ya est\xE1 registrado."
      }, 409);
    }
    return responder({
      mensaje: "No se pudo completar la inscripci\xF3n."
    }, 500);
  }
}
__name(registrarParticipante, "registrarParticipante");
function obtenerHeadersCORS(request) {
  const origen = request.headers.get(
    "Origin"
  );
  if (!ORIGENES_PERMITIDOS.includes(origen)) {
    return {};
  }
  return {
    "Access-Control-Allow-Origin": origen,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-ICEC-Solicitud",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "600",
    "Vary": "Origin"
  };
}
__name(obtenerHeadersCORS, "obtenerHeadersCORS");
function aplicarCORS(respuesta2, request) {
  const cabeceras = new Headers(respuesta2.headers);
  const headersCORS = obtenerHeadersCORS(request);
  for (const [clave, valor] of Object.entries(headersCORS)) {
    cabeceras.set(clave, valor);
  }
  return new Response(respuesta2.body, {
    status: respuesta2.status,
    statusText: respuesta2.statusText,
    headers: cabeceras
  });
}
__name(aplicarCORS, "aplicarCORS");
function validarOrigenPrivado(request) {
  const origen = request.headers.get(
    "Origin"
  );
  return origen !== null && ORIGENES_PERMITIDOS.includes(origen);
}
__name(validarOrigenPrivado, "validarOrigenPrivado");
async function leerJSON(request, maximo = 4096) {
  const tipo = request.headers.get(
    "content-type"
  );
  if (!tipo?.toLowerCase().startsWith("application/json")) {
    throw new Error(
      "Se requiere JSON."
    );
  }
  const cuerpo = await request.text();
  if (new TextEncoder().encode(cuerpo).length > maximo) {
    throw new Error(
      "Solicitud demasiado grande."
    );
  }
  const datos = JSON.parse(cuerpo);
  if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
    throw new Error(
      "JSON no v\xE1lido."
    );
  }
  return datos;
}
__name(leerJSON, "leerJSON");
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
  if (!usuario || Number(usuario.activo) !== 1) {
    return null;
  }
  return usuario;
}
__name(usuarioDeSesion, "usuarioDeSesion");
async function limitarIntentosLogin(request, env) {
  const ip = request.headers.get(
    "CF-Connecting-IP"
  );
  if (!ip) {
    return responder({
      mensaje: "No se pudo validar el origen de la solicitud."
    }, 403);
  }
  const datos = new TextEncoder().encode(
    `${env.LOGIN_SESSION_SECRET}:login:${ip}`
  );
  const digest = new Uint8Array(
    await crypto.subtle.digest(
      "SHA-256",
      datos
    )
  );
  const clave = Array.from(digest).map((n) => n.toString(16).padStart(2, "0")).join("");
  const ahora = Math.floor(Date.now() / 1e3);
  const vence = ahora + VENTANA_LOGIN_SEGUNDOS;
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
  if (Number(fila.intentos) > MAX_INTENTOS_LOGIN) {
    const segundos = Math.max(
      1,
      Number(fila.vence) - ahora
    );
    const respuesta2 = responder({
      mensaje: "Demasiados intentos de acceso. Intenta nuevamente m\xE1s tarde."
    }, 429);
    respuesta2.headers.set(
      "Retry-After",
      String(segundos)
    );
    return respuesta2;
  }
  return null;
}
__name(limitarIntentosLogin, "limitarIntentosLogin");
async function iniciarSesion(request, env) {
  if (!validarOrigenPrivado(request)) {
    return responder({
      mensaje: "Origen no autorizado."
    }, 403);
  }
  if (request.headers.get(
    "X-ICEC-Solicitud"
  ) !== "web") {
    return responder({
      mensaje: "Solicitud no autorizada."
    }, 403);
  }
  if (!env.LOGIN_SESSION_SECRET) {
    return responder({
      mensaje: "El inicio de sesi\xF3n no est\xE1 configurado."
    }, 503);
  }
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
      mensaje: "Solicitud de inicio de sesi\xF3n no v\xE1lida."
    }, 400);
  }
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
  const correo = limpiar(datos.correo).toLowerCase();
  const contrasena = datos.contrasena;
  if (correo.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo) || typeof contrasena !== "string" || contrasena.length > 128) {
    return responder({
      mensaje: "Correo o contrase\xF1a incorrectos."
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
  const contrasenaCorrecta = await verificarContrasena(
    contrasena,
    usuario?.contrasena_hash || ""
  );
  if (!usuario || Number(usuario.activo) !== 1 || !contrasenaCorrecta) {
    return responder({
      mensaje: "Correo o contrase\xF1a incorrectos."
    }, 401);
  }
  const token = await crearTokenSesion(
    usuario.id,
    env
  );
  return respuestaConCookie(
    {
      mensaje: "Sesi\xF3n iniciada correctamente.",
      rol: usuario.rol
    },
    200,
    crearCookieSesion(token)
  );
}
__name(iniciarSesion, "iniciarSesion");
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
      mensaje: "No has iniciado sesi\xF3n."
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
__name(consultarSesion, "consultarSesion");
function cerrarSesion(request) {
  if (!validarOrigenPrivado(request)) {
    return responder({
      mensaje: "Origen no autorizado."
    }, 403);
  }
  if (request.headers.get(
    "X-ICEC-Solicitud"
  ) !== "web") {
    return responder({
      mensaje: "Solicitud no autorizada."
    }, 403);
  }
  return respuestaConCookie(
    {
      mensaje: "Sesi\xF3n cerrada."
    },
    200,
    eliminarCookieSesion()
  );
}
__name(cerrarSesion, "cerrarSesion");
async function manejarSolicitud(request, env) {
  const url = new URL(request.url);
  if (url.pathname === "/api/acompanantes" || /^\/api\/acompanantes\/[1-9]\d*$/.test(url.pathname)) {
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
  if (url.pathname === "/api/estado") {
    if (request.method !== "GET") {
      return responder({
        mensaje: "M\xE9todo no permitido."
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
        "Error de conexi\xF3n D1:",
        error?.message
      );
      return responder({
        estado: "ERROR",
        baseDatos: "No disponible"
      }, 500);
    }
  }
  if (url.pathname === "/api/registro") {
    if (request.method !== "POST") {
      return responder({
        mensaje: "M\xE9todo no permitido."
      }, 405);
    }
    const tipo = request.headers.get("content-type");
    if (!tipo?.toLowerCase().startsWith("application/json")) {
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
        mensaje: "Solicitud demasiado grande."
      }, 413);
    }
    let datos;
    try {
      const cuerpo = await request.text();
      if (new TextEncoder().encode(cuerpo).length > 16384) {
        return responder({
          mensaje: "Solicitud demasiado grande."
        }, 413);
      }
      datos = JSON.parse(cuerpo);
    } catch {
      return responder({
        mensaje: "JSON no v\xE1lido."
      }, 400);
    }
    if (!datos || typeof datos !== "object" || Array.isArray(datos)) {
      return responder({
        mensaje: "Los datos enviados no son v\xE1lidos."
      }, 400);
    }
    const tokenPrivado = request.headers.get(
      "X-Registro-Prueba"
    );
    const pruebaAutorizada = Boolean(env.REGISTRO_PRUEBA_TOKEN) && Boolean(tokenPrivado) && tokenPrivado === env.REGISTRO_PRUEBA_TOKEN;
    if (!pruebaAutorizada) {
      const tokenTurnstile = datos.turnstileToken || datos["cf-turnstile-response"];
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
        mensaje: "Error interno del registro."
      }, 500);
    }
  }
  if (url.pathname === "/api/login") {
    if (request.method !== "POST") {
      return responder({
        mensaje: "M\xE9todo no permitido."
      }, 405);
    }
    return iniciarSesion(request, env);
  }
  if (url.pathname === "/api/sesion") {
    if (request.method !== "GET") {
      return responder({
        mensaje: "M\xE9todo no permitido."
      }, 405);
    }
    return consultarSesion(request, env);
  }
  if (url.pathname === "/api/logout") {
    if (request.method !== "POST") {
      return responder({
        mensaje: "M\xE9todo no permitido."
      }, 405);
    }
    return cerrarSesion(request);
  }
  return responder({
    mensaje: "Ruta no encontrada."
  }, 404);
}
__name(manejarSolicitud, "manejarSolicitud");
var worker_default = {
  async fetch(request, env) {
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
      const respuesta2 = await manejarSolicitud(
        request,
        env
      );
      return aplicarCORS(
        respuesta2,
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

// ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-kirbnX/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-kirbnX/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
