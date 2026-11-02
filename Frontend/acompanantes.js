
/*
 * ICEC 2027 - Registro de acompañantes
 * Cloudflare Workers + D1
 */

const API_ACOMPANANTES =
  //"https://icec-campamento-2027-api.brantemarco777.workers.dev";
  "http://127.0.0.1:8787"

const formularioAcompanante = document.getElementById(
  "formulario-acompanante"
);

const listaAcompanantes = document.getElementById(
  "lista-acompanantes-guardados"
);

const cantidadAcompanantes = document.getElementById(
  "cantidad-acompanantes"
);

const botonContinuar = document.getElementById(
  "continuar-resumen"
);

const entradaFechaAcompanante = document.getElementById(
  "fecha-acompanante"
);

const salidaValorAcompanante = document.getElementById(
  "valor-acompanante"
);

const botonGuardar = document.getElementById(
  "guardar-acompanante"
);

let acompanantesGuardados = [];
let guardando = false;

// ==========================================
// CONSULTAS AL BACKEND
// ==========================================

async function solicitarAPI(ruta, opciones = {}) {
  let respuesta;

  try {
    respuesta = await fetch(
      API_ACOMPANANTES + ruta,
      {
        credentials: "include",
        cache: "no-store",
        ...opciones
      }
    );
  } catch {
    throw new Error(
      "No se pudo conectar con Cloudflare. " +
      "Verifica tu conexión."
    );
  }

  let datos;

  try {
    datos = await respuesta.json();
  } catch {
    throw new Error("Respuesta no válida del servidor.");
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      throw new Error(
        "Debes iniciar sesión antes de registrar acompañantes."
      );
    }

    throw new Error(
      datos.mensaje || "Ocurrió un error."
    );
  }

  return datos;
}

// ==========================================
// FECHA Y VALOR DE ACREDITACIÓN
// ==========================================

const fechaCampamento = new Date(
  2027, 0, 8
);

function obtenerTarifa(fecha) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return null;
  }

  const [anio, mes, dia] = fecha.split("-").map(Number);

  const nacimiento = new Date(
    anio, mes - 1, dia
  );

  if (
    nacimiento.getFullYear() !== anio ||
    nacimiento.getMonth() !== mes - 1 ||
    nacimiento.getDate() !== dia
  ) {
    return null;
  }

  if (
    nacimiento > new Date() ||
    nacimiento > fechaCampamento
  ) {
    return null;
  }

  let edad = 2027 - anio;

  if (mes > 1 || (mes === 1 && dia > 8)) {
    edad--;
  }

  const valor = edad <= 5
    ? 0
    : edad <= 10
      ? 10000
      : 20000;

  return { edad, valor };
}

function actualizarValorAcompanante() {
  if (!salidaValorAcompanante) return;

  const tarifa = obtenerTarifa(
    entradaFechaAcompanante?.value || ""
  );

  if (!tarifa) {
    salidaValorAcompanante.textContent =
      "Selecciona una fecha de nacimiento válida";

    salidaValorAcompanante.dataset.valor = "";
    return;
  }

  let categoria = "Tarifa general";

  if (tarifa.valor === 0) {
    categoria = "Sin costo";
  } else if (tarifa.valor === 10000) {
    categoria = "Tarifa niño";
  }

  salidaValorAcompanante.textContent =
    `$${tarifa.valor.toLocaleString("es-CL")} ` +
    `(${tarifa.edad} años - ${categoria})`;

  salidaValorAcompanante.dataset.valor =
    String(tarifa.valor);
}

// ==========================================
// CAMPOS MÉDICOS CONDICIONALES
// ==========================================

const preguntasSalud = document.querySelectorAll(
  ".pregunta-salud-acompanante"
);

function actualizarPreguntasSalud() {
  preguntasSalud.forEach(pregunta => {
    const campo = document.getElementById(
      pregunta.dataset.campo
    );

    const entrada = document.getElementById(
      pregunta.dataset.entrada
    );

    if (!campo || !entrada) return;

    const mostrar = pregunta.value === "si";

    campo.hidden = !mostrar;
    entrada.required = mostrar;

    if (!mostrar) {
      entrada.value = "";
    }
  });
}

preguntasSalud.forEach(pregunta => {
  pregunta.addEventListener(
    "change",
    actualizarPreguntasSalud
  );
});

// ==========================================
// NORMALIZACIÓN
// ==========================================

function normalizarRut(rut) {
  return String(rut || "")
    .replace(/[^0-9kK]/g, "")
    .toUpperCase();
}

function normalizarCorreo(correo) {
  return String(correo || "")
    .trim()
    .toLowerCase();
}

function formatearFecha(fecha) {
  if (!fecha) return "No informada";

  const [anio, mes, dia] = fecha.split("-");

  return `${dia}/${mes}/${anio}`;
}

// ==========================================
// SINCRONIZACIÓN TEMPORAL DEL RESUMEN
// ==========================================

function guardarResumenLocal() {
  /*
   * Mantiene compatibilidad con pago.js.
   * Los datos médicos no se guardan aquí.
   * D1 sigue siendo la fuente de datos real.
   */

  const resumen = acompanantesGuardados.map(a => ({
    id: a.id,
    nombre: a.nombre,
    rut: a.rut,
    fechaNacimiento: a.fechaNacimiento,
    genero: a.genero,
    valorAcreditacion: a.valorAcreditacion
  }));

  sessionStorage.setItem(
    "acompanantesCampamento",
    JSON.stringify(resumen)
  );
}

// ==========================================
// CONTADOR Y LISTA
// ==========================================

function actualizarCantidad() {
  if (!cantidadAcompanantes) return;

  const cantidad = acompanantesGuardados.length;

  cantidadAcompanantes.textContent =
    cantidad === 1
      ? "1 acompañante"
      : `${cantidad} acompañantes`;
}

function crearTarjetaAcompanante(a) {
  const tarjeta = document.createElement("article");
  tarjeta.className = "tarjeta-acompanante";

  const encabezado = document.createElement("div");
  encabezado.className = "encabezado-acompanante";

  const resumen = document.createElement("div");
  resumen.className = "resumen-acompanante-guardado";

  const avatar = document.createElement("div");
  avatar.className = "avatar-acompanante";
  avatar.setAttribute("aria-hidden", "true");
  avatar.textContent = "●";

  const datos = document.createElement("div");
  datos.className = "datos-acompanante-guardado";

  const titulo = document.createElement("h3");
  titulo.textContent = a.nombre;

  const informacion = document.createElement("p");

  informacion.textContent =
    `RUT: ${a.rut} | ` +
    `Nacimiento: ${formatearFecha(a.fechaNacimiento)} | ` +
    `$${Number(a.valorAcreditacion).toLocaleString("es-CL")}`;

  datos.append(titulo, informacion);
  resumen.append(avatar, datos);

  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "boton-eliminar-acompanante";
  boton.textContent = "Eliminar";
  boton.setAttribute(
    "aria-label",
    `Eliminar a ${a.nombre}`
  );

  boton.addEventListener("click", () => {
    eliminarAcompanante(a);
  });

  encabezado.append(resumen, boton);
  tarjeta.appendChild(encabezado);

  return tarjeta;
}

function mostrarAcompanantes() {
  if (!listaAcompanantes) return;

  listaAcompanantes.replaceChildren();
  actualizarCantidad();

  if (acompanantesGuardados.length === 0) {
    const mensaje = document.createElement("p");
    mensaje.id = "mensaje-sin-acompanantes";
    mensaje.className = "mensaje-sin-acompanantes";
    mensaje.textContent =
      "Todavía no has agregado acompañantes.";

    listaAcompanantes.appendChild(mensaje);
    return;
  }

  acompanantesGuardados.forEach(a => {
    listaAcompanantes.appendChild(
      crearTarjetaAcompanante(a)
    );
  });
}

function actualizarDesdeServidor(datos) {
  acompanantesGuardados = Array.isArray(
    datos.acompanantes
  ) ? datos.acompanantes : [];

  guardarResumenLocal();
  mostrarAcompanantes();
}

// ==========================================
// CARGAR ACOMPAÑANTES DESDE D1
// ==========================================

async function cargarAcompanantes() {
  try {
    const datos = await solicitarAPI(
      "/api/acompanantes"
    );

    actualizarDesdeServidor(datos);
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

// ==========================================
// AGREGAR ACOMPAÑANTE
// ==========================================

async function agregarAcompanante(evento) {
  evento.preventDefault();

  if (guardando) return;

  if (!formularioAcompanante.reportValidity()) {
    return;
  }

  const tarifa = obtenerTarifa(
    entradaFechaAcompanante.value
  );

  // Un valor de $0 es válido para niños pequeños.
  if (!tarifa) {
    alert("Selecciona una fecha de nacimiento válida.");
    entradaFechaAcompanante.focus();
    return;
  }

  const datos = Object.fromEntries(
    new FormData(formularioAcompanante).entries()
  );

  const rut = normalizarRut(datos.rut);
  const correo = normalizarCorreo(datos.correo);

  if (acompanantesGuardados.some(a =>
    normalizarRut(a.rut) === rut
  )) {
    alert("Ya registraste un acompañante con ese RUT.");
    return;
  }

  if (correo && acompanantesGuardados.some(a =>
    normalizarCorreo(a.correo) === correo
  )) {
    alert("Ya registraste un acompañante con ese correo.");
    return;
  }

  guardando = true;

  if (botonGuardar) {
    botonGuardar.disabled = true;
  }

  try {
    const resultado = await solicitarAPI(
      "/api/acompanantes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ICEC-Solicitud": "web"
        },
        body: JSON.stringify(datos)
      }
    );

    actualizarDesdeServidor(resultado);

    formularioAcompanante.reset();
    actualizarPreguntasSalud();
    actualizarValorAcompanante();

    alert("Acompañante registrado correctamente en D1.");

    document.getElementById(
      "nombre-acompanante"
    )?.focus();

  } catch (error) {
    console.error(error);
    alert(error.message);

  } finally {
    guardando = false;

    if (botonGuardar) {
      botonGuardar.disabled = false;
    }
  }
}

// ==========================================
// ELIMINAR ACOMPAÑANTE
// ==========================================

async function eliminarAcompanante(a) {
  const confirmar = confirm(
    `¿Deseas eliminar a ${a.nombre} de la inscripción?`
  );

  if (!confirmar) return;

  try {
    const resultado = await solicitarAPI(
      `/api/acompanantes/${a.id}`,
      {
        method: "DELETE",
        headers: {
          "X-ICEC-Solicitud": "web"
        }
      }
    );

    actualizarDesdeServidor(resultado);

    alert("Acompañante eliminado correctamente.");

  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

// ==========================================
// CONTINUAR A RESUMEN Y PAGO
// ==========================================

async function continuarPago() {
  try {
    // Refresca datos antes del resumen.
    const datos = await solicitarAPI(
      "/api/acompanantes"
    );

    actualizarDesdeServidor(datos);

    if (acompanantesGuardados.length === 0) {
      alert("Debes registrar al menos un acompañante.");
      return;
    }

    const parametros = new URLSearchParams(
      window.location.search
    );

    const modoQA = parametros.get("qa") === "1";

    window.location.href = modoQA
      ? "pago.html?qa=1"
      : "pago.html";

  } catch (error) {
    alert(error.message);
  }
}

// ==========================================
// EVENTOS E INICIALIZACIÓN
// ==========================================

if (entradaFechaAcompanante) {
  entradaFechaAcompanante.addEventListener(
    "input",
    actualizarValorAcompanante
  );

  entradaFechaAcompanante.addEventListener(
    "change",
    actualizarValorAcompanante
  );
}

if (formularioAcompanante) {
  formularioAcompanante.addEventListener(
    "submit",
    agregarAcompanante
  );
}

if (botonContinuar) {
  botonContinuar.addEventListener(
    "click",
    continuarPago
  );
}

actualizarPreguntasSalud();
actualizarValorAcompanante();
mostrarAcompanantes();
cargarAcompanantes();
