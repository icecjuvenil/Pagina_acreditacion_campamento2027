/* ==================================================
   1. RECUPERACIÓN DE DATOS
   ================================================== */

function obtenerDatosGuardados(clave, valorInicial) {
    try {
        const datos = sessionStorage.getItem(clave);
        return datos ? JSON.parse(datos) : valorInicial;
    } catch (error) {
        console.error(
            `No fue posible recuperar ${clave}:`,
            error
        );

        return valorInicial;
    }
}


/* Persona inscrita mediante acreditacion.html */
let personaPrincipal = obtenerDatosGuardados(
    "personaPrincipalCampamento",
    null
);

const datosAcompanantes = obtenerDatosGuardados(
    "acompanantesCampamento",
    []
);

const acompanantes = Array.isArray(datosAcompanantes)
    ? datosAcompanantes
    : [];


/* ==================================================
   2. ELEMENTOS DE LA PÁGINA
   ================================================== */

const resumenPersonaPrincipal =
    document.getElementById("resumen-personal-principal") ||
    document.getElementById("resumen-persona-principal");

const resumenAcompanantes =
    document.getElementById("resumen-acompanantes");

const cantidadAcompanantesPago =
    document.getElementById("cantidad-acompanantes-pago");

const salidaTotal =
    document.getElementById("total-acreditacion");

const totalTransferenciaBancaria =
    document.getElementById("total-transferencia-bancaria");

const detalleTotalInscripciones =
    document.getElementById("detalle-total-inscripciones");

const enlaceVolver =
    document.getElementById("volver-formulario");




/* ==================================================
   3. FORMATO Y CREACIÓN DEL RESUMEN
   ================================================== */

function formatearDinero(valor) {
    return `$${Number(valor || 0).toLocaleString("es-CL")}`;
}

function obtenerNombrePersona(persona) {
    return persona?.nombreCompleto ||
        persona?.nombre ||
        "No informado";
}

function crearDatoPago(etiqueta, valor, claseAdicional = "") {
    const contenedor = document.createElement("div");
    contenedor.classList.add("dato-pago");

    if (claseAdicional) {
        contenedor.classList.add(claseAdicional);
    }

    const nombreDato = document.createElement("small");
    nombreDato.textContent = etiqueta;

    const contenidoDato = document.createElement("strong");
    contenidoDato.textContent = valor || "No informado";

    contenedor.append(nombreDato, contenidoDato);

    return contenedor;
}

function agregarDatosPersona(contenedor, persona) {
    contenedor.append(
        crearDatoPago(
            "Nombre completo",
            obtenerNombrePersona(persona)
        ),
        crearDatoPago(
            "RUT",
            persona?.rut
        ),
        crearDatoPago(
            "Correo",
            persona?.correo || "No informado"
        ),
        crearDatoPago(
            "Valor",
            formatearDinero(persona?.valorAcreditacion),
            "dato-valor-pago"
        )
    );
}


/* ==================================================
   4. MOSTRAR PERSONA PRINCIPAL
   ================================================== */

function mostrarPersonaPrincipal() {
    if (!resumenPersonaPrincipal) {
        return;
    }

    resumenPersonaPrincipal.replaceChildren();

    if (!personaPrincipal) {
        const mensaje = document.createElement("p");
        mensaje.className = "mensaje-sin-datos-pago";
        mensaje.textContent =
            "No se encontraron los datos de la persona principal.";

        resumenPersonaPrincipal.appendChild(mensaje);
        return;
    }

    const contenedor = document.createElement("div");
    contenedor.className = "datos-persona-pago";

    agregarDatosPersona(contenedor, personaPrincipal);
    resumenPersonaPrincipal.appendChild(contenedor);
}


/* ==================================================
   5. MOSTRAR ACOMPAÑANTES
   ================================================== */

function mostrarAcompanantes() {
    if (cantidadAcompanantesPago) {
        cantidadAcompanantesPago.textContent =
            acompanantes.length === 1
                ? "1 inscrito"
                : `${acompanantes.length} inscritos`;
    }

    if (!resumenAcompanantes) {
        return;
    }

    resumenAcompanantes.replaceChildren();

    if (acompanantes.length === 0) {
        const mensaje = document.createElement("p");
        mensaje.className = "mensaje-sin-datos-pago";
        mensaje.textContent = "No se agregaron acompañantes.";

        resumenAcompanantes.appendChild(mensaje);
        return;
    }

    acompanantes.forEach((acompanante) => {
        const fila = document.createElement("article");
        fila.className = "fila-acompanante-pago";

        agregarDatosPersona(fila, acompanante);
        resumenAcompanantes.appendChild(fila);
    });
}


/* ==================================================
   6. CÁLCULO Y PRESENTACIÓN DEL TOTAL
   ================================================== */

const valorPersonaPrincipal =
    Number(personaPrincipal?.valorAcreditacion || 0);

const valorAcompanantes = acompanantes.reduce(
    (total, acompanante) =>
        total + Number(acompanante?.valorAcreditacion || 0),
    0
);

let totalInscripcion =
    valorPersonaPrincipal +
    valorAcompanantes;

function mostrarTotal() {
    const textoTotal = personaPrincipal
        ? formatearDinero(totalInscripcion)
        : "No disponible";

    if (salidaTotal) {
        salidaTotal.textContent = textoTotal;
    }

    if (totalTransferenciaBancaria) {
        totalTransferenciaBancaria.textContent = textoTotal;
    }

    if (!detalleTotalInscripciones) {
        return;
    }

    if (!personaPrincipal) {
        detalleTotalInscripciones.textContent =
            "No se encontraron datos de la inscripción.";
        return;
    }

    const cantidad = acompanantes.length;
    const textoAcompanantes = cantidad === 1
        ? "1 acompañante"
        : `${cantidad} acompañantes`;

    detalleTotalInscripciones.textContent =
        `${1 + cantidad} inscripciones ` +
        `(1 principal + ${textoAcompanantes})`;
}


/* ==================================================
   7. ENLACE PARA VOLVER Y CORREGIR
   ================================================== */

function configurarEnlaceVolver() {
    if (!enlaceVolver) {
        return;
    }

    const parametros = new URLSearchParams(
        window.location.search
    );

    const sufijoQA = parametros.get("qa") === "1"
        ? "?qa=1"
        : "";

    enlaceVolver.href = acompanantes.length > 0
        ? `acompanantes.html${sufijoQA}`
        : `acreditacion.html${sufijoQA}`;
}


/* ==================================================
   9. ELEMENTOS DEL COMPROBANTE
   ================================================== */

const formularioComprobante =
    document.getElementById(
        "formulario-comprobante"
    );
// Método de pago seleccionado por el participante
const selectorMetodoPago =
    document.getElementById("metodo-pago");
const entradaComprobante =
    document.getElementById(
        "comprobante-transferencia"
    ) ||
    document.getElementById(
        "comprobante-tranferencia"
    );

const nombreArchivoComprobante =
    document.getElementById(
        "nombre-archivo-comprobante"
    );

const entradaFechaTransferencia =
    document.getElementById(
        "fecha-transferencia"
    );

/*
 * Se consideran las dos versiones porque el HTML
 * utiliza actualmente titular-tranferencia.
 */
const entradaTitularTransferencia =
    document.getElementById(
        "titular-tranferencia"
    ) ||
    document.getElementById(
        "titular-transferencia"
    );

const estadoPago = document.getElementById(
    "estado-pago"
);

const mensajeEstadoPago =
    document.getElementById(
        "mensaje-estado-pago"
    );


/* Oculta el formulario si falta la persona principal */
if (formularioComprobante) {
    formularioComprobante.hidden =
        !personaPrincipal;
}


/* ==================================================
   10. FECHA DE TRANSFERENCIA
   ================================================== */

const fechaActual = new Date();

const fechaLocal = new Date(
    fechaActual.getTime() -
    fechaActual.getTimezoneOffset() * 60000
);

const fechaActualFormato =
    fechaLocal.toISOString().split("T")[0];

if (entradaFechaTransferencia) {
    entradaFechaTransferencia.max = fechaActualFormato;

    entradaFechaTransferencia.addEventListener("input", () => {
        entradaFechaTransferencia.setCustomValidity("");
    });
}


/* ==================================================
   9. VALIDACIÓN DEL COMPROBANTE
   ================================================== */

const tamanioMaximoComprobante = 5 * 1024 * 1024;

const tiposPermitidos = [
    "image/jpeg",
    "image/png",
    "application/pdf"
];

const extensionesPermitidas = [
    "jpg",
    "jpeg",
    "png",
    "pdf"
];

function mostrarNombreArchivo() {
    if (!entradaComprobante || !nombreArchivoComprobante) {
        return;
    }

    const archivo = entradaComprobante.files[0];

    nombreArchivoComprobante.textContent = archivo
        ? `Archivo seleccionado: ${archivo.name}`
        : "";
}

function validarComprobante() {
    if (!entradaComprobante) {
        return false;
    }

    entradaComprobante.setCustomValidity("");

    const archivo = entradaComprobante.files[0];

    if (!archivo) {
        entradaComprobante.setCustomValidity(
            "Selecciona un comprobante."
        );

        entradaComprobante.reportValidity();
        return false;
    }

    const partesNombre = archivo.name.split(".");

    const extension = partesNombre.length > 1
        ? partesNombre.pop().toLowerCase()
        : "";

    const tipoValido =
        (
            archivo.type === "" ||
            tiposPermitidos.includes(archivo.type)
        ) &&
        extensionesPermitidas.includes(extension);

    if (!tipoValido) {
        entradaComprobante.setCustomValidity(
            "El archivo debe ser JPG, PNG o PDF."
        );

        entradaComprobante.reportValidity();
        return false;
    }

    if (archivo.size > tamanioMaximoComprobante) {
        entradaComprobante.setCustomValidity(
            "El comprobante no puede superar los 5 MB."
        );

        entradaComprobante.reportValidity();
        return false;
    }

    return true;
}

if (entradaComprobante) {
    entradaComprobante.addEventListener("change", () => {
        entradaComprobante.setCustomValidity("");
        mostrarNombreArchivo();

        if (entradaComprobante.files.length > 0) {
            validarComprobante();
        }
    });
}


/* ==================================================
   10. REGISTRO LOCAL DEL COMPROBANTE
   La carga real del archivo corresponde al backend.
   ================================================== */


/* ==================================================
   12. ENVÍO REAL DEL COMPROBANTE A CLOUDFLARE R2
   ================================================== */

// Dirección de pruebas. No publicar así en producción.
const API_PAGOS = "https://api.icec.cl";

if (
    formularioComprobante &&
    entradaComprobante &&
    entradaFechaTransferencia &&
    entradaTitularTransferencia
) {
    formularioComprobante.addEventListener(
        "submit",
        async (evento) => {
            evento.preventDefault();

            if (!personaPrincipal) {
                alert("No se encontraron los datos de la inscripción.");
                return;
            }

            if (!formularioComprobante.reportValidity()) {
                return;
            }

        if (!validarComprobante()) {
            return;
        }

            const metodoSeleccionado = selectorMetodoPago?.value;

if (
    metodoSeleccionado !== "TRANSFERENCIA" &&
    metodoSeleccionado !== "EFECTIVO"
) {
    alert("Selecciona un método de pago válido.");
    return;
}

// La fecha se valida únicamente para transferencias.
if (
    metodoSeleccionado === "TRANSFERENCIA" &&
    entradaFechaTransferencia.value > fechaActualFormato
) {
    entradaFechaTransferencia.setCustomValidity(
        "La fecha de transferencia no puede ser futura."
    );

    entradaFechaTransferencia.reportValidity();
    return;
}

entradaFechaTransferencia.setCustomValidity("");

            const archivo = entradaComprobante.files[0];

            const botonEnviar =
                formularioComprobante.querySelector(
                    'button[type="submit"]'
                );

            if (botonEnviar) {
                botonEnviar.disabled = true;
                botonEnviar.setAttribute("aria-busy", "true");
            }

            let envioExitoso = false;

            try {
                // Comprobar la sesión real antes de enviar.
                const respuestaSesion = await fetch(
                    `${API_PAGOS}/api/sesion`,
                    {
                        method: "GET",
                        credentials: "include",
                        cache: "no-store"
                    }
                );

                const sesion = await respuestaSesion
                    .json()
                    .catch(() => null);

                if (
                    !respuestaSesion.ok ||
                    sesion?.autenticado !== true
                ) {
                    throw new Error(
                        "Debes iniciar sesión antes de enviar el comprobante."
                    );
                }

                // Evitar enviar el comprobante desde
                // una sesión perteneciente a otro usuario.
                const correoInscripcion = String(
                    personaPrincipal.correo || ""
                ).trim().toLowerCase();

                const correoSesion = String(
                    sesion.usuario?.correo || ""
                ).trim().toLowerCase();

                if (
                    !correoInscripcion ||
                    correoInscripcion !== correoSesion
                ) {
                    throw new Error(
                        "La sesión iniciada no corresponde a esta inscripción. " +
                        "Inicia sesión con la cuenta correcta."
                    );
                }

                // Crear el formulario que recibirá el Worker.
                const datosEnvio = new FormData();

                // Enviar el método seleccionado
datosEnvio.append(
    "metodoPago",
    metodoSeleccionado
);

// Datos exclusivos de transferencia bancaria
if (metodoSeleccionado === "TRANSFERENCIA") {

    datosEnvio.append(
        "titularTransferencia",
        entradaTitularTransferencia.value.trim()
    );

    datosEnvio.append(
        "fechaTransferencia",
        entradaFechaTransferencia.value
    );
}

                datosEnvio.append(
                    "comprobante",
                    archivo,
                    archivo.name
                );

                // Enviar el archivo al backend.
                const respuesta = await fetch(
                    `${API_PAGOS}/api/comprobantes`,
                    {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "X-ICEC-Solicitud": "web"
                        },
                        body: datosEnvio
                    }
                );

                const resultado = await respuesta
                    .json()
                    .catch(() => null);

                if (
                    !respuesta.ok ||
                    resultado?.estado !== "EN_REVISION"
                ) {
                    throw new Error(
                        resultado?.mensaje ||
                        "No fue posible guardar el comprobante."
                    );
                }

                // Guardar un resumen local únicamente
                // después de la confirmación del backend.
                sessionStorage.setItem(
                    "pagoCampamento",
                    JSON.stringify({
                        titularTransferencia:
                            entradaTitularTransferencia.value.trim(),
                        fechaTransferencia:
                            entradaFechaTransferencia.value,
                        nombreArchivo: archivo.name,
                        estado: "pendiente_revision"
                    })
                );

                envioExitoso = true;

                if (estadoPago) {
                    estadoPago.hidden = false;
                    estadoPago.scrollIntoView({
                        behavior: "smooth",
                        block: "center"
                    });
                }

                if (mensajeEstadoPago) {
                    mensajeEstadoPago.textContent =
                        "Comprobante guardado correctamente. " +
                        "Tu pago está pendiente de revisión.";
                }

                alert(
                    "¡Comprobante recibido correctamente! " +
                    "Tu pago quedó pendiente de revisión."
                );

                // Por ahora permanecemos en pago.html.
                // La redirección se activará cuando
                // informacion.html valide la sesión
                // y el estado real de acreditación.

            } catch (error) {
                console.error(
                    "Error al enviar comprobante:",
                    error
                );

                alert(
                    error.message ||
                    "No se pudo enviar el comprobante."
                );

            } finally {
                if (botonEnviar) {
                    botonEnviar.removeAttribute("aria-busy");

                    if (!envioExitoso) {
                        botonEnviar.disabled = false;
                    }
                }
            }
        }
    );
}




/* ==================================================
   11. BENEFICIO PARA LÍDERES
   Solo interfaz: la clave se validará en el backend.
   ================================================== */

(() => {
    const casillaLider =
        document.getElementById("soy-lider");

    const camposClave =
        document.getElementById("campos-clave-lider");

    const entradaClave =
        document.getElementById("clave-lider");

    const botonValidar =
        document.getElementById("validar-clave-lider");

    const mensajeClave =
        document.getElementById("mensaje-clave-lider");

    if (!casillaLider || !camposClave || !entradaClave) {
        return;
    }

    function actualizarCampoLider() {
        const esLider = casillaLider.checked;

        camposClave.hidden = !esLider;
        entradaClave.disabled = !esLider;

        if (!esLider) {
            entradaClave.value = "";
        }

        if (mensajeClave) {
            mensajeClave.textContent = "";
        }
    }

    casillaLider.addEventListener("change", () => {
        actualizarCampoLider();

        if (casillaLider.checked) {
            entradaClave.focus();
        }
    });

    entradaClave.addEventListener("input", () => {
        if (mensajeClave) {
            mensajeClave.textContent = "";
        }
    });

    if (botonValidar) {
        
botonValidar.addEventListener("click", async () => {
    const clave = entradaClave.value;

    if (!clave.trim()) {
        mensajeClave.textContent =
            "Ingresa la palabra clave entregada.";
        entradaClave.focus();
        return;
    }

    botonValidar.disabled = true;
    mensajeClave.textContent = "Validando clave...";

    try {
        const respuesta = await fetch(
            `${API_PAGOS}/api/lideres/validar`,
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                    "X-ICEC-Solicitud": "web"
                },
                body: JSON.stringify({ clave })
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok || resultado.estado !== "OK") {
            throw new Error(
                resultado.mensaje ||
                "No fue posible validar la clave."
            );
        }

        mensajeClave.textContent = resultado.mensaje;
entradaClave.value = "";

// Actualizar inmediatamente los valores
// confirmados por Cloudflare D1.
if (resultado.beneficioLider === true) {

    personaPrincipal.valorAcreditacion =
        Number(resultado.valorLider);

    totalInscripcion =
        Number(resultado.montoTotal);

    // Actualizar el valor del líder.
    mostrarPersonaPrincipal();

    // Actualizar el total y los datos bancarios.
    mostrarTotal();
}

// Sincronizar nuevamente con la base de datos.
await cargarResumenDesdeD1();
        // Impedir volver a enviar el mismo beneficio.
        botonValidar.disabled = true;
        entradaClave.disabled = true;
        casillaLider.disabled = true;

    } catch (error) {
        mensajeClave.textContent =
            error.message || "Error al validar la clave.";

        botonValidar.disabled = false;
    }
});

    }

    actualizarCampoLider();
})();


/* ==================================================
   12. CARGA INICIAL
   ================================================== */


/* ==================================================
   13. CARGA INICIAL
   ================================================== */


/* ==================================================
   13. CARGA DEL RESUMEN DESDE CLOUDFLARE D1
   ================================================== */

async function cargarResumenDesdeD1() {

    // Ocultar el formulario mientras se
    // recuperan los datos del servidor.
    if (formularioComprobante) {
        formularioComprobante.hidden = true;
    }

    try {
        const respuesta = await fetch(
            "https://api.icec.cl/api/resumen",
            {
                method: "GET",
                credentials: "include",
                cache: "no-store"
            }
        );

        const datos = await respuesta
            .json()
            .catch(() => null);

        if (!respuesta.ok) {
            throw new Error(
                datos?.mensaje ||
                "No se pudo recuperar la inscripción."
            );
        }

        if (
            datos?.estado !== "OK" ||
            !datos.participante ||
            !Array.isArray(datos.acompanantes) ||
            !datos.pago
        ) {
            throw new Error(
                "El servidor entregó un resumen incompleto."
            );
        }
        // Redirigir a información cuando el pago esté aprobado.
if (datos.pago.estado === "APROBADO") {
    window.location.replace("informacion.html");
    return;
}

        // Recuperar los datos del participante
        // que realmente inició sesión.
        personaPrincipal = datos.participante;

        // Actualizar la lista de acompañantes
        // con los registros de D1.
        acompanantes.splice(
            0,
            acompanantes.length,
            ...datos.acompanantes
        );

        // Utilizar el total calculado en D1,
        // nunca uno almacenado en el navegador.
        const montoServidor =
            Number(datos.pago.montoTotal);

        if (
            !Number.isSafeInteger(montoServidor) ||
            montoServidor < 0
        ) {
            throw new Error(
                "El monto de la inscripción no es válido."
            );
        }

        totalInscripcion = montoServidor;

        // Actualizar los elementos de la página.
        mostrarPersonaPrincipal();
        mostrarAcompanantes();
        mostrarTotal();
        configurarEnlaceVolver();
        mostrarNombreArchivo();

        // Mientras no exista edición del perfil,
        // evitar que este enlace lleve a crear
        // una segunda inscripción.
        if (enlaceVolver) {
            enlaceVolver.href = "acompanantes.html";
            enlaceVolver.textContent =
                "← Volver a acompañantes";
        }

        // Solo permitir enviar comprobantes
        // cuando el pago siga pendiente.
        
const puedeEnviarComprobante =
    (
        (
            datos.pago.estado === "PENDIENTE" &&
            datos.pago.comprobanteRecibido === false
        ) ||
        datos.pago.estado === "RECHAZADO"
    ) &&
    Number(datos.pago.montoPagado) === 0 &&
    totalInscripcion > 0;


        if (formularioComprobante) {
            formularioComprobante.hidden =
                !puedeEnviarComprobante;
        }
            
if (
    datos.pago.estado === "RECHAZADO" &&
    mensajeEstadoPago
) {
    const motivo = datos.pago.motivoRechazo?.trim();

    mensajeEstadoPago.textContent = motivo
        ? `Tu comprobante fue rechazado. Motivo: ${motivo}. Puedes enviar un nuevo comprobante utilizando el formulario.`
        : "Tu comprobante fue rechazado. Puedes enviar un nuevo comprobante utilizando el formulario.";

    if (estadoPago) {
        estadoPago.hidden = false;
    }
}

        if (
            !puedeEnviarComprobante &&
            mensajeEstadoPago
        ) {
            if (datos.pago.comprobanteRecibido) {
                mensajeEstadoPago.textContent =
                    "Ya recibimos tu comprobante. " +
                    "Tu pago está pendiente de revisión.";
            } else if (
                datos.pago.estado === "APROBADO"
            ) {
                mensajeEstadoPago.textContent =
                    "Tu pago está aprobado.";
            } else if (totalInscripcion === 0) {
                mensajeEstadoPago.textContent =
                    "Esta inscripción no requiere transferencia.";
            } else {
                mensajeEstadoPago.textContent =
                    "No es posible enviar un comprobante " +
                    "con el estado actual del pago.";
            }

            if (estadoPago) {
                estadoPago.hidden = false;
            }
        }

        console.log(
            "Resumen recuperado desde D1:",
            {
                participante:
                    personaPrincipal.nombreCompleto,
                acompanantes: acompanantes.length,
                total: totalInscripcion,
                estadoPago: datos.pago.estado
            }
        );

    } catch (error) {
        console.error(
            "Error al recuperar inscripción:",
            error
        );

        if (resumenPersonaPrincipal) {
            const mensaje = document.createElement("p");
            mensaje.className = "mensaje-sin-datos-pago";
            mensaje.textContent = error.message;

            resumenPersonaPrincipal.replaceChildren(
                mensaje
            );
        }

        if (salidaTotal) {
            salidaTotal.textContent = "No disponible";
        }

        if (totalTransferenciaBancaria) {
            totalTransferenciaBancaria.textContent =
                "No disponible";
        }

        if (formularioComprobante) {
            formularioComprobante.hidden = true;
        }
    }
}

// Consultar automáticamente cuando abre pago.html.
cargarResumenDesdeD1();
// Comprobar cada 15 segundos si el pago fue aprobado.
setInterval(async () => {
    if (document.visibilityState !== "visible") {
        return;
    }

    try {
        const respuesta = await fetch(
            "https://api.icec.cl/api/resumen",
            {
                method: "GET",
                credentials: "include",
                cache: "no-store"
            }
        );

        if (!respuesta.ok) return;

        const datos = await respuesta.json();

        if (datos.pago?.estado === "APROBADO") {
            window.location.replace("informacion.html");
        }

    } catch (error) {
        console.error(
            "No se pudo comprobar el estado del pago:",
            error
        );
    }
}, 15000);


/* ==================================================
   13. DATOS PARA PRUEBAS LOCALES
   ================================================== */

(() => {
    const parametrosPagina = new URLSearchParams(
        window.location.search
    );

    const sitioLocal = [
        "localhost",
        "127.0.0.1",
        "::1"
    ].includes(window.location.hostname);

    const modoQA =
        sitioLocal &&
        parametrosPagina.get("qa") === "1";

    if (!modoQA) {
        return;
    }

    if (entradaTitularTransferencia) {
        entradaTitularTransferencia.value =
            "Titular de prueba QA";
    }

    if (entradaFechaTransferencia) {
        entradaFechaTransferencia.value =
            fechaActualFormato;
    }

    console.log(
        "Modo QA del pago cargado correctamente"
    );
})();