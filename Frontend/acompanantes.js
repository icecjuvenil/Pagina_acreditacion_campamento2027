/* ==================================================
   1. ELEMENTOS PRINCIPALES DE LA PÁGINA
   ================================================== */

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


/* ==================================================
   2. RECUPERACIÓN DE ACOMPAÑANTES GUARDADOS
   ================================================== */

let acompanantesGuardados = [];

try {
    const datosGuardados = JSON.parse(
        sessionStorage.getItem("acompanantesCampamento") || "[]"
    );

    acompanantesGuardados = Array.isArray(datosGuardados)
        ? datosGuardados
        : [];
} catch (error) {
    console.error(
        "No fue posible recuperar los acompañantes:",
        error
    );

    acompanantesGuardados = [];
}


/* ==================================================
   3. CAMPOS CONDICIONALES DE INFORMACIÓN DE SALUD
   ================================================== */

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
        const respondioSi = pregunta.value === "si";

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
   4. CÁLCULO DEL VALOR DE ACREDITACIÓN
   ================================================== */

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

    const partesFecha = entradaFechaAcompanante.value
        .split("-")
        .map(Number);

    if (
        partesFecha.length !== 3 ||
        partesFecha.some((parte) => Number.isNaN(parte))
    ) {
        salidaValorAcompanante.textContent =
            "Fecha de nacimiento no válida";

        salidaValorAcompanante.dataset.valor = "0";
        return;
    }

    const nacimiento = new Date(
        partesFecha[0],
        partesFecha[1] - 1,
        partesFecha[2]
    );

    if (
        Number.isNaN(nacimiento.getTime()) ||
        nacimiento > fechaInicioCampamento
    ) {
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
    salidaValorAcompanante.textContent =
        `$${valor.toLocaleString("es-CL")} (${edad} años - ${categoria})`;

    // Guarda el valor numérico para utilizarlo en el resumen y pago
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


/* ==================================================
   5. FUNCIONES DE NORMALIZACIÓN
   ================================================== */

/* Elimina puntos, guion y espacios de un RUT */
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

/* Convierte una fecha desde aaaa-mm-dd a dd/mm/aaaa */
function formatearFecha(fecha) {
    if (!fecha) {
        return "No informada";
    }

    const partes = fecha.split("-");

    if (partes.length !== 3) {
        return fecha;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


/* ==================================================
   6. ALMACENAMIENTO TEMPORAL
   ================================================== */

function guardarAcompanantes() {
    sessionStorage.setItem(
        "acompanantesCampamento",
        JSON.stringify(acompanantesGuardados)
    );
}


/* ==================================================
   7. CONTADOR DE ACOMPAÑANTES
   ================================================== */

function actualizarCantidadAcompanantes() {
    if (!cantidadAcompanantes) {
        return;
    }

    const cantidad = acompanantesGuardados.length;

    cantidadAcompanantes.textContent =
        cantidad === 1
            ? "1 acompañante"
            : `${cantidad} acompañantes`;
}


/* ==================================================
   8. ELIMINACIÓN DE UN ACOMPAÑANTE
   ================================================== */

function eliminarAcompanante(indice) {
    const acompanante = acompanantesGuardados[indice];

    if (!acompanante) {
        return;
    }

    const confirmarEliminacion = window.confirm(
        `¿Deseas eliminar a ${acompanante.nombre}?`
    );

    if (!confirmarEliminacion) {
        return;
    }

    acompanantesGuardados.splice(
        indice,
        1
    );

    guardarAcompanantes();
    mostrarAcompanantes();
}


/* ==================================================
   9. CREACIÓN DE LA TARJETA DE UN ACOMPAÑANTE
   ================================================== */

function crearTarjetaAcompanante(
    acompanante,
    indice
) {
    const tarjeta = document.createElement("article");

    tarjeta.classList.add(
        "tarjeta-acompanante"
    );

    const encabezado = document.createElement("div");

    encabezado.classList.add(
        "encabezado-acompanante"
    );

    /* Información situada a la izquierda */
    const resumen = document.createElement("div");

    resumen.classList.add(
        "resumen-acompanante-guardado"
    );

    const avatar = document.createElement("div");

    avatar.classList.add(
        "avatar-acompanante"
    );

    avatar.setAttribute(
        "aria-hidden",
        "true"
    );

    avatar.textContent = "●";

    const datos = document.createElement("div");

    datos.classList.add(
        "datos-acompanante-guardado"
    );

    const titulo = document.createElement("h3");

    titulo.textContent =
        acompanante.nombre || "Acompañante";

    const informacion = document.createElement("p");

    const rut = acompanante.rut || "No informado";

    const nacimiento = formatearFecha(
        acompanante.fechaNacimiento
    );

    informacion.textContent =
        `RUT: ${rut}  |  Nacimiento: ${nacimiento}`;

    datos.append(
        titulo,
        informacion
    );

    resumen.append(
        avatar,
        datos
    );

    /* Botón situado a la derecha */
    const botonEliminar =
        document.createElement("button");

    botonEliminar.type = "button";

    botonEliminar.classList.add(
        "boton-eliminar-acompanante"
    );

    botonEliminar.setAttribute(
        "aria-label",
        `Eliminar a ${acompanante.nombre}`
    );

    const iconoEliminar =
        document.createElement("span");

    iconoEliminar.setAttribute(
        "aria-hidden",
        "true"
    );

    iconoEliminar.textContent = "▣";

    const textoEliminar =
        document.createElement("span");

    textoEliminar.textContent = "Eliminar";

    botonEliminar.append(
        iconoEliminar,
        textoEliminar
    );

    botonEliminar.addEventListener(
        "click",
        () => {
            eliminarAcompanante(indice);
        }
    );

    encabezado.append(
        resumen,
        botonEliminar
    );

    tarjeta.appendChild(encabezado);

    return tarjeta;
}


/* ==================================================
   10. REPRESENTACIÓN DE LA LISTA
   ================================================== */

function mostrarAcompanantes() {
    if (!listaAcompanantes) {
        return;
    }

    listaAcompanantes.innerHTML = "";

    actualizarCantidadAcompanantes();

    if (acompanantesGuardados.length === 0) {
        const mensaje = document.createElement("p");

        mensaje.id = "mensaje-sin-acompanantes";

        mensaje.classList.add(
            "mensaje-sin-acompanantes"
        );

        mensaje.textContent =
            "Todavía no has agregado acompañantes.";

        listaAcompanantes.appendChild(
            mensaje
        );

        return;
    }

    acompanantesGuardados.forEach(
        (acompanante, indice) => {
            const tarjeta = crearTarjetaAcompanante(
                acompanante,
                indice
            );

            listaAcompanantes.appendChild(
                tarjeta
            );
        }
    );
}


/* ==================================================
   11. REGISTRO DE UN NUEVO ACOMPAÑANTE
   ================================================== */

if (formularioAcompanante) {
    formularioAcompanante.addEventListener(
        "submit",
        (evento) => {
            evento.preventDefault();

            if (!formularioAcompanante.checkValidity()) {
                formularioAcompanante.reportValidity();
                return;
            }

            const valorAcreditacion = Number(
                salidaValorAcompanante
                    ?.dataset.valor || "0"
            );

            if (valorAcreditacion === 0) {
                alert(
                    "Selecciona una fecha de nacimiento válida."
                );

                entradaFechaAcompanante?.focus();
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

            /* Recupera los datos de la persona principal */
            let personaPrincipal = null;

            try {
                personaPrincipal = JSON.parse(
                    sessionStorage.getItem(
                        "personaPrincipalCampamento"
                    ) || "null"
                );
            } catch (error) {
                console.error(
                    "No fue posible recuperar a la persona principal:",
                    error
                );

                personaPrincipal = null;
            }

            const rutNuevo = normalizarRut(
                nuevoAcompanante.rut
            );

            const correoNuevo = normalizarCorreo(
                nuevoAcompanante.correo
            );

            const rutPrincipal = normalizarRut(
                personaPrincipal?.rut
            );

            const correoPrincipal = normalizarCorreo(
                personaPrincipal?.correo
            );

            /* Evita repetir el RUT de la persona principal */
            if (
                rutPrincipal &&
                rutNuevo === rutPrincipal
            ) {
                alert(
                    "Este RUT ya pertenece a la persona principal."
                );

                document
                    .getElementById("rut-acompanante")
                    ?.focus();

                return;
            }

            /* Evita repetir su correo electrónico */
            if (
                correoNuevo &&
                correoNuevo === correoPrincipal
            ) {
                alert(
                    "Este correo ya pertenece a la persona principal."
                );

                document
                    .getElementById("correo-acompanante")
                    ?.focus();

                return;
            }

            /* Evita repetir el RUT de otro acompañante */
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

                document
                    .getElementById("rut-acompanante")
                    ?.focus();

                return;
            }

            /* Evita repetir el correo de otro acompañante */
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

                document
                    .getElementById("correo-acompanante")
                    ?.focus();

                return;
            }

            /* Guarda el nuevo acompañante */
            acompanantesGuardados.push(
                nuevoAcompanante
            );

            guardarAcompanantes();
            mostrarAcompanantes();

            /* Limpia el formulario */
            formularioAcompanante.reset();

            preguntasSalud.forEach((pregunta) => {
                pregunta.dispatchEvent(
                    new Event("change", {
                        bubbles: true
                    })
                );
            });

            actualizarValorAcompanante();

            /*
             * Lleva el foco al primer campo para permitir
             * el ingreso de otro acompañante.
             */
            document
                .getElementById("nombre-acompanante")
                ?.focus();
        }
    );
}


/* ==================================================
   12. CONTINUAR AL RESUMEN Y PAGO
   ================================================== */

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

            window.location.href = estaEnModoQA
                ? "pago.html?qa=1"
                : "pago.html";
        }
    );
}


/* ==================================================
   13. CARGA INICIAL
   ================================================== */

mostrarAcompanantes();


/* ==================================================
   14. DATOS AUTOMÁTICOS PARA PRUEBAS LOCALES
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

    /*
     * Este valor debe coincidir con una opción
     * del select de parentesco.
     */
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