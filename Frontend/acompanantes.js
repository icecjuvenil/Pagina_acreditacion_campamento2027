/* ==================================================
   1. ELEMENTOS PRINCIPALES
   ================================================== */

const formularioAcompanante =
    document.getElementById(
        "formulario-acompanante"
    );

const listaAcompanantes =
    document.getElementById(
        "lista-acompanantes-guardados"
    );

const botonContinuar =
    document.getElementById(
        "continuar-resumen"
    );


/* ==================================================
   2. RECUPERAR ACOMPAÑANTES GUARDADOS
   ================================================== */

let acompanantesGuardados = [];

try {
    const datosGuardados = JSON.parse(
        sessionStorage.getItem(
            "acompanantesCampamento"
        ) || "[]"
    );

    acompanantesGuardados =
        Array.isArray(datosGuardados)
            ? datosGuardados
            : [];
} catch (error) {
    acompanantesGuardados = [];
}


/* ==================================================
   3. CAMPOS CONDICIONALES DE SALUD
   ================================================== */

const preguntasSalud =
    document.querySelectorAll(
        ".pregunta-salud-acompanante"
    );

preguntasSalud.forEach((pregunta) => {
    const campoDetalle =
        document.getElementById(
            pregunta.dataset.campo
        );

    const entradaDetalle =
        document.getElementById(
            pregunta.dataset.entrada
        );

    if (!campoDetalle || !entradaDetalle) {
        return;
    }

    function actualizarCampoSalud() {
        const respondioSi =
            pregunta.value === "si";

        campoDetalle.hidden = !respondioSi;
        entradaDetalle.required = respondioSi;

        if (!respondioSi) {
            entradaDetalle.value = "";
        }
    }

    pregunta.addEventListener(
        "change",
        actualizarCampoSalud
    );

    actualizarCampoSalud();
});


/* ==================================================
   4. FECHA, EDAD, TELÉFONO Y VALOR
   ================================================== */

const entradaFechaAcompanante =
    document.getElementById(
        "fecha-acompanante"
    );

const salidaValorAcompanante =
    document.getElementById(
        "valor-acompanante"
    );

const entradaTelefonoAcompanante =
    document.getElementById(
        "telefono-acompanante"
    );

const estadoTelefonoAcompanante =
    document.getElementById(
        "estado-telefono-acompanante"
    );

/* El campamento comienza el 8 de enero de 2027 */
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

    const [anio, mes, dia] = partesFecha;

    if (
        !Number.isInteger(anio) ||
        !Number.isInteger(mes) ||
        !Number.isInteger(dia)
    ) {
        return null;
    }

    const fecha =
        new Date(anio, mes - 1, dia);

    /*
     * Comprueba que JavaScript no haya
     * corregido automáticamente una fecha
     * inexistente.
     */
    const fechaCoincide =
        fecha.getFullYear() === anio &&
        fecha.getMonth() === mes - 1 &&
        fecha.getDate() === dia;

    return fechaCoincide
        ? fecha
        : null;
}


/*
 * Calcula la edad que tendrá la persona
 * al comenzar el campamento.
 */
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
 * solamente entre los 0 y 5 años.
 */
function actualizarRequisitoTelefono(
    edad = null
) {
    if (!entradaTelefonoAcompanante) {
        return;
    }

    const esMenorDeSeis =
        Number.isInteger(edad) &&
        edad >= 0 &&
        edad < 6;

    entradaTelefonoAcompanante.required =
        !esMenorDeSeis;

    entradaTelefonoAcompanante.setCustomValidity(
        ""
    );

    if (estadoTelefonoAcompanante) {
        estadoTelefonoAcompanante.textContent =
            esMenorDeSeis
                ? "(opcional para menores de 6 años)"
                : "*";
    }
}


/*
 * Calcula el precio correspondiente:
 *
 * 0 a 5 años: sin costo.
 * 6 a 10 años: tarifa infantil de $10.000.
 * Desde 11 años: tarifa general de $20.000.
 */
function actualizarValorAcompanante() {
    if (
        !entradaFechaAcompanante ||
        !salidaValorAcompanante
    ) {
        return;
    }

    const valorFecha =
        entradaFechaAcompanante.value;

    if (!valorFecha) {
        salidaValorAcompanante.textContent =
            "Seleccione la fecha de nacimiento";

        salidaValorAcompanante.dataset.valor =
            "0";

        salidaValorAcompanante.dataset.fechaValida =
            "false";

        actualizarRequisitoTelefono(null);
        return;
    }

    const nacimiento =
        obtenerFechaDesdeInput(valorFecha);

    if (
        !nacimiento ||
        nacimiento > fechaInicioCampamento
    ) {
        salidaValorAcompanante.textContent =
            "Fecha de nacimiento no válida";

        salidaValorAcompanante.dataset.valor =
            "0";

        salidaValorAcompanante.dataset.fechaValida =
            "false";

        actualizarRequisitoTelefono(null);
        return;
    }

    const edad =
        calcularEdadEnCampamento(
            nacimiento
        );

    if (edad < 0) {
        salidaValorAcompanante.textContent =
            "Fecha de nacimiento no válida";

        salidaValorAcompanante.dataset.valor =
            "0";

        salidaValorAcompanante.dataset.fechaValida =
            "false";

        actualizarRequisitoTelefono(null);
        return;
    }

    actualizarRequisitoTelefono(edad);

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

    salidaValorAcompanante.textContent =
        `$${valor.toLocaleString("es-CL")} ` +
        `(${detalleValor})`;

    salidaValorAcompanante.dataset.valor =
        String(valor);

    /*
     * Una tarifa de $0 también puede
     * corresponder a una fecha válida.
     */
    salidaValorAcompanante.dataset.fechaValida =
        "true";
}


/* Actualiza el valor cuando cambia la fecha */
if (
    entradaFechaAcompanante &&
    salidaValorAcompanante
) {
    entradaFechaAcompanante.addEventListener(
        "input",
        actualizarValorAcompanante
    );

    entradaFechaAcompanante.addEventListener(
        "change",
        actualizarValorAcompanante
    );

    actualizarValorAcompanante();
}


/* ==================================================
   5. NORMALIZACIÓN DE DATOS
   ================================================== */

/* Normaliza un RUT para poder compararlo */
function normalizarRut(rut) {
    return String(rut || "")
        .replace(/[^0-9kK]/g, "")
        .toUpperCase();
}


/* Normaliza un correo para poder compararlo */
function normalizarCorreo(correo) {
    return String(correo || "")
        .trim()
        .toLowerCase();
}


/* ==================================================
   6. GUARDAR EN SESSION STORAGE
   ================================================== */

function guardarAcompanantes() {
    sessionStorage.setItem(
        "acompanantesCampamento",
        JSON.stringify(
            acompanantesGuardados
        )
    );
}


/* ==================================================
   7. MOSTRAR ACOMPAÑANTES GUARDADOS
   ================================================== */

function mostrarAcompanantes() {
    if (!listaAcompanantes) {
        return;
    }

    listaAcompanantes.innerHTML = "";

    if (acompanantesGuardados.length === 0) {
        const mensaje =
            document.createElement("p");

        mensaje.id =
            "mensaje-sin-acompanantes";

        mensaje.textContent =
            "Todavía no has agregado acompañantes.";

        listaAcompanantes.appendChild(
            mensaje
        );

        return;
    }

    acompanantesGuardados.forEach(
        (acompanante, indice) => {
            const tarjeta =
                document.createElement(
                    "article"
                );

            tarjeta.classList.add(
                "tarjeta-acompanante"
            );

            const encabezado =
                document.createElement("div");

            encabezado.classList.add(
                "encabezado-acompanante"
            );

            const titulo =
                document.createElement("h3");

            titulo.textContent =
                acompanante.nombre;

            const botonEliminar =
                document.createElement(
                    "button"
                );

            botonEliminar.type = "button";

            botonEliminar.classList.add(
                "boton-eliminar-acompanante"
            );

            botonEliminar.textContent =
                "Eliminar";

            botonEliminar.addEventListener(
                "click",
                () => {
                    acompanantesGuardados.splice(
                        indice,
                        1
                    );

                    guardarAcompanantes();
                    mostrarAcompanantes();
                }
            );

            encabezado.append(
                titulo,
                botonEliminar
            );

            const rut =
                document.createElement("p");

            rut.textContent =
                `RUT: ${acompanante.rut}`;

            const genero =
                document.createElement("p");

            genero.textContent =
                `Género: ${
                    acompanante.genero ||
                    "no informado"
                }`;

            const correo =
                document.createElement("p");

            correo.textContent =
                acompanante.correo
                    ? `Correo: ${acompanante.correo}`
                    : "Correo: no informado";

            const telefono =
                document.createElement("p");

            telefono.textContent =
                acompanante.telefono
                    ? `Teléfono: ${acompanante.telefono}`
                    : "Teléfono: no informado";

            const valor =
                document.createElement("p");

            valor.textContent =
                `Valor: $${Number(
                    acompanante.valorAcreditacion
                ).toLocaleString("es-CL")}`;

            tarjeta.append(
                encabezado,
                rut,
                genero,
                correo,
                telefono,
                valor
            );

            listaAcompanantes.appendChild(
                tarjeta
            );
        }
    );
}


/* ==================================================
   8. GUARDAR UN NUEVO ACOMPAÑANTE
   ================================================== */

if (formularioAcompanante) {
    formularioAcompanante.addEventListener(
        "submit",
        (evento) => {
            evento.preventDefault();

            const fechaNacimientoValida =
                salidaValorAcompanante
                    ?.dataset.fechaValida ===
                "true";

            if (!fechaNacimientoValida) {
                alert(
                    "Selecciona una fecha de nacimiento válida."
                );

                entradaFechaAcompanante?.focus();
                return;
            }

            const valorAcreditacion =
                Number(
                    salidaValorAcompanante
                        ?.dataset.valor || "0"
                );

            const datosFormulario =
                new FormData(
                    formularioAcompanante
                );

            const nuevoAcompanante =
                Object.fromEntries(
                    datosFormulario.entries()
                );

            nuevoAcompanante.valorAcreditacion =
                valorAcreditacion;

            /*
             * Si el teléfono no fue ingresado
             * porque es opcional, se guarda vacío.
             */
            nuevoAcompanante.telefono =
                String(
                    nuevoAcompanante.telefono ||
                    ""
                ).trim();

            let personaPrincipal = null;

            try {
                personaPrincipal = JSON.parse(
                    sessionStorage.getItem(
                        "personaPrincipalCampamento"
                    ) || "null"
                );
            } catch (error) {
                personaPrincipal = null;
            }

            const rutNuevo =
                normalizarRut(
                    nuevoAcompanante.rut
                );

            const correoNuevo =
                normalizarCorreo(
                    nuevoAcompanante.correo
                );

            const rutPrincipal =
                normalizarRut(
                    personaPrincipal?.rut
                );

            const correoPrincipal =
                normalizarCorreo(
                    personaPrincipal?.correo
                );

            /* Evita usar el RUT principal */
            if (
                rutPrincipal &&
                rutNuevo === rutPrincipal
            ) {
                alert(
                    "Este RUT ya pertenece a la persona principal."
                );

                return;
            }

            /* Evita usar el correo principal */
            if (
                correoNuevo &&
                correoNuevo === correoPrincipal
            ) {
                alert(
                    "Este correo ya pertenece a la persona principal."
                );

                return;
            }

            /* Evita repetir el RUT */
            const rutRepetido =
                acompanantesGuardados.some(
                    (acompanante) =>
                        normalizarRut(
                            acompanante.rut
                        ) === rutNuevo
                );

            if (rutRepetido) {
                alert(
                    "Ya agregaste un acompañante con este RUT."
                );

                return;
            }

            /* Evita repetir el correo */
            const correoRepetido =
                correoNuevo &&
                acompanantesGuardados.some(
                    (acompanante) =>
                        normalizarCorreo(
                            acompanante.correo
                        ) === correoNuevo
                );

            if (correoRepetido) {
                alert(
                    "Ya agregaste un acompañante con este correo."
                );

                return;
            }

            acompanantesGuardados.push(
                nuevoAcompanante
            );

            guardarAcompanantes();
            mostrarAcompanantes();

            formularioAcompanante.reset();

            preguntasSalud.forEach(
                (pregunta) => {
                    pregunta.dispatchEvent(
                        new Event("change", {
                            bubbles: true
                        })
                    );
                }
            );

            actualizarValorAcompanante();

            formularioAcompanante.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    );
}


/* ==================================================
   9. CONTINUAR AL RESUMEN Y PAGO
   ================================================== */

if (botonContinuar) {
    botonContinuar.addEventListener(
        "click",
        () => {
            if (
                acompanantesGuardados.length === 0
            ) {
                alert(
                    "Debes guardar al menos un acompañante."
                );

                return;
            }

            const parametrosActuales =
                new URLSearchParams(
                    window.location.search
                );

            const estaEnModoQA =
                parametrosActuales.get("qa") ===
                "1";

            window.location.href =
                estaEnModoQA
                    ? "pago.html?qa=1"
                    : "pago.html";
        }
    );
}


/* Muestra los datos al cargar la página */
mostrarAcompanantes();


/* ==================================================
   10. DATOS AUTOMÁTICOS PARA PRUEBAS QA
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
        parametrosPagina.get("qa") === "1";

    if (!modoQA) {
        return;
    }

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

    /* Datos personales */
    asignarValorPrueba(
        "nombre-acompanante",
        "Acompañante de prueba QA"
    );

    asignarValorPrueba(
        "rut-acompanante",
        "22.222.222-2"
    );

    asignarValorPrueba(
        "genero-acompanante",
        "femenino"
    );

    asignarValorPrueba(
        "fecha-acompanante",
        "2018-01-01"
    );

    asignarValorPrueba(
        "telefono-acompanante",
        "+56 9 4444 4444"
    );

    asignarValorPrueba(
        "correo-acompanante",
        "acompanante.qa@ejemplo.test"
    );

    /* Información de salud */
    asignarValorPrueba(
        "tiene-alergias-acompanante",
        "si"
    );

    asignarValorPrueba(
        "detalle-alergias-acompanante",
        "Alergia de demostración: frutos secos"
    );

    asignarValorPrueba(
        "tiene-enfermedad-acompanante",
        "si"
    );

    asignarValorPrueba(
        "detalle-enfermedad-acompanante",
        "Condición médica de demostración"
    );

    asignarValorPrueba(
        "toma-medicamentos-acompanante",
        "si"
    );

    asignarValorPrueba(
        "detalle-medicamentos-acompanante",
        "Medicamento de demostración, una vez al día"
    );

    asignarValorPrueba(
        "restriccion-alimentaria-acompanante",
        "si"
    );

    asignarValorPrueba(
        "detalle-alimentacion-acompanante",
        "Sin lactosa, dato de demostración"
    );

    /* Contacto de emergencia */
    asignarValorPrueba(
        "nombre-emergencia-acompanante",
        "Contacto del acompañante"
    );

    asignarValorPrueba(
        "relacion-emergencia-acompanante",
        "madre-padre"
    );

    asignarValorPrueba(
        "telefono-emergencia-acompanante",
        "+56 9 5555 5555"
    );

    asignarValorPrueba(
        "telefono-alternativo-acompanante",
        "+56 9 6666 6666"
    );

    console.log(
        "Modo QA del acompañante cargado correctamente"
    );
})();