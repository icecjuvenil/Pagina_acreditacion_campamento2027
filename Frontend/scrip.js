
/*
 * API del Campamento Juvenil ICEC 2027
 * Cloudflare Workers
 */

const API_CAMPAMENTO =
   // "https://icec-campamento-2027-api.brantemarco777.workers.dev";
    "http://127.0.0.1:8787";

// Funcion que prepara la comunicacion entre formulario y API    
async function enviarRegistroCampamento(datos) {
    
    // Obtener el token de verificación de Cloudflare Turnstile
    const tokenTurnstile = window.turnstile?.getResponse();

    if (!tokenTurnstile) {
        throw new Error(
            "Debes completar la verificación de seguridad."
        );
    }

    // Incluir el token en los datos enviados al backend
    datos.turnstileToken = tokenTurnstile;

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

/*
 * REGISTRO DEL PARTICIPANTE PRINCIPAL
 * Campamento Juvenil ICEC 2027
 */

const formularioAcreditacion = document.getElementById(
    "formulario-acreditacion"
);

if (formularioAcreditacion) {
    formularioAcreditacion.addEventListener(
        "submit",
        async (evento) => {
            evento.preventDefault();

            const botonEnviar =
                formularioAcreditacion.querySelector(
                    'button[type="submit"]'
                );

            const valorAcreditacion = Number(
                salidaValorAcreditacion?.dataset.valor || "0"
            );

            if (!fechaNacimientoValida) {
                alert(
                    "Selecciona una fecha de nacimiento válida."
                );
                return;
            }

            if (!formularioAcreditacion.reportValidity()) {
                return;
            }

            // Obtener los datos del formulario.
            const datosFormulario = new FormData(
                formularioAcreditacion
            );

            const datosRegistro = Object.fromEntries(
                datosFormulario.entries()
            );

            // El backend espera un valor booleano.
            datosRegistro.confirmaInformacion =
                formularioAcreditacion.elements[
                    "confirmaInformacion"
                ]?.checked === true;

            if (botonEnviar) {
                botonEnviar.disabled = true;
                botonEnviar.textContent = "Guardando inscripción...";
            }

            try {
                // El registro se guarda primero en Cloudflare D1.
                const resultado = await enviarRegistroCampamento(
                    datosRegistro
                );

                if (resultado.estado !== "REGISTRADA") {
                    throw new Error(
                        "No se pudo confirmar la inscripción."
                    );
                }

                // Crear una copia para el resumen de pago.
                const datosPersonaPrincipal = {
                    ...datosRegistro,
                    valorAcreditacion: resultado.montoTotal
                };

                // Nunca guardar contraseñas ni tokens.
                delete datosPersonaPrincipal.contrasena;
                delete datosPersonaPrincipal.turnstileToken;
                delete datosPersonaPrincipal["cf-turnstile-response"];

                sessionStorage.setItem(
                    "personaPrincipalCampamento",
                    JSON.stringify(datosPersonaPrincipal)
                );

                // Continuar al registro de acompañantes.
                if (
                    datosPersonaPrincipal.tieneAcompanantes === "si"
                ) {
                    const parametrosActuales =
                        new URLSearchParams(
                            window.location.search
                        );

                    const estaEnModoQA =
                        parametrosActuales.get("qa") === "1";

                    window.location.href = estaEnModoQA
                        ? "acompanantes.html?qa=1"
                        : "acompanantes.html";

                    return;
                }

                // Eliminar acompañantes de pruebas anteriores.
                sessionStorage.removeItem(
                    "acompanantesCampamento"
                );

                // Continuar al resumen y pago.
                window.location.href = "pago.html";

            } catch (error) {
                console.error(
                    "No se pudo completar el registro:",
                    error
                );

                alert(
                    error.message ||
                    "Ocurrió un error al guardar la inscripción."
                );

                // Preparar una nueva verificación si falla.
                window.turnstile?.reset();

            } finally {
                if (botonEnviar) {
                    botonEnviar.disabled = false;
                    botonEnviar.textContent =
                        "Guardar perfil y continuar";
                }
            }
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