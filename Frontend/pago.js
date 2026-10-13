// Recupera información guardada durante la acreditación
function obtenerDatosGuardados(clave, valorInicial) {
    const datosGuardados =
        sessionStorage.getItem(clave);

    if (!datosGuardados) {
        return valorInicial;
    }

    try {
        return JSON.parse(datosGuardados);
    } catch (error) {
        return valorInicial;
    }
}

// Recupera la persona principal
const personaPrincipal = obtenerDatosGuardados(
    "personaPrincipalCampamento",
    null
);

// Recupera los acompañantes
const acompanantes = obtenerDatosGuardados(
    "acompanantesCampamento",
    []
);

// Obtiene los elementos del resumen
const resumenPersonaPrincipal =
    document.getElementById(
        "resumen-personal-principal"
    ) ||
    document.getElementById(
        "resumen-persona-principal"
    );

const resumenAcompanantes = document.getElementById(
    "resumen-acompanantes"
);

const salidaTotal = document.getElementById(
    "total-acreditacion"
);

const enlaceVolver = document.getElementById(
    "volver-formulario"
);

const referenciaTransferencia =
    document.getElementById(
        "referencia-transferencia"
    );

const formularioComprobante =
    document.getElementById(
        "formulario-comprobante"
    );

// Agrega un dato al resumen sin insertar HTML del usuario
function agregarDato(contenedor, etiqueta, valor) {
    const parrafo = document.createElement("p");

    const nombreDato =
        document.createElement("strong");

    nombreDato.textContent =
        `${etiqueta}: `;

    const contenidoDato =
        document.createTextNode(
            valor || "No informado"
        );

    parrafo.append(
        nombreDato,
        contenidoDato
    );

    contenedor.appendChild(parrafo);
}

// Crea una tarjeta resumida de una persona
function crearTarjetaPersona(persona, titulo) {
    const tarjeta =
        document.createElement("article");

    tarjeta.classList.add(
        "tarjeta-resumen-pago"
    );

    const encabezado =
        document.createElement("h3");

    encabezado.textContent = titulo;

    tarjeta.appendChild(encabezado);

    agregarDato(
        tarjeta,
        "Nombre",
        persona.nombreCompleto ||
            persona.nombre
    );

    agregarDato(
        tarjeta,
        "RUT",
        persona.rut
    );

    agregarDato(
        tarjeta,
        "Correo",
        persona.correo ||
            "No informado"
    );

    agregarDato(
        tarjeta,
        "Valor",
        `$${Number(
            persona.valorAcreditacion || 0
        ).toLocaleString("es-CL")}`
    );

    return tarjeta;
}

// Muestra la persona principal
if (resumenPersonaPrincipal) {
    resumenPersonaPrincipal.textContent = "";

    if (personaPrincipal) {
        resumenPersonaPrincipal.appendChild(
            crearTarjetaPersona(
                personaPrincipal,
                personaPrincipal.nombreCompleto ||
                    "Persona principal"
            )
        );
    } else {
        const mensaje =
            document.createElement("p");

        mensaje.textContent =
            "No se encontraron los datos de la persona principal.";

        resumenPersonaPrincipal.appendChild(
            mensaje
        );
    }
}

// Coloca el RUT como referencia de transferencia
if (referenciaTransferencia) {
    referenciaTransferencia.textContent =
        personaPrincipal?.rut ||
        "No disponible";
}

// Oculta el formulario si no existe una persona principal
if (formularioComprobante) {
    formularioComprobante.hidden =
        !personaPrincipal;
}

// Muestra los acompañantes
if (resumenAcompanantes) {
    resumenAcompanantes.textContent = "";

    if (
        !Array.isArray(acompanantes) ||
        acompanantes.length === 0
    ) {
        const mensaje =
            document.createElement("p");

        mensaje.textContent =
            "No se agregaron acompañantes.";

        resumenAcompanantes.appendChild(
            mensaje
        );
    } else {
        acompanantes.forEach(
            (acompanante, posicion) => {
                resumenAcompanantes.appendChild(
                    crearTarjetaPersona(
                        acompanante,
                        `Acompañante ${posicion + 1}`
                    )
                );
            }
        );
    }
}

// Decide a qué formulario debe regresar
if (enlaceVolver) {
    const parametrosActuales =
        new URLSearchParams(
            window.location.search
        );

    const estaEnModoQA =
        parametrosActuales.get("qa") === "1";

    if (
        Array.isArray(acompanantes) &&
        acompanantes.length > 0
    ) {
        enlaceVolver.href =
            estaEnModoQA
                ? "acompanantes.html?qa=1"
                : "acompanantes.html";
    } else {
        enlaceVolver.href =
            estaEnModoQA
                ? "acreditacion.html?qa=1"
                : "acreditacion.html";
    }
}

// Calcula el valor de la persona principal
const valorPersonaPrincipal = Number(
    personaPrincipal?.valorAcreditacion ||
    0
);

// Calcula el valor de todos los acompañantes
const valorAcompanantes = Array.isArray(
    acompanantes
)
    ? acompanantes.reduce(
        (total, acompanante) =>
            total +
            Number(
                acompanante.valorAcreditacion ||
                0
            ),
        0
    )
    : 0;

// Calcula el total de la inscripción
const totalInscripcion =
    valorPersonaPrincipal +
    valorAcompanantes;

// Muestra el total
if (salidaTotal) {
    if (personaPrincipal) {
        salidaTotal.textContent =
            `$${totalInscripcion.toLocaleString(
                "es-CL"
            )}`;
    } else {
        salidaTotal.textContent =
            "Total no disponible";
    }
}

// Obtiene los elementos del comprobante
const entradaComprobante =
    document.getElementById(
        "comprobante-transferencia"
    ) ||
    document.getElementById(
        "comprobante-tranferencia"
    );

const entradaFechaTransferencia =
    document.getElementById(
        "fecha-transferencia"
    );

const entradaTitularTransferencia =
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

// Configuración permitida para el comprobante
const tamanioMaximoComprobante =
    5 * 1024 * 1024;

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

// Obtiene la fecha actual local
const fechaActual = new Date();

const fechaLocal = new Date(
    fechaActual.getTime() -
    fechaActual.getTimezoneOffset() *
        60000
);

const fechaActualFormato =
    fechaLocal
        .toISOString()
        .split("T")[0];

// Impide seleccionar una fecha futura
if (entradaFechaTransferencia) {
    entradaFechaTransferencia.max =
        fechaActualFormato;
}

// Valida el comprobante seleccionado
function validarComprobante() {
    if (!entradaComprobante) {
        return false;
    }

    entradaComprobante.setCustomValidity("");

    const archivo =
        entradaComprobante.files[0];

    if (!archivo) {
        entradaComprobante.setCustomValidity(
            "Selecciona un comprobante."
        );

        entradaComprobante.reportValidity();
        return false;
    }

    const extension = archivo.name
        .split(".")
        .pop()
        .toLowerCase();

    const tipoValido =
        tiposPermitidos.includes(
            archivo.type
        ) &&
        extensionesPermitidas.includes(
            extension
        );

    if (!tipoValido) {
        entradaComprobante.setCustomValidity(
            "El archivo debe ser JPG, PNG o PDF."
        );

        entradaComprobante.reportValidity();
        return false;
    }

    if (
        archivo.size >
        tamanioMaximoComprobante
    ) {
        entradaComprobante.setCustomValidity(
            "El comprobante no puede superar los 5 MB."
        );

        entradaComprobante.reportValidity();
        return false;
    }

    return true;
}

// Revisa el comprobante al seleccionar un archivo
if (entradaComprobante) {
    entradaComprobante.addEventListener(
        "change",
        validarComprobante
    );
}

// Registra temporalmente el comprobante para la prueba
if (
    formularioComprobante &&
    entradaComprobante &&
    entradaFechaTransferencia &&
    entradaTitularTransferencia
) {
    formularioComprobante.addEventListener(
        "submit",
        (evento) => {
            evento.preventDefault();

            if (!personaPrincipal) {
                alert(
                    "No se encontraron los datos de la inscripción."
                );

                return;
            }

            if (!validarComprobante()) {
                return;
            }

            if (
                entradaFechaTransferencia.value >
                fechaActualFormato
            ) {
                entradaFechaTransferencia.setCustomValidity(
                    "La fecha de transferencia no puede ser futura."
                );

                entradaFechaTransferencia.reportValidity();
                return;
            }

            entradaFechaTransferencia.setCustomValidity(
                ""
            );

            const archivo =
                entradaComprobante.files[0];

            const datosComprobante = {
                titularTransferencia:
                    entradaTitularTransferencia
                        .value
                        .trim(),

                fechaTransferencia:
                    entradaFechaTransferencia
                        .value,

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
                JSON.stringify(
                    datosComprobante
                )
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
                    "Comprobante recibido. El pago está pendiente de revisión.";
            }
        }
    );
}

// Completa los datos del pago en modo QA
(() => {
    const parametrosPagina =
        new URLSearchParams(
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