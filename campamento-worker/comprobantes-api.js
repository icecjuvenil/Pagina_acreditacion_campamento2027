
/*
 * CAMPAMENTO ICEC 2027
 * Recepción segura de comprobantes
 * Cloudflare Workers + D1 + R2
 */

const MAX_ARCHIVO = 5 * 1024 * 1024;
const MAX_SOLICITUD = MAX_ARCHIVO + 256 * 1024;

function responder(datos, estado = 200) {
  return Response.json(datos, {
    status: estado,
    headers: {
      "Cache-Control": "no-store"
    }
  });
}

async function leerFormularioLimitado(request) {
  const lector = request.body?.getReader();

  if (!lector) {
    throw new Error("FORMULARIO_INVALIDO");
  }

  const partes = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await lector.read();

      if (done) break;

      total += value.byteLength;

      if (total > MAX_SOLICITUD) {
        throw new Error("ARCHIVO_GRANDE");
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
      "Content-Type": request.headers.get("Content-Type")
    },
    body: cuerpo
  });

  return copia.formData();
}

function identificarArchivo(archivo, bytes) {
  const nombre = archivo.name.toLowerCase();

  const pdf =
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46 &&
    bytes[4] === 0x2D;

  const png =
    [137, 80, 78, 71, 13, 10, 26, 10]
      .every((valor, i) => bytes[i] === valor);

  const jpg =
    bytes[0] === 0xFF &&
    bytes[1] === 0xD8 &&
    bytes[2] === 0xFF;

  if (
    pdf &&
    nombre.endsWith(".pdf") &&
    archivo.type === "application/pdf"
  ) {
    return {
      extension: "pdf",
      tipo: "application/pdf"
    };
  }

  if (
    png &&
    nombre.endsWith(".png") &&
    archivo.type === "image/png"
  ) {
    return {
      extension: "png",
      tipo: "image/png"
    };
  }

  if (
    jpg &&
    /\.(jpg|jpeg)$/.test(nombre) &&
    archivo.type === "image/jpeg"
  ) {
    return {
      extension: "jpg",
      tipo: "image/jpeg"
    };
  }

  return null;
}

function fechaValida(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false;
  }

  const valor = new Date(fecha + "T00:00:00Z");

  return (
    !Number.isNaN(valor.getTime()) &&
    valor.toISOString().slice(0, 10) === fecha &&
    fecha <= new Date().toISOString().slice(0, 10)
  );
}

export async function manejarComprobantes(
  request,
  env,
  { usuarioDeSesion, ORIGENES_PERMITIDOS }
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
      mensaje: "El almacenamiento no está configurado."
    }, 503);
  }

  const usuario = await usuarioDeSesion(request, env);

  if (!usuario) {
    return responder({
      mensaje: "Debes iniciar sesión."
    }, 401);
  }

  if (
    usuario.rol !== "PARTICIPANTE" ||
    !Number.isInteger(Number(usuario.participante_id)) ||
    Number(usuario.participante_id) <= 0
  ) {
    return responder({
      mensaje: "No tienes permiso para esta operación."
    }, 403);
  }

  const participanteId = Number(usuario.participante_id);

  const pago = await env.DB.prepare(
  `SELECT id, monto_total, monto_pagado,
          estado,
          metodo_pago,
          comprobante_key,
          comprobante_efectivo_key
   FROM pagos
   WHERE participante_id = ?
   LIMIT 1`
).bind(participanteId).first();

  if (!pago) {
    return responder({
      mensaje: "No se encontró la inscripción."
    }, 404);
  }

  
if (
  !["PENDIENTE", "RECHAZADO"].includes(pago.estado) ||
  (
    pago.estado === "PENDIENTE" &&
    (
      pago.comprobante_key ||
      pago.comprobante_efectivo_key
    )
  ) ||
  Number(pago.monto_pagado) !== 0
) {
  return responder({
    mensaje: "Este pago ya tiene un comprobante o está en revisión."
  }, 409);
}

  if (Number(pago.monto_total) <= 0) {
    return responder({
      mensaje: "Esta inscripción no requiere transferencia."
    }, 409);
  }

  const tipo = request.headers.get("Content-Type") || "";

  if (!/^multipart\/form-data\s*;/i.test(tipo)) {
    return responder({
      mensaje: "Debes enviar un formulario con archivo."
    }, 415);
  }

  const longitud = Number(
    request.headers.get("Content-Length") || 0
  );

  if (longitud > MAX_SOLICITUD) {
    return responder({
      mensaje: "El comprobante supera el tamaño permitido."
    }, 413);
  }

  let formulario;

  try {
    formulario = await leerFormularioLimitado(request);
  } catch (error) {
    return responder({
      mensaje: error.message === "ARCHIVO_GRANDE"
        ? "El comprobante supera el tamaño permitido."
        : "No se pudo leer el formulario."
    }, error.message === "ARCHIVO_GRANDE" ? 413 : 400);
  }
// Método de pago seleccionado por el participante
const metodoPago = String(
  formulario.get("metodoPago") || ""
).trim();

if (
  metodoPago !== "TRANSFERENCIA" &&
  metodoPago !== "EFECTIVO"
) {
  return responder({
    mensaje: "Selecciona un método de pago válido."
  }, 400);
}
  const titular = String(
    formulario.get("titularTransferencia") || ""
  ).trim();

  const fecha = String(
    formulario.get("fechaTransferencia") || ""
  ).trim();

  const archivo = formulario.get("comprobante");

  // Validar los datos bancarios solo para transferencias
if (metodoPago === "TRANSFERENCIA") {
  if (
    titular.length < 3 ||
    titular.length > 120 ||
    /[\x00-\x1F\x7F]/.test(titular) ||
    !fechaValida(fecha)
  ) {
    return responder({
      mensaje: "Revisa el titular y la fecha de transferencia."
    }, 400);
  }
}

  if (
    !(archivo instanceof File) ||
    archivo.size === 0 ||
    archivo.size > MAX_ARCHIVO
  ) {
    return responder({
      mensaje: "Selecciona un archivo válido de máximo 5 MB."
    }, 400);
  }

  const contenido = await archivo.arrayBuffer();

  const formato = identificarArchivo(
    archivo,
    new Uint8Array(contenido)
  );

  if (!formato) {
    return responder({
      mensaje: "Solo se permiten archivos JPG, PNG o PDF válidos."
    }, 400);
  }

  const clave =
    `comprobantes/participante-${participanteId}/` +
    `${crypto.randomUUID()}.${formato.extension}`;

  let archivoGuardado = false;
  let pagoActualizado = false;

  try {
    const resultadoR2 = await env.COMPROBANTES.put(
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

    if (!resultadoR2) {
      throw new Error("No se pudo almacenar el archivo.");
    }

    archivoGuardado = true;

    

    // Guardar el comprobante según el método de pago seleccionado
    const esTransferencia = metodoPago === "TRANSFERENCIA";

    const actualizacion = await env.DB.prepare(
      `UPDATE pagos
       SET metodo_pago = ?,
           titular_transferencia = ?,
           fecha_transferencia = ?,
           comprobante_key = ?,
           comprobante_efectivo_key = ?,
           estado = 'EN_REVISION',
           observaciones = NULL,
           fecha_revision = NULL
       WHERE id = ?
         AND participante_id = ?
         AND estado = ?
         AND estado IN ('PENDIENTE', 'RECHAZADO')
         AND comprobante_key IS ?
         AND comprobante_efectivo_key IS ?
         AND monto_pagado = 0`
    ).bind(
      metodoPago,
      esTransferencia ? titular : null,
      esTransferencia ? fecha : null,
      esTransferencia ? clave : null,
      esTransferencia ? null : clave,
      pago.id,
      participanteId,
      pago.estado,
      pago.comprobante_key,
      pago.comprobante_efectivo_key
    ).run();


    

if (actualizacion.meta?.changes !== 1) {
  try {
    await env.COMPROBANTES.delete(clave);
    archivoGuardado = false;
  } catch (errorLimpieza) {
    console.error(
      "No se pudo eliminar el archivo sin registrar:",
      errorLimpieza?.message
    );
  }

  return responder({
    mensaje: "El pago cambió de estado. Actualiza la página."
  }, 409);
}


    pagoActualizado = true;

    
    // Eliminar comprobantes anteriores de pagos rechazados
    // solo después de guardar correctamente el nuevo en D1.
    if (pago.estado === "RECHAZADO") {
      const comprobantesAnteriores = [
        pago.comprobante_key,
        pago.comprobante_efectivo_key
      ].filter(
        (claveAnterior) =>
          claveAnterior &&
          claveAnterior !== clave
      );

      for (const claveAnterior of new Set(comprobantesAnteriores)) {
        try {
          await env.COMPROBANTES.delete(claveAnterior);
        } catch (errorLimpieza) {
          console.error(
            "No se pudo eliminar el comprobante anterior:",
            errorLimpieza?.message
          );
        }
      }
    }



    return responder({
      mensaje: "Comprobante recibido correctamente.",
      estado: "EN_REVISION"
    }, 201);

  } catch (error) {
    console.error(
      "Error al guardar comprobante:",
      error?.message
    );

    
if (archivoGuardado && !pagoActualizado) {
  try {
    await env.COMPROBANTES.delete(clave);
  } catch (errorLimpieza) {
    console.error(
      "No fue posible limpiar el archivo:",
      errorLimpieza?.message
    );
  }
}


    return responder({
      mensaje: "No se pudo guardar el comprobante."
    }, 500);
  }
}
