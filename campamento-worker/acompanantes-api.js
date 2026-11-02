
/*
 * CAMPAMENTO JUVENIL ICEC 2027
 *
 * API DE ACOMPAÑANTES
 * Cloudflare Workers + D1
 *
 * Rutas:
 * GET    /api/acompanantes
 * POST   /api/acompanantes
 * DELETE /api/acompanantes/:id
 *
 * Seguridad:
 * - Sesión de participante obligatoria
 * - Validación en el backend
 * - Verificación del estado del pago
 * - Operaciones agrupadas en D1
 * - Recalculo automático del monto
 */

const MAX_ACOMPANANTES = 20;
const FECHA_CAMPAMENTO_ACOMP = "2027-01-08";

// ==========================================
// RESPUESTAS
// ==========================================

function respuesta(datos, estado = 200) {
  return Response.json(datos, {
    status: estado,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

// ==========================================
// NORMALIZACIÓN Y VALIDACIONES
// ==========================================

function texto(valor) {
  return typeof valor === "string"
    ? valor.trim()
    : "";
}

function normalizarRut(valor) {
  return texto(valor)
    .replace(/[.\-\s]/g, "")
    .toUpperCase();
}

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

  const resto = 11 - (suma % 11);

  const dv = resto === 11
    ? "0"
    : resto === 10
      ? "K"
      : String(resto);

  return dv === rut.slice(-1);
}

function validarFecha(fecha) {
  if (
    typeof fecha !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
  ) {
    return false;
  }

  const fechaObjeto = new Date(
    fecha + "T00:00:00Z"
  );

  if (
    Number.isNaN(fechaObjeto.getTime()) ||
    fechaObjeto.toISOString().slice(0, 10) !== fecha
  ) {
    return false;
  }

  const hoy = new Date()
    .toISOString()
    .slice(0, 10);

  return (
    fecha <= hoy &&
    fecha <= FECHA_CAMPAMENTO_ACOMP
  );
}

function calcularValor(fecha) {
  const [anio, mes, dia] = fecha
    .split("-")
    .map(Number);

  let edad = 2027 - anio;

  if (
    mes > 1 ||
    (mes === 1 && dia > 8)
  ) {
    edad--;
  }

  if (edad <= 5) return 0;
  if (edad <= 10) return 10000;

  return 20000;
}

function validarTelefono(valor, obligatorio = true) {
  if (!obligatorio && !texto(valor)) {
    return true;
  }

  const telefono = texto(valor);

  const digitos = telefono.replace(/\D/g, "");

  return (
    /^\+?[\d\s()-]{8,20}$/.test(telefono) &&
    digitos.length >= 8 &&
    digitos.length <= 15
  );
}

function validarDatos(datos) {
  if (
    !datos ||
    typeof datos !== "object" ||
    Array.isArray(datos)
  ) {
    return "Los datos enviados no son válidos.";
  }

  if (
    !texto(datos.nombre) ||
    texto(datos.nombre).length > 150
  ) {
    return "Nombre completo no válido.";
  }

  if (!validarRut(datos.rut)) {
    return "RUT no válido.";
  }

  if (!validarFecha(datos.fechaNacimiento)) {
    return "Fecha de nacimiento no válida.";
  }

  const genero = texto(datos.genero).toLowerCase();

  if (
    genero !== "masculino" &&
    genero !== "femenino"
  ) {
    return "Género no válido.";
  }

  if (!validarTelefono(datos.telefono)) {
    return "Teléfono no válido.";
  }

  const correo = texto(datos.correo).toLowerCase();

  if (
    correo &&
    (
      correo.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
    )
  ) {
    return "Correo electrónico no válido.";
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

  for (
    const [pregunta, detalle]
    of preguntasMedicas
  ) {
    if (
      datos[pregunta] !== "si" &&
      datos[pregunta] !== "no"
    ) {
      return `Debes responder ${pregunta}.`;
    }

    if (
      datos[pregunta] === "si" &&
      !texto(datos[detalle])
    ) {
      return `Debes completar ${detalle}.`;
    }

    if (texto(datos[detalle]).length > 500) {
      return `El campo ${detalle} supera el límite.`;
    }
  }

  if (
    !texto(datos.nombreEmergencia) ||
    texto(datos.nombreEmergencia).length > 150
  ) {
    return "Nombre del contacto de emergencia no válido.";
  }

  const parentescosPermitidos = [
    "madre-padre",
    "tutor-tutora",
    "hermano-hermana",
    "pareja",
    "otro"
  ];

  if (
    !parentescosPermitidos.includes(
      datos.relacionEmergencia
    )
  ) {
    return "Parentesco de emergencia no válido.";
  }

  if (!validarTelefono(datos.telefonoEmergencia)) {
    return "Teléfono de emergencia no válido.";
  }

  if (
    !validarTelefono(
      datos.telefonoAlternativo,
      false
    )
  ) {
    return "Teléfono alternativo no válido.";
  }

  return null;
}

function indicador(valor) {
  return valor === "si" ? 1 : 0;
}

function detalle(datos, pregunta, campo) {
  return datos[pregunta] === "si"
    ? texto(datos[campo])
    : null;
}

// ==========================================
// AUTENTICACIÓN
// ==========================================

async function comprobarPermisos(
  request,
  env,
  dependencias
) {
  const origen = request.headers.get("Origin");

  if (
    !dependencias.ORIGENES_PERMITIDOS.includes(
      origen
    )
  ) {
    return {
      error: respuesta({
        mensaje: "Origen no autorizado."
      }, 403)
    };
  }

  if (
    request.method !== "GET" &&
    request.headers.get(
      "X-ICEC-Solicitud"
    ) !== "web"
  ) {
    return {
      error: respuesta({
        mensaje: "Solicitud no autorizada."
      }, 403)
    };
  }

  const usuario =
    await dependencias.usuarioDeSesion(
      request,
      env
    );

  if (
    !usuario ||
    usuario.rol !== "PARTICIPANTE" ||
    !Number.isSafeInteger(
      Number(usuario.participante_id)
    ) ||
    Number(usuario.participante_id) <= 0
  ) {
    return {
      error: respuesta({
        mensaje:
          "Debes iniciar sesión como participante."
      }, 401)
    };
  }

  return {
    participanteId: Number(
      usuario.participante_id
    )
  };
}

// ==========================================
// CONSULTAS COMPARTIDAS
// ==========================================

async function obtenerLista(
  env,
  participanteId
) {
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

async function obtenerTotal(
  env,
  participanteId
) {
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

async function obtenerPago(
  env,
  participanteId
) {
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

function pagoEditable(pago) {
  return (
    pago?.estado === "PENDIENTE" &&
    Number(pago.monto_pagado) === 0
  );
}

async function obtenerResumen(
  env,
  participanteId,
  mensaje = null,
  estado = 200
) {
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

// ==========================================
// LEER JSON DEL FORMULARIO
// ==========================================

async function leerDatos(request) {
  if (
    !request.headers.get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    throw new Error("TIPO_INVALIDO");
  }

  const cuerpo = await request.text();

  if (
    new TextEncoder().encode(cuerpo).length >
    8192
  ) {
    throw new Error("TAMANO_INVALIDO");
  }

  const datos = JSON.parse(cuerpo);

  if (
    !datos ||
    typeof datos !== "object" ||
    Array.isArray(datos)
  ) {
    throw new Error("JSON_INVALIDO");
  }

  return datos;
}

// ==========================================
// REGISTRAR ACOMPAÑANTE
// ==========================================

async function registrarAcompanante(
  request,
  env,
  participanteId
) {
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
      mensaje: "JSON no válido."
    }, 400);
  }

  const errorValidacion = validarDatos(datos);

  if (errorValidacion) {
    return respuesta({
      mensaje: errorValidacion
    }, 400);
  }

  // Comprobación anticipada para mostrar
  // mensajes claros al participante.

  const pago = await obtenerPago(
    env,
    participanteId
  );

  if (!pagoEditable(pago)) {
    return respuesta({
      mensaje:
        "No puedes agregar acompañantes porque " +
        "el pago ya está en revisión o procesado."
    }, 409);
  }

  const rut = normalizarRut(datos.rut);

  const correo = texto(datos.correo).toLowerCase();

  const genero = texto(datos.genero).toUpperCase();

  const valor = calcularValor(
    datos.fechaNacimiento
  );

  /*
   * El bloqueo real se comprueba dentro
   * de la operación SQL.
   *
   * Si la inscripción deja de ser editable,
   * si se alcanza el límite o si el RUT
   * ya existe, el INSERT falla y D1 revierte
   * el lote completo.
   */

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
      "Error en registro de acompañante:",
      error?.message
    );

    const mensaje = String(
      error?.message || ""
    );

    if (
      mensaje.includes("UNIQUE") ||
      mensaje.includes("NOT NULL") ||
      mensaje.includes("CONSTRAINT")
    ) {
      return respuesta({
        mensaje:
          "No se pudo registrar el acompañante. " +
          "Comprueba que el RUT no esté repetido " +
          "y que el pago siga pendiente."
      }, 409);
    }

    return respuesta({
      mensaje:
        "No fue posible registrar el acompañante."
    }, 500);
  }

  return obtenerResumen(
    env,
    participanteId,
    "Acompañante registrado correctamente.",
    201
  );
}

// ==========================================
// ELIMINAR ACOMPAÑANTE
// ==========================================

async function eliminarAcompanante(
  env,
  participanteId,
  acompananteId
) {
  const pago = await obtenerPago(
    env,
    participanteId
  );

  if (!pagoEditable(pago)) {
    return respuesta({
      mensaje:
        "No se puede eliminar un acompañante " +
        "con el pago en revisión o procesado."
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
      mensaje: "Acompañante no encontrado."
    }, 404);
  }

  /*
   * Todas las eliminaciones verifican
   * el mismo pago pendiente.
   *
   * Si el pago cambia de estado, la
   * operación no elimina los datos.
   */

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
      "Error al eliminar acompañante:",
      error?.message
    );

    return respuesta({
      mensaje:
        "No fue posible eliminar el acompañante."
    }, 500);
  }

  const eliminados = Number(
    resultados?.[2]?.meta?.changes || 0
  );

  if (eliminados !== 1) {
    return respuesta({
      mensaje:
        "No se eliminó el acompañante. " +
        "Verifica el estado del pago."
    }, 409);
  }

  return obtenerResumen(
    env,
    participanteId,
    "Acompañante eliminado correctamente."
  );
}

// ==========================================
// RUTAS DE ACOMPAÑANTES
// ==========================================

export async function manejarAcompanantes(
  request,
  env,
  dependencias,
  pathname
) {
  const permiso = await comprobarPermisos(
    request,
    env,
    dependencias
  );

  if (permiso.error) {
    return permiso.error;
  }

  const participanteId =
    permiso.participanteId;

  // Consultar acompañantes.

  if (
    pathname === "/api/acompanantes" &&
    request.method === "GET"
  ) {
    return obtenerResumen(
      env,
      participanteId
    );
  }

  // Registrar acompañante.

  if (
    pathname === "/api/acompanantes" &&
    request.method === "POST"
  ) {
    return registrarAcompanante(
      request,
      env,
      participanteId
    );
  }

  // Eliminar acompañante.

  const coincidencia = pathname.match(
    /^\/api\/acompanantes\/([1-9]\d*)$/
  );

  if (
    coincidencia &&
    request.method === "DELETE"
  ) {
    const acompananteId = Number(
      coincidencia[1]
    );

    if (!Number.isSafeInteger(acompananteId)) {
      return respuesta({
        mensaje: "Identificador no válido."
      }, 400);
    }

    return eliminarAcompanante(
      env,
      participanteId,
      acompananteId
    );
  }

  return respuesta({
    mensaje: "Método no permitido."
  }, 405);
}
