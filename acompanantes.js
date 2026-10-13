// Obtiene los elementos principales de la página
const formularioAcompanante = document.getElementById(
    "formulario-acompanante"
);

const listaAcompanantes = document.getElementById(
    "lista-acompanantes-guardados"
);

const botonContinuar = document.getElementById(
    "continuar-resumen"
);

// Recupera los acompañantes guardados temporalmente
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

// Activa los campos adicionales de información de salud
const preguntasSalud = document.querySelectorAll(
    ".pregunta-salud-acompanante"
);

preguntasSalud.forEach((pregunta) => {
    const campoDetalle = document.getElementById(
        pregunta.dataset.campo
    );

    const entradaDetalle = document.getElementById(
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

// Calcula el valor según la edad al comenzar el campamento
const entradaFechaAcompanante = document.getElementById(
    "fecha-acompanante"
);

const salidaValorAcompanante = document.getElementById(
    "valor-acompanante"
);

const fechaInicioCampamento = new Date(
    2027,
    0,
    8
);

function actualizarValorAcompanante() {
    if (
        !entradaFechaAcompanante ||
        !salidaValorAcompanante
    ) {
        return;
    }

    if (!entradaFechaAcompanante.value) {
        salidaValorAcompanante.textContent =
            "Seleccione la fecha de nacimiento";

        salidaValorAcompanante.dataset.valor = "0";
        return;
    }

    const partesFecha =
        entradaFechaAcompanante.value
            .split("-")
            .map(Number);

    const nacimiento = new Date(
        partesFecha[0],
        partesFecha[1] - 1,
        partesFecha[2]
    );

    if (nacimiento > fechaInicioCampamento) {
        salidaValorAcompanante.textContent =
            "Fecha de nacimiento no válida";

        salidaValorAcompanante.dataset.valor = "0";
        return;
    }

    let edad =
        fechaInicioCampamento.getFullYear() -
        nacimiento.getFullYear();

    const aunNoCumple =
        fechaInicioCampamento.getMonth() <
            nacimiento.getMonth() ||
        (
            fechaInicioCampamento.getMonth() ===
                nacimiento.getMonth() &&
            fechaInicioCampamento.getDate() <
                nacimiento.getDate()
        );

    if (aunNoCumple) {
        edad--;
    }

    const valor =
        edad <= 9 ? 10000 : 20000;

    salidaValorAcompanante.textContent =
        `$${valor.toLocaleString("es-CL")} (${edad} años)`;

    salidaValorAcompanante.dataset.valor =
        String(valor);
}

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

// Normaliza un RUT para poder compararlo
function normalizarRut(rut) {
    return String(rut)
        .replace(/[^0-9kK]/g, "")
        .toUpperCase();
}

// Normaliza un correo para poder compararlo
function normalizarCorreo(correo) {
    return String(correo)
        .trim()
        .toLowerCase();
}

// Guarda los acompañantes temporalmente
function guardarAcompanantes() {
    sessionStorage.setItem(
        "acompanantesCampamento",
        JSON.stringify(acompanantesGuardados)
    );
}

// Muestra los acompañantes que fueron agregados
function mostrarAcompanantes() {
    if (!listaAcompanantes) {
        return;
    }

    listaAcompanantes.innerHTML = "";

    if (acompanantesGuardados.length === 0) {
        const mensaje = document.createElement("p");

        mensaje.id = "mensaje-sin-acompanantes";
        mensaje.textContent =
            "Todavía no has agregado acompañantes.";

        listaAcompanantes.appendChild(mensaje);
        return;
    }

    acompanantesGuardados.forEach(
        (acompanante, indice) => {
            const tarjeta =
                document.createElement("article");

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
                document.createElement("button");

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

            const correo =
                document.createElement("p");

            correo.textContent =
                acompanante.correo
                    ? `Correo: ${acompanante.correo}`
                    : "Correo: no informado";

            const valor =
                document.createElement("p");

            valor.textContent =
                `Valor: $${Number(
                    acompanante.valorAcreditacion
                ).toLocaleString("es-CL")}`;

            tarjeta.append(
                encabezado,
                rut,
                correo,
                valor
            );

            listaAcompanantes.appendChild(
                tarjeta
            );
        }
    );
}

// Guarda un nuevo acompañante
if (formularioAcompanante) {
    formularioAcompanante.addEventListener(
        "submit",
        (evento) => {
            evento.preventDefault();

            const valorAcreditacion = Number(
                salidaValorAcompanante
                    ?.dataset.valor || "0"
            );

            if (valorAcreditacion === 0) {
                alert(
                    "Selecciona una fecha de nacimiento válida."
                );

                return;
            }

            const datosFormulario = new FormData(
                formularioAcompanante
            );

            const nuevoAcompanante =
                Object.fromEntries(
                    datosFormulario.entries()
                );

            nuevoAcompanante.valorAcreditacion =
                valorAcreditacion;

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

            const rutNuevo = normalizarRut(
                nuevoAcompanante.rut
            );

            const correoNuevo = normalizarCorreo(
                nuevoAcompanante.correo
            );

            const rutPrincipal = normalizarRut(
                personaPrincipal?.rut || ""
            );

            const correoPrincipal = normalizarCorreo(
                personaPrincipal?.correo || ""
            );

            // Impide repetir el RUT de la persona principal
            if (
                rutPrincipal &&
                rutNuevo === rutPrincipal
            ) {
                alert(
                    "Este RUT ya pertenece a la persona principal."
                );

                return;
            }

            // Impide repetir el correo de la persona principal
            if (
                correoNuevo &&
                correoNuevo === correoPrincipal
            ) {
                alert(
                    "Este correo ya pertenece a la persona principal."
                );

                return;
            }

            // Impide repetir el RUT de otro acompañante
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

            // Impide repetir el correo de otro acompañante
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

            preguntasSalud.forEach((pregunta) => {
                pregunta.dispatchEvent(
                    new Event("change", {
                        bubbles: true
                    })
                );
            });

            actualizarValorAcompanante();

            formularioAcompanante.scrollIntoView({
                behavior: "smooth",
                block: "start"
            });
        }
    );
}

// Continúa al resumen y pago
if (botonContinuar) {
    botonContinuar.addEventListener(
        "click",
        () => {
            if (acompanantesGuardados.length === 0) {
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
                parametrosActuales.get("qa") === "1";

            window.location.href =
                estaEnModoQA
                    ? "pago.html?qa=1"
                    : "pago.html";
        }
    );
}

// Muestra los acompañantes guardados al cargar la página
mostrarAcompanantes();

// Completa un acompañante ficticio en modo QA local
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

    function asignarValorPrueba(id, valor) {
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

    // Datos personales del acompañante
    asignarValorPrueba(
        "nombre-acompanante",
        "Acompañante de prueba QA"
    );

    asignarValorPrueba(
        "rut-acompanante",
        "22.222.222-2"
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

    // Información de salud del acompañante
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

    // Contacto de emergencia del acompañante
    asignarValorPrueba(
        "nombre-emergencia-acompanante",
        "Contacto del acompañante"
    );

    asignarValorPrueba(
        "relacion-emergencia-acompanante",
        "Madre"
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