/* ==================================================
   1. RECUPERACIÓN SEGURA DE DATOS
   ================================================== */

function obtenerDatosGuardados(
    clave,
    valorInicial
) {
    const datosGuardados =
        sessionStorage.getItem(clave);

    if (!datosGuardados) {
        return valorInicial;
    }

    try {
        return JSON.parse(datosGuardados);
    } catch (error) {
        console.error(
            `No fue posible recuperar ${clave}:`,
            error
        );

        return valorInicial;
    }
}


/* Persona inscrita mediante acreditacion.html */
const personaPrincipal = obtenerDatosGuardados(
    "personaPrincipalCampamento",
    null
);

/* Personas agregadas mediante acompanantes.html */
const datosAcompanantes = obtenerDatosGuardados(
    "acompanantesCampamento",
    []
);

const acompanantes = Array.isArray(
    datosAcompanantes
)
    ? datosAcompanantes
    : [];


/* ==================================================
   2. ELEMENTOS DEL RESUMEN
   ================================================== */

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

const cantidadAcompanantesPago =
    document.getElementById(
        "cantidad-acompanantes-pago"
    );

const salidaTotal = document.getElementById(
    "total-acreditacion"
);

const totalTransferenciaBancaria =
    document.getElementById(
        "total-transferencia-bancaria"
    );

const detalleTotalInscripciones =
    document.getElementById(
        "detalle-total-inscripciones"
    );

const enlaceVolver = document.getElementById(
    "volver-formulario"
);


/* ==================================================
   3. FUNCIONES DE FORMATO
   ================================================== */

function formatearDinero(valor) {
    const numero = Number(valor || 0);

    return `$${numero.toLocaleString("es-CL")}`;
}

function obtenerNombrePersona(persona) {
    return (
        persona?.nombreCompleto ||
        persona?.nombre ||
        "No informado"
    );
}

function obtenerCorreoPersona(persona) {
    return persona?.correo || "No informado";
}


/* ==================================================
   4. CREACIÓN DE DATOS DEL RESUMEN
   ================================================== */

function crearDatoPago(
    etiqueta,
    valor,
    claseAdicional = ""
) {
    const contenedor =
        document.createElement("div");

    contenedor.classList.add("dato-pago");

    if (claseAdicional) {
        contenedor.classList.add(
            claseAdicional
        );
    }

    const nombreDato =
        document.createElement("small");

    nombreDato.textContent = etiqueta;

    const contenidoDato =
        document.createElement("strong");

    contenidoDato.textContent =
        valor || "No informado";

    contenedor.append(
        nombreDato,
        contenidoDato
    );

    return contenedor;
}


/* Crea los cuatro datos de una persona */
function crearResumenPersona(persona) {
    const contenedor =
        document.createElement("div");

    contenedor.classList.add(
        "datos-persona-pago"
    );

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
            obtenerCorreoPersona(persona)
        ),

        crearDatoPago(
            "Valor",
            formatearDinero(
                persona?.valorAcreditacion
            ),
            "dato-valor-pago"
        )
    );

    return contenedor;
}


/* Crea una fila para un acompañante */
function crearFilaAcompanante(acompanante) {
    const fila = document.createElement("article");

    fila.classList.add(
        "fila-acompanante-pago"
    );

    fila.append(
        crearDatoPago(
            "Nombre completo",
            obtenerNombrePersona(acompanante)
        ),

        crearDatoPago(
            "RUT",
            acompanante?.rut
        ),

        crearDatoPago(
            "Correo",
            obtenerCorreoPersona(acompanante)
        ),

        crearDatoPago(
            "Valor",
            formatearDinero(
                acompanante?.valorAcreditacion
            ),
            "dato-valor-pago"
        )
    );

    return fila;
}


/* ==================================================
   5. PERSONA PRINCIPAL
   ================================================== */

function mostrarPersonaPrincipal() {
    if (!resumenPersonaPrincipal) {
        return;
    }

    resumenPersonaPrincipal.replaceChildren();

    if (!personaPrincipal) {
        const mensaje =
            document.createElement("p");

        mensaje.classList.add(
            "mensaje-sin-datos-pago"
        );

        mensaje.textContent =
            "No se encontraron los datos de la persona principal.";

        resumenPersonaPrincipal.appendChild(
            mensaje
        );

        return;
    }

    resumenPersonaPrincipal.appendChild(
        crearResumenPersona(
            personaPrincipal
        )
    );
}


/* ==================================================
   6. ACOMPAÑANTES
   ================================================== */

function actualizarCantidadAcompanantes() {
    if (!cantidadAcompanantesPago) {
        return;
    }

    const cantidad = acompanantes.length;

    cantidadAcompanantesPago.textContent =
        cantidad === 1
            ? "1 inscrito"
            : `${cantidad} inscritos`;
}

function mostrarAcompanantes() {
    if (!resumenAcompanantes) {
        return;
    }

    resumenAcompanantes.replaceChildren();

    actualizarCantidadAcompanantes();

    if (acompanantes.length === 0) {
        const mensaje =
            document.createElement("p");

        mensaje.classList.add(
            "mensaje-sin-datos-pago"
        );

        mensaje.textContent =
            "No se agregaron acompañantes.";

        resumenAcompanantes.appendChild(
            mensaje
        );

        return;
    }

    acompanantes.forEach((acompanante) => {
        resumenAcompanantes.appendChild(
            crearFilaAcompanante(
                acompanante
            )
        );
    });
}


/* ==================================================
   7. CÁLCULO DEL TOTAL
   ================================================== */

const valorPersonaPrincipal = Number(
    personaPrincipal?.valorAcreditacion || 0
);

const valorAcompanantes = acompanantes.reduce(
    (total, acompanante) => {
        return (
            total +
            Number(
                acompanante?.valorAcreditacion || 0
            )
        );
    },
    0
);

const totalInscripcion =
    valorPersonaPrincipal +
    valorAcompanantes;

function mostrarTotal() {
    const existeInscripcion =
        Boolean(personaPrincipal);

    const textoTotal = existeInscripcion
        ? formatearDinero(totalInscripcion)
        : "No disponible";

    if (salidaTotal) {
        salidaTotal.textContent = textoTotal;
    }

    if (totalTransferenciaBancaria) {
        totalTransferenciaBancaria.textContent =
            textoTotal;
    }

    if (detalleTotalInscripciones) {
        if (!existeInscripcion) {
            detalleTotalInscripciones.textContent =
                "No se encontraron datos de la inscripción.";

            return;
        }

        const cantidadAcompanantes =
            acompanantes.length;

        const cantidadInscripciones =
            1 + cantidadAcompanantes;

        const textoAcompanantes =
            cantidadAcompanantes === 1
                ? "1 acompañante"
                : `${cantidadAcompanantes} acompañantes`;

        detalleTotalInscripciones.textContent =
            `${cantidadInscripciones} inscripciones ` +
            `(1 principal + ${textoAcompanantes})`;
    }
}


/* ==================================================
   8. ENLACE PARA VOLVER Y CORREGIR
   ================================================== */

function configurarEnlaceVolver() {
    if (!enlaceVolver) {
        return;
    }

    const parametrosActuales =
        new URLSearchParams(
            window.location.search
        );

    const estaEnModoQA =
        parametrosActuales.get("qa") === "1";

    if (acompanantes.length > 0) {
        enlaceVolver.href = estaEnModoQA
            ? "acompanantes.html?qa=1"
            : "acompanantes.html";

        return;
    }

    enlaceVolver.href = estaEnModoQA
        ? "acreditacion.html?qa=1"
        : "acreditacion.html";
}


/* ==================================================
   9. ELEMENTOS DEL COMPROBANTE
   ================================================== */

const formularioComprobante =
    document.getElementById(
        "formulario-comprobante"
    );

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

const fechaActualFormato = fechaLocal
    .toISOString()
    .split("T")[0];

if (entradaFechaTransferencia) {
    entradaFechaTransferencia.max =
        fechaActualFormato;
}


/* ==================================================
   11. VALIDACIÓN DEL COMPROBANTE
   ================================================== */

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

function mostrarNombreArchivo() {
    if (
        !entradaComprobante ||
        !nombreArchivoComprobante
    ) {
        return;
    }

    const archivo =
        entradaComprobante.files[0];

    nombreArchivoComprobante.textContent =
        archivo
            ? `Archivo seleccionado: ${archivo.name}`
            : "";
}

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

    const partesNombre =
        archivo.name.split(".");

    const extension =
        partesNombre.length > 1
            ? partesNombre.pop().toLowerCase()
            : "";

    /*
     * Algunos navegadores pueden entregar un tipo vacío.
     * En ese caso se valida mediante la extensión.
     */
    const tipoValido =
        (
            archivo.type === "" ||
            tiposPermitidos.includes(
                archivo.type
            )
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


/* Revisa el archivo al seleccionarlo */
if (entradaComprobante) {
    entradaComprobante.addEventListener(
        "change",
        () => {
            mostrarNombreArchivo();

            if (entradaComprobante.files.length > 0) {
                validarComprobante();
            }
        }
    );
}


/* ==================================================
   12. ENVÍO DEL COMPROBANTE
   ================================================== */

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

            if (!formularioComprobante.checkValidity()) {
                formularioComprobante.reportValidity();
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

            /*
             * En esta etapa solo se guarda la información
             * del archivo. La carga real corresponde al backend.
             */
            const datosComprobante = {
                titularTransferencia:
                    entradaTitularTransferencia
                        .value
                        .trim(),

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
                    "Comprobante recibido. " +
                    "El pago está pendiente de revisión.";
            }
        }
    );
}


/* ==================================================
   13. CARGA INICIAL
   ================================================== */

mostrarPersonaPrincipal();
mostrarAcompanantes();
mostrarTotal();
configurarEnlaceVolver();
mostrarNombreArchivo();


/* ==================================================
   14. MODO DE PRUEBAS LOCALES
   ================================================== */

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