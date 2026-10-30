/* ==================================================
   1. CAMPOS CONDICIONALES DE SALUD
   ================================================== */

const preguntasCondicionales = [
    {
        selectId: "tiene-alergias",
        campoId: "campo-detalle-alergias",
        inputId: "detalle-alergias"
    },
    {
        selectId: "tiene-enfermedad",
        campoId: "campo-detalle-enfermedad",
        inputId: "detalle-enfermedad"
    },
    {
        selectId: "toma-medicamentos",
        campoId: "campo-detalle-medicamentos",
        inputId: "detalle-medicamentos"
    },
    {
        selectId: "restriccion-alimentaria",
        campoId: "campo-detalle-alimentacion",
        inputId: "detalle-alimentacion"
    }
];

preguntasCondicionales.forEach(
    (pregunta) => {
        const seleccion =
            document.getElementById(
                pregunta.selectId
            );

        const campoDetalle =
            document.getElementById(
                pregunta.campoId
            );

        const entradaDetalle =
            document.getElementById(
                pregunta.inputId
            );

        if (
            !seleccion ||
            !campoDetalle ||
            !entradaDetalle
        ) {
            return;
        }

        function actualizarCampo() {
            const respondioSi =
                seleccion.value === "si";

            campoDetalle.hidden =
                !respondioSi;

            entradaDetalle.required =
                respondioSi;

            if (!respondioSi) {
                entradaDetalle.value = "";
            }
        }

        seleccion.addEventListener(
            "change",
            actualizarCampo
        );

        actualizarCampo();
    }
);


/* ==================================================
   2. SECCIÓN DE ACOMPAÑANTES
   ================================================== */

const seleccionAcompanantes =
    document.getElementById(
        "tiene-acompanantes"
    );

const seccionAcompanantes =
    document.getElementById(
        "seccion-acompanantes"
    );

function actualizarSeccionAcompanantes() {
    if (
        !seleccionAcompanantes ||
        !seccionAcompanantes
    ) {
        return;
    }

    const agregaraAcompanantes =
        seleccionAcompanantes.value === "si";

    seccionAcompanantes.hidden =
        !agregaraAcompanantes;
}

if (
    seleccionAcompanantes &&
    seccionAcompanantes
) {
    seleccionAcompanantes.addEventListener(
        "change",
        actualizarSeccionAcompanantes
    );

    actualizarSeccionAcompanantes();
}


/* ==================================================
   3. FECHA, EDAD, TELÉFONO Y VALOR
   ================================================== */

const entradaFechaNacimiento =
    document.getElementById(
        "fecha-nacimiento"
    );

const salidaValorAcreditacion =
    document.getElementById(
        "valor-acreditacion"
    );

const entradaTelefonoPrincipal =
    document.getElementById(
        "telefono"
    );

const estadoTelefonoPrincipal =
    document.getElementById(
        "estado-telefono-principal"
    );

/* Inicio del campamento: 8 de enero de 2027 */
const fechaInicioCampamento =
    new Date(2027, 0, 8);


/*
 * Convierte el valor YYYY-MM-DD del input
 * en una fecha local válida.
 */
function obtenerFechaDesdeInput(valorFecha) {
    if (!valorFecha) {
        return null;
    }

    const partesFecha =
        valorFecha
            .split("-")
            .map(Number);

    if (partesFecha.length !== 3) {
        return null;
    }

    const [anio, mes, dia] =
        partesFecha;

    if (
        !Number.isInteger(anio) ||
        !Number.isInteger(mes) ||
        !Number.isInteger(dia)
    ) {
        return null;
    }

    const fecha =
        new Date(
            anio,
            mes - 1,
            dia
        );

    const fechaCoincide =
        fecha.getFullYear() === anio &&
        fecha.getMonth() === mes - 1 &&
        fecha.getDate() === dia;

    return fechaCoincide
        ? fecha
        : null;
}


/* Calcula la edad al inicio del campamento */
function calcularEdadEnCampamento(
    fechaNacimiento
) {
    let edad =
        fechaInicioCampamento.getFullYear() -
        fechaNacimiento.getFullYear();

    const aunNoCumple =
        fechaInicioCampamento.getMonth() <
            fechaNacimiento.getMonth() ||
        (
            fechaInicioCampamento.getMonth() ===
                fechaNacimiento.getMonth() &&
            fechaInicioCampamento.getDate() <
                fechaNacimiento.getDate()
        );

    if (aunNoCumple) {
        edad--;
    }

    return edad;
}


/*
 * El teléfono personal es opcional
 * para menores de 6 años.
 */
function actualizarRequisitoTelefonoPrincipal(
    edad = null
) {
    if (!entradaTelefonoPrincipal) {
        return;
    }

    const esMenorDeSeis =
        Number.isInteger(edad) &&
        edad >= 0 &&
        edad < 6;

    entradaTelefonoPrincipal.required =
        !esMenorDeSeis;

    entradaTelefonoPrincipal.setCustomValidity(
        ""
    );

    if (estadoTelefonoPrincipal) {
        estadoTelefonoPrincipal.textContent =
            esMenorDeSeis
                ? "(opcional para menores de 6 años)"
                : "*";
    }
}


/*
 * Valores:
 * 0 a 5 años: sin costo.
 * 6 a 10 años: $10.000.
 * Desde 11 años: $20.000.
 */
function actualizarValorAcreditacion() {
    if (
        !entradaFechaNacimiento ||
        !salidaValorAcreditacion
    ) {
        return;
    }

    const valorFecha =
        entradaFechaNacimiento.value;

    if (!valorFecha) {
        salidaValorAcreditacion.textContent =
            "Seleccione su fecha de nacimiento";

        salidaValorAcreditacion.dataset.valor =
            "0";

        salidaValorAcreditacion.dataset.fechaValida =
            "false";

        actualizarRequisitoTelefonoPrincipal(
            null
        );

        return;
    }

    const nacimiento =
        obtenerFechaDesdeInput(
            valorFecha
        );

    if (
        !nacimiento ||
        nacimiento > fechaInicioCampamento
    ) {
        salidaValorAcreditacion.textContent =
            "Fecha de nacimiento no válida";

        salidaValorAcreditacion.dataset.valor =
            "0";

        salidaValorAcreditacion.dataset.fechaValida =
            "false";

        actualizarRequisitoTelefonoPrincipal(
            null
        );

        return;
    }

    const edad =
        calcularEdadEnCampamento(
            nacimiento
        );

    if (edad < 0) {
        salidaValorAcreditacion.textContent =
            "Fecha de nacimiento no válida";

        salidaValorAcreditacion.dataset.valor =
            "0";

        salidaValorAcreditacion.dataset.fechaValida =
            "false";

        actualizarRequisitoTelefonoPrincipal(
            null
        );

        return;
    }

    actualizarRequisitoTelefonoPrincipal(
        edad
    );

    let valor = 0;
    let detalleValor = "";

    if (edad < 6) {
        valor = 0;
        detalleValor =
            `${edad} años - sin costo`;
    } else if (edad <= 10) {
        valor = 10000;
        detalleValor =
            `${edad} años - valor niño`;
    } else {
        valor = 20000;
        detalleValor =
            `${edad} años`;
    }

    salidaValorAcreditacion.textContent =
        `$${valor.toLocaleString("es-CL")} ` +
        `(${detalleValor})`;

    salidaValorAcreditacion.dataset.valor =
        String(valor);

    /*
     * Permite que una tarifa de $0
     * corresponda a una fecha válida.
     */
    salidaValorAcreditacion.dataset.fechaValida =
        "true";
}


/* Escucha los cambios del campo de fecha */
if (
    entradaFechaNacimiento &&
    salidaValorAcreditacion
) {
    entradaFechaNacimiento.addEventListener(
        "input",
        actualizarValorAcreditacion
    );

    entradaFechaNacimiento.addEventListener(
        "change",
        actualizarValorAcreditacion
    );

    actualizarValorAcreditacion();
}


/* ==================================================
   4. GUARDAR ACREDITACIÓN PRINCIPAL
   ================================================== */

const formularioAcreditacion =
    document.getElementById(
        "formulario-acreditacion"
    );

if (formularioAcreditacion) {
    formularioAcreditacion.addEventListener(
        "submit",
        (evento) => {
            evento.preventDefault();

            const fechaNacimientoValida =
                salidaValorAcreditacion
                    ?.dataset.fechaValida ===
                "true";

            if (!fechaNacimientoValida) {
                alert(
                    "Selecciona una fecha de nacimiento válida."
                );

                entradaFechaNacimiento?.focus();
                return;
            }

            const valorAcreditacion =
                Number(
                    salidaValorAcreditacion
                        ?.dataset.valor || "0"
                );

            const datosFormulario =
                new FormData(
                    formularioAcreditacion
                );

            const datosPersonaPrincipal =
                Object.fromEntries(
                    datosFormulario.entries()
                );

            /*
             * La contraseña no se guarda
             * en sessionStorage.
             */
            delete datosPersonaPrincipal.contrasena;

            datosPersonaPrincipal.valorAcreditacion =
                valorAcreditacion;

            /*
             * Si el teléfono es opcional y está vacío,
             * se guarda como una cadena vacía.
             */
            datosPersonaPrincipal.telefono =
                String(
                    datosPersonaPrincipal.telefono ||
                    ""
                ).trim();

            sessionStorage.setItem(
                "personaPrincipalCampamento",
                JSON.stringify(
                    datosPersonaPrincipal
                )
            );

            const parametrosActuales =
                new URLSearchParams(
                    window.location.search
                );

            const estaEnModoQA =
                parametrosActuales.get("qa") ===
                "1";

            /*
             * Si llevará acompañantes, continúa
             * al formulario correspondiente.
             */
            if (
                datosPersonaPrincipal
                    .tieneAcompanantes === "si"
            ) {
                window.location.href =
                    estaEnModoQA
                        ? "acompanantes.html?qa=1"
                        : "acompanantes.html";

                return;
            }

            /*
             * Si no llevará acompañantes,
             * elimina datos antiguos.
             */
            sessionStorage.removeItem(
                "acompanantesCampamento"
            );

            window.location.href =
                estaEnModoQA
                    ? "pago.html?qa=1"
                    : "pago.html";
        }
    );
}


/* ==================================================
   5. DATOS AUTOMÁTICOS PARA PRUEBAS QA
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
    ].includes(
        window.location.hostname
    );

    const modoQA =
        sitioLocal &&
        parametrosPagina.get("qa") ===
            "1";

    if (!modoQA) {
        return;
    }

    /*
     * Elimina información temporal
     * de pruebas anteriores.
     */
    sessionStorage.removeItem(
        "personaPrincipalCampamento"
    );

    sessionStorage.removeItem(
        "acompanantesCampamento"
    );

    sessionStorage.removeItem(
        "pagoCampamento"
    );

    function asignarValorPrueba(
        id,
        valor
    ) {
        const elemento =
            document.getElementById(id);

        if (!elemento) {
            console.warn(
                `No se encontró el campo: ${id}`
            );

            return;
        }

        elemento.value = valor;

        elemento.dispatchEvent(
            new Event("input", {
                bubbles: true
            })
        );

        elemento.dispatchEvent(
            new Event("change", {
                bubbles: true
            })
        );
    }

    /* Datos de la cuenta */
    asignarValorPrueba(
        "correo",
        "qa@ejemplo.test"
    );

    asignarValorPrueba(
        "contrasena",
        "PruebaQA2027!"
    );

    /* Datos personales */
    asignarValorPrueba(
        "nombre-completo",
        "Usuario de prueba QA"
    );

    asignarValorPrueba(
        "alias",
        "Usuario QA"
    );

    asignarValorPrueba(
        "rut",
        "11.111.111-1"
    );

    asignarValorPrueba(
        "genero",
        "femenino"
    );

    asignarValorPrueba(
        "fecha-nacimiento",
        "2005-01-01"
    );

    asignarValorPrueba(
        "telefono",
        "+56 9 1111 1111"
    );

    /* Información de salud */
    asignarValorPrueba(
        "tiene-alergias",
        "si"
    );

    asignarValorPrueba(
        "detalle-alergias",
        "Alergia de demostración: frutos secos"
    );

    asignarValorPrueba(
        "tiene-enfermedad",
        "si"
    );

    asignarValorPrueba(
        "detalle-enfermedad",
        "Condición médica de demostración"
    );

    asignarValorPrueba(
        "toma-medicamentos",
        "si"
    );

    asignarValorPrueba(
        "detalle-medicamentos",
        "Medicamento de demostración, una vez al día"
    );

    asignarValorPrueba(
        "restriccion-alimentaria",
        "si"
    );

    asignarValorPrueba(
        "detalle-alimentacion",
        "Sin lactosa, dato de demostración"
    );

    /* Contacto de emergencia */
    asignarValorPrueba(
        "nombre-emergencia",
        "Contacto de prueba"
    );

    asignarValorPrueba(
        "parentesco",
        "madre-padre"
    );

    asignarValorPrueba(
        "telefono-emergencia",
        "+56 9 2222 2222"
    );

    asignarValorPrueba(
        "telefono-alternativo",
        "+56 9 3333 3333"
    );

    /* Activa el flujo con acompañantes */
    asignarValorPrueba(
        "tiene-acompanantes",
        "si"
    );

    const confirmacion =
        document.getElementById(
            "confirma-informacion"
        );

    if (confirmacion) {
        confirmacion.checked = true;

        confirmacion.dispatchEvent(
            new Event("change", {
                bubbles: true
            })
        );
    }

    console.log(
        "Modo QA cargado correctamente"
    );
})();