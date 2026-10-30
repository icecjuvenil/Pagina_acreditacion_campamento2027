
/*
 * API del Campamento Juvenil ICEC 2027
 * Cloudflare Workers
 */

const API_CAMPAMENTO =
    "https://icec-campamento-2027-api.brantemarco777.workers.dev";

// Funcion que prepara la comunicacion entre formulario y API    
async function enviarRegistroCampamento(datos) {
    const respuesta = await fetch(
        `${API_CAMPAMENTO}/api/registro`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
        throw new Error(
            resultado.mensaje ||
            "No se pudo completar la inscripción."
        );
    }

    return resultado;
}

// Preguntas que muestran un campo adicional al responder "Sí"
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

// Activa los campos adicionales de información de salud
preguntasCondicionales.forEach((pregunta) => {
    const seleccion = document.getElementById(
        pregunta.selectId
    );

    const campoDetalle = document.getElementById(
        pregunta.campoId
    );

    const entradaDetalle = document.getElementById(
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

        campoDetalle.hidden = !respondioSi;
        entradaDetalle.required = respondioSi;

        if (!respondioSi) {
            entradaDetalle.value = "";
        }
    }

    seleccion.addEventListener(
        "change",
        actualizarCampo
    );

    actualizarCampo();
});

// Muestra el mensaje relacionado con los acompañantes
const seleccionAcompanantes = document.getElementById(
    "tiene-acompanantes"
);

const seccionAcompanantes = document.getElementById(
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

// Calcula el valor de la acreditación principal
const entradaFechaNacimiento = document.getElementById(
    "fecha-nacimiento"
);

const salidaValorAcreditacion = document.getElementById(
    "valor-acreditacion"
);

const fechaInicioCampamento = new Date(
    2027,
    0,
    8
);

function actualizarValorAcreditacion() {
    if (
        !entradaFechaNacimiento ||
        !salidaValorAcreditacion
    ) {
        return;
    }

    if (!entradaFechaNacimiento.value) {
        salidaValorAcreditacion.textContent =
            "Seleccione la fecha de nacimiento";

        salidaValorAcreditacion.dataset.valor = "0";
        return;
    }

    const partesFecha = entradaFechaNacimiento.value
        .split("-")
        .map(Number);

    const nacimiento = new Date(
        partesFecha[0],
        partesFecha[1] - 1,
        partesFecha[2]
    );

    if (nacimiento > fechaInicioCampamento) {
        salidaValorAcreditacion.textContent =
            "Fecha de nacimiento no válida";

        salidaValorAcreditacion.dataset.valor = "0";
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

    // Determina el valor según la edad al inicio del campamento
    let valor;
    let categoria;

    if (edad >= 0 && edad <= 5) {
        valor = 0;
        categoria = "Sin costo";
    } else if (edad >= 6 && edad <= 10) {
        valor = 10000;
        categoria = "Tarifa niño";
    } else {
        valor = 20000;
        categoria = "Tarifa general";
    }

    // Muestra el valor, la edad y la categoría correspondiente
    salidaValorAcreditacion.textContent =
        `$${valor.toLocaleString("es-CL")} (${edad} años - ${categoria})`;

    // Guarda el valor numérico para utilizarlo en el resumen y pago
    salidaValorAcreditacion.dataset.valor =
        String(valor);
}

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

// Guarda el perfil y decide cuál es la siguiente página
const formularioAcreditacion = document.getElementById(
    "formulario-acreditacion"
);

if (formularioAcreditacion) {
    formularioAcreditacion.addEventListener(
        "submit",
        (evento) => {
            evento.preventDefault();

            const valorAcreditacion = Number(
                salidaValorAcreditacion?.dataset.valor ||
                "0"
            );

            if (valorAcreditacion === 0) {
                alert(
                    "Selecciona una fecha de nacimiento válida."
                );

                return;
            }

            const datosFormulario = new FormData(
                formularioAcreditacion
            );

            const datosPersonaPrincipal =
                Object.fromEntries(
                    datosFormulario.entries()
                );

            // La contraseña no se guarda en el navegador
            delete datosPersonaPrincipal.contrasena;

            datosPersonaPrincipal.valorAcreditacion =
                valorAcreditacion;

            sessionStorage.setItem(
                "personaPrincipalCampamento",
                JSON.stringify(datosPersonaPrincipal)
            );

            // Continúa al formulario de acompañantes
            if (
                datosPersonaPrincipal.tieneAcompanantes ===
                "si"
            ) {
                const parametrosActuales =
                    new URLSearchParams(
                    window.location.search
                );

                const estaEnModoQA =
                    parametrosActuales.get("qa") === "1";

                    window.location.href =
                    estaEnModoQA
                    ? "acompanantes.html?qa=1"
                    : "acompanantes.html";

                return;
            }
            // Elimina acompañantes de pruebas anteriores
            sessionStorage.removeItem(
                "acompanantesCampamento"
            );

            // Continúa directamente al resumen y pago
            window.location.href =
                "pago.html";
        }
    );
}

// Completa datos ficticios solamente en modo QA local
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

    // Elimina los datos temporales de pruebas anteriores
    sessionStorage.removeItem(
        "personaPrincipalCampamento"
    );

    sessionStorage.removeItem(
        "acompanantesCampamento"
    );

    sessionStorage.removeItem(
        "pagoCampamento"
    );

    // Completa un campo y activa sus validaciones
    function asignarValorPrueba(id, valor) {
        const elemento = document.getElementById(id);

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

    // Datos de la cuenta
    asignarValorPrueba(
        "correo",
        "qa@ejemplo.test"
    );

    asignarValorPrueba(
        "contrasena",
        "PruebaQA2027!"
    );

    // Datos personales
    asignarValorPrueba(
        "nombre-completo",
        "Usuario de prueba QA"
    );

    asignarValorPrueba(
        "rut",
        "11.111.111-1"
    );

    asignarValorPrueba(
        "fecha-nacimiento",
        "2005-01-01"
    );

    asignarValorPrueba(
        "telefono",
        "+56 9 1111 1111"
    );

    // Información de salud para la demostración
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

    // Contacto de emergencia
    asignarValorPrueba(
        "nombre-emergencia",
        "Contacto de prueba"
    );

    asignarValorPrueba(
        "parentesco",
        "Familiar"
    );

    asignarValorPrueba(
        "telefono-emergencia",
        "+56 9 2222 2222"
    );

    asignarValorPrueba(
        "telefono-alternativo",
        "+56 9 3333 3333"
    );

    // Activa el camino con acompañantes
    asignarValorPrueba(
        "tiene-acompanantes",
        "si"
    );

    // Confirma que la información es correcta
    const confirmacion = document.getElementById(
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