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

const personaPrincipal = obtenerDatosGuardados(
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

const formularioComprobante =
    document.getElementById("formulario-comprobante");

const entradaComprobante =
    document.getElementById("comprobante-transferencia") ||
    document.getElementById("comprobante-tranferencia");

const nombreArchivoComprobante =
    document.getElementById("nombre-archivo-comprobante");

const entradaFechaTransferencia =
    document.getElementById("fecha-transferencia");

const entradaTitularTransferencia =
    document.getElementById("titular-tranferencia") ||
    document.getElementById("titular-transferencia");

const estadoPago =
    document.getElementById("estado-pago");

const mensajeEstadoPago =
    document.getElementById("mensaje-estado-pago");


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

const totalInscripcion =
    valorPersonaPrincipal + valorAcompanantes;

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
   8. FECHA DE TRANSFERENCIA
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

if (formularioComprobante) {
    formularioComprobante.hidden = !personaPrincipal;
}

if (
    formularioComprobante &&
    entradaComprobante &&
    entradaFechaTransferencia &&
    entradaTitularTransferencia
) {
    formularioComprobante.addEventListener("submit", (evento) => {
        evento.preventDefault();

        if (!personaPrincipal) {
            alert("No se encontraron los datos de la inscripción.");
            return;
        }

        entradaFechaTransferencia.setCustomValidity("");

        if (
            entradaFechaTransferencia.value >
            fechaActualFormato
        ) {
            entradaFechaTransferencia.setCustomValidity(
                "La fecha de transferencia no puede ser futura."
            );
        }

        if (!formularioComprobante.checkValidity()) {
            formularioComprobante.reportValidity();
            return;
        }

        if (!validarComprobante()) {
            return;
        }

        const archivo = entradaComprobante.files[0];

        const datosComprobante = {
            titularTransferencia:
                entradaTitularTransferencia.value.trim(),
            fechaTransferencia:
                entradaFechaTransferencia.value,
            nombreArchivo:
                archivo.name,
            tipoArchivo:
                archivo.type,
            tamanioArchivo:
                archivo.size,
            totalEsperado:
                totalInscripcion,
            estado:
                "pendiente_revision"
        };

        sessionStorage.setItem(
            "pagoCampamento",
            JSON.stringify(datosComprobante)
        );

        if (estadoPago) {
            estadoPago.hidden = false;

            estadoPago.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }

        if (mensajeEstadoPago) {
            mensajeEstadoPago.textContent =
                "Datos del comprobante guardados en este navegador. " +
                "La carga al servidor está pendiente de integración.";
        }

        /* Conserva la navegación del prototipo actual */
        setTimeout(() => {
            window.location.href = "informacion.html";
        }, 1200);
    });
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
        botonValidar.addEventListener("click", () => {
            if (!mensajeClave) {
                return;
            }

            if (!entradaClave.value.trim()) {
                mensajeClave.textContent =
                    "Ingresa la palabra clave entregada.";

                entradaClave.focus();
                return;
            }

            mensajeClave.textContent =
                "La validación de líderes está pendiente de conexión. " +
                "El beneficio todavía no se ha aplicado.";
        });
    }

    actualizarCampoLider();
})();


/* ==================================================
   12. CARGA INICIAL
   ================================================== */

mostrarPersonaPrincipal();
mostrarAcompanantes();
mostrarTotal();
configurarEnlaceVolver();
mostrarNombreArchivo();


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