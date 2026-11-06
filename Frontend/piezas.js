document.addEventListener("DOMContentLoaded", () => {

    /* ==================================================
       1. FUNCIONES GENERALES
       ================================================== */

    // Recupera información JSON guardada en sessionStorage.
    function obtenerDatosGuardados(clave, valorInicial) {
        const contenido = sessionStorage.getItem(clave);

        if (!contenido) {
            return valorInicial;
        }

        try {
            return JSON.parse(contenido);
        } catch (error) {
            console.error(
                `No se pudo recuperar ${clave}:`,
                error
            );

            return valorInicial;
        }
    }


    // Convierte un texto a una forma comparable.
    function normalizarTexto(valor) {
        return String(valor || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }


    // Convierte el género registrado al valor usado por las piezas.
    function normalizarGenero(genero) {
        const generoNormalizado = normalizarTexto(genero);

        if (
            generoNormalizado === "femenino" ||
            generoNormalizado === "mujer" ||
            generoNormalizado === "female" ||
            generoNormalizado === "f"
        ) {
            return "femenino";
        }

        if (
            generoNormalizado === "masculino" ||
            generoNormalizado === "hombre" ||
            generoNormalizado === "male" ||
            generoNormalizado === "m"
        ) {
            return "masculino";
        }

        return "";
    }


    // Obtiene el nombre de una persona.
    function obtenerNombrePersona(persona) {
        return (
            persona?.nombreCompleto ||
            persona?.nombre ||
            persona?.alias ||
            "Participante sin nombre"
        );
    }


    /* ==================================================
       2. CONTROL DE ACCESO
       ================================================== */

    // Recupera la información del pago.
    const pagoCampamento = obtenerDatosGuardados(
        "pagoCampamento",
        null
    );


    // Lee los parámetros incluidos en la dirección.
    const parametrosPagina =
        new URLSearchParams(window.location.search);


    // Comprueba que la página se esté ejecutando localmente.
    const sitioLocal = [
        "localhost",
        "127.0.0.1",
        "::1"
    ].includes(window.location.hostname);


    // Activa el modo de prueba solamente en el computador local
    // cuando la dirección termina en ?qa=1.
    const modoQA =
        sitioLocal &&
        parametrosPagina.get("qa") === "1";


    // Estados de pago que permiten seleccionar piezas.
    const estadosAutorizados = [
        "aprobado",
        "validado",
        "acreditado",
        "pago aprobado",
        "pago validado"
    ];


    const estadoPagoNormalizado =
        normalizarTexto(pagoCampamento?.estado);


    const pagoAutorizado =
        estadosAutorizados.includes(
            estadoPagoNormalizado
        );


    // En el funcionamiento real, impide ingresar si el pago
    // todavía no ha sido aprobado.
    // El modo QA permite revisar la página durante el desarrollo.
    if (!pagoAutorizado && !modoQA) {
        alert(
            "La selección de piezas estará disponible cuando tu acreditación y pago hayan sido aprobados."
        );

        window.location.replace(
            "informacion.html"
        );

        return;
    }


    /* ==================================================
       3. RECUPERACIÓN DE PARTICIPANTES
       ================================================== */

    const personaPrincipal = obtenerDatosGuardados(
        "personaPrincipalCampamento",
        null
    );


    const acompanantesGuardados =
        obtenerDatosGuardados(
            "acompanantesCampamento",
            []
        );


    const acompanantes = Array.isArray(
        acompanantesGuardados
    )
        ? acompanantesGuardados
        : [];


    // Lista común para la persona principal
    // y todos sus acompañantes.
    const participantes = [];


    // Agrega la persona principal cuando existe.
    if (personaPrincipal) {
        participantes.push({
            id: "persona-principal",
            tipo: "principal",

            nombre:
                obtenerNombrePersona(
                    personaPrincipal
                ),

            genero:
                normalizarGenero(
                    personaPrincipal.genero
                ),

            datos: personaPrincipal
        });
    }


    // Agrega los acompañantes registrados.
    acompanantes.forEach(
        (acompanante, posicion) => {
            participantes.push({
                id: `acompanante-${posicion}`,
                tipo: "acompanante",

                nombre:
                    obtenerNombrePersona(
                        acompanante
                    ),

                genero:
                    normalizarGenero(
                        acompanante.genero
                    ),

                datos: acompanante
            });
        }
    );


    // Si estamos en modo QA y no existen participantes,
    // crea dos personas temporales para revisar la página.
    if (participantes.length === 0 && modoQA) {
        participantes.push(
            {
                id: "persona-prueba-femenina",
                tipo: "principal",
                nombre: "Participante femenina de prueba",
                genero: "femenino",

                datos: {
                    nombreCompleto:
                        "Participante femenina de prueba",

                    genero: "Femenino"
                }
            },
            {
                id: "persona-prueba-masculina",
                tipo: "acompanante",
                nombre: "Participante masculino de prueba",
                genero: "masculino",

                datos: {
                    nombreCompleto:
                        "Participante masculino de prueba",

                    genero: "Masculino"
                }
            }
        );
    }


    // En el funcionamiento real no permite continuar
    // si no existen personas acreditadas.
    if (participantes.length === 0) {
        alert(
            "No se encontraron personas acreditadas para asignar."
        );

        window.location.replace(
            "acreditacion.html"
        );

        return;
    }


    /* ==================================================
       4. ELEMENTOS DE LA PÁGINA
       ================================================== */

    const selectorParticipante =
        document.getElementById(
            "participante-pieza"
        );


    const salidaGenero =
        document.getElementById(
            "genero-participante-pieza"
        );


    const textoGenero =
        document.getElementById(
            "texto-genero-participante"
        );


    const mensajeSeleccion =
        document.getElementById(
            "mensaje-seleccion-pieza"
        );


    const contadorPiezas =
        document.getElementById(
            "contador-piezas-disponibles"
        );


    const salidaNombrePieza =
        document.getElementById(
            "nombre-pieza-seleccionada"
        );


    const salidaCuposPieza =
        document.getElementById(
            "cupos-pieza-seleccionada"
        );


    const botonConfirmar =
        document.getElementById(
            "boton-confirmar-pieza"
        );


    const tarjetasPiezas = Array.from(
        document.querySelectorAll(
            ".tarjeta-pieza"
        )
    );


    // Comprueba que los elementos principales existan.
    if (
        !selectorParticipante ||
        !salidaGenero ||
        !textoGenero ||
        !mensajeSeleccion ||
        !contadorPiezas ||
        !salidaNombrePieza ||
        !salidaCuposPieza ||
        !botonConfirmar ||
        tarjetasPiezas.length === 0
    ) {
        console.error(
            "No se encontraron todos los elementos necesarios de piezas.html."
        );

        return;
    }


    /* ==================================================
       5. ASIGNACIONES GUARDADAS
       ================================================== */

    const asignacionesRecuperadas =
        obtenerDatosGuardados(
            "asignacionesPiezasCampamento",
            {}
        );


    const asignaciones =
        asignacionesRecuperadas &&
        typeof asignacionesRecuperadas === "object" &&
        !Array.isArray(asignacionesRecuperadas)
            ? asignacionesRecuperadas
            : {};


    // Guarda las asignaciones temporales.
    function guardarAsignaciones() {
        sessionStorage.setItem(
            "asignacionesPiezasCampamento",
            JSON.stringify(asignaciones)
        );
    }


    /* ==================================================
       6. VARIABLES DE LA SELECCIÓN ACTUAL
       ================================================== */

    let participanteActual = null;
    let codigoPiezaTemporal = "";


    /* ==================================================
       7. CARGA DEL SELECTOR DE PARTICIPANTES
       ================================================== */

    function cargarSelectorParticipantes() {
        selectorParticipante.textContent = "";


        const opcionInicial =
            document.createElement("option");

        opcionInicial.value = "";

        opcionInicial.textContent =
            "Seleccione un participante";

        selectorParticipante.appendChild(
            opcionInicial
        );


        participantes.forEach(
            (participante) => {
                const opcion =
                    document.createElement(
                        "option"
                    );

                opcion.value = participante.id;


                const tipoPersona =
                    participante.tipo === "principal"
                        ? "Persona principal"
                        : "Acompañante";


                opcion.textContent =
                    `${participante.nombre} — ${tipoPersona}`;

                selectorParticipante.appendChild(
                    opcion
                );
            }
        );
    }


    /* ==================================================
       8. CÁLCULO DE CUPOS
       ================================================== */

    // Cuenta cuántas personas están asignadas
    // a una pieza determinada.
    function contarPersonasEnPieza(codigoPieza) {
        return Object.values(
            asignaciones
        ).filter(
            (asignacion) =>
                asignacion.codigo === codigoPieza
        ).length;
    }


    // Calcula los cupos restantes de una pieza.
    function calcularCuposRestantes(tarjeta) {
        const capacidad = Number(
            tarjeta.dataset.capacidad || 0
        );


        const personasAsignadas =
            contarPersonasEnPieza(
                tarjeta.dataset.codigo
            );


        return Math.max(
            0,
            capacidad - personasAsignadas
        );
    }


    /* ==================================================
       9. LIMPIEZA DE ESTADOS VISUALES
       ================================================== */

    function limpiarEstadoTarjeta(tarjeta) {
        tarjeta.classList.remove(
            "pieza-seleccionada",
            "pieza-bloqueada",
            "pieza-completa"
        );

        tarjeta.setAttribute(
            "aria-pressed",
            "false"
        );
    }


    // Desactiva las piezas cuando todavía
    // no se ha seleccionado una persona.
    function desactivarTodasLasPiezas() {
        tarjetasPiezas.forEach(
            (tarjeta) => {
                limpiarEstadoTarjeta(
                    tarjeta
                );

                tarjeta.disabled = true;

                tarjeta.classList.add(
                    "pieza-bloqueada"
                );


                const estado =
                    tarjeta.querySelector(
                        ".estado-pieza"
                    );


                if (estado) {
                    estado.textContent =
                        "Selecciona una persona";
                }
            }
        );


        contadorPiezas.textContent =
            "0 piezas disponibles";
    }


    /* ==================================================
       10. ACTUALIZACIÓN DE LAS PIEZAS
       ================================================== */

    function actualizarPiezas() {
        if (!participanteActual) {
            desactivarTodasLasPiezas();
            return;
        }


        const generoParticipante =
            participanteActual.genero;


        let cantidadDisponibles = 0;


        tarjetasPiezas.forEach(
            (tarjeta) => {
                limpiarEstadoTarjeta(
                    tarjeta
                );


                const codigo =
                    tarjeta.dataset.codigo;


                const generoPieza =
                    normalizarGenero(
                        tarjeta.dataset.genero
                    );


                const estado =
                    tarjeta.querySelector(
                        ".estado-pieza"
                    );


                const cuposRestantes =
                    calcularCuposRestantes(
                        tarjeta
                    );


                const asignacionActual =
                    asignaciones[
                        participanteActual.id
                    ];


                const esAsignacionGuardada =
                    asignacionActual?.codigo ===
                    codigo;


                const correspondeAlGenero =
                    generoPieza ===
                    generoParticipante;


                // Bloquea piezas del género contrario.
                if (!correspondeAlGenero) {
                    tarjeta.disabled = true;

                    tarjeta.classList.add(
                        "pieza-bloqueada"
                    );


                    if (estado) {
                        estado.textContent =
                            "No corresponde al género";
                    }

                    return;
                }


                // Mantiene disponible la pieza que ya
                // estaba asignada a esta persona.
                if (esAsignacionGuardada) {
                    tarjeta.disabled = false;

                    tarjeta.classList.add(
                        "pieza-seleccionada"
                    );

                    tarjeta.setAttribute(
                        "aria-pressed",
                        "true"
                    );


                    if (estado) {
                        estado.textContent =
                            "Pieza asignada";
                    }

                    cantidadDisponibles += 1;
                    return;
                }


                // Bloquea piezas sin cupos.
                if (cuposRestantes <= 0) {
                    tarjeta.disabled = true;

                    tarjeta.classList.add(
                        "pieza-completa"
                    );


                    if (estado) {
                        estado.textContent =
                            "Completa";
                    }

                    return;
                }


                // Habilita piezas disponibles.
                tarjeta.disabled = false;


                if (estado) {
                    estado.textContent =
                        cuposRestantes === 1
                            ? "1 cupo disponible"
                            : `${cuposRestantes} cupos disponibles`;
                }


                cantidadDisponibles += 1;


                // Muestra la selección provisional.
                if (
                    codigoPiezaTemporal ===
                    codigo
                ) {
                    tarjeta.classList.add(
                        "pieza-seleccionada"
                    );

                    tarjeta.setAttribute(
                        "aria-pressed",
                        "true"
                    );


                    if (estado) {
                        estado.textContent =
                            "Seleccionada";
                    }
                }
            }
        );


        contadorPiezas.textContent =
            cantidadDisponibles === 1
                ? "1 pieza disponible"
                : `${cantidadDisponibles} piezas disponibles`;
    }


    /* ==================================================
       11. RESUMEN DE LA PIEZA SELECCIONADA
       ================================================== */

    function actualizarResumen() {
        if (
            !participanteActual ||
            !codigoPiezaTemporal
        ) {
            salidaNombrePieza.textContent =
                "Ninguna";

            salidaCuposPieza.textContent =
                "Selecciona una pieza disponible para continuar.";

            botonConfirmar.disabled = true;
            return;
        }


        const tarjetaSeleccionada =
            tarjetasPiezas.find(
                (tarjeta) =>
                    tarjeta.dataset.codigo ===
                    codigoPiezaTemporal
            );


        if (!tarjetaSeleccionada) {
            botonConfirmar.disabled = true;
            return;
        }


        const codigo =
            tarjetaSeleccionada.dataset.codigo;


        const nombre =
            tarjetaSeleccionada.dataset.nombre;


        const cuposRestantes =
            calcularCuposRestantes(
                tarjetaSeleccionada
            );


        salidaNombrePieza.textContent =
            `${codigo} — ${nombre}`;


        salidaCuposPieza.textContent =
            cuposRestantes === 1
                ? "Queda 1 cupo disponible."
                : `Quedan ${cuposRestantes} cupos disponibles.`;


        botonConfirmar.disabled = false;
    }


    /* ==================================================
       12. SELECCIÓN DEL PARTICIPANTE
       ================================================== */

    selectorParticipante.addEventListener(
        "change",
        () => {
            participanteActual =
                participantes.find(
                    (participante) =>
                        participante.id ===
                        selectorParticipante.value
                ) || null;


            if (!participanteActual) {
                codigoPiezaTemporal = "";

                salidaGenero.textContent =
                    "—";

                textoGenero.textContent =
                    "Primero selecciona un participante.";

                mensajeSeleccion.textContent =
                    "Selecciona una persona para mostrar las piezas correspondientes.";

                actualizarPiezas();
                actualizarResumen();
                return;
            }


            if (!participanteActual.genero) {
                codigoPiezaTemporal = "";

                salidaGenero.textContent =
                    "?";

                textoGenero.textContent =
                    "Esta persona no tiene un género válido registrado.";

                mensajeSeleccion.textContent =
                    "Corrige el género de esta persona antes de seleccionar una pieza.";

                actualizarPiezas();
                actualizarResumen();
                return;
            }


            salidaGenero.textContent =
                participanteActual.genero ===
                "femenino"
                    ? "M"
                    : "H";


            textoGenero.textContent =
                participanteActual.genero ===
                "femenino"
                    ? "Se mostrarán las piezas habilitadas para mujeres."
                    : "Se mostrarán las piezas habilitadas para hombres.";


            const asignacionExistente =
                asignaciones[
                    participanteActual.id
                ];


            codigoPiezaTemporal =
                asignacionExistente?.codigo ||
                "";


            if (asignacionExistente) {
                mensajeSeleccion.textContent =
                    `${participanteActual.nombre} ya tiene asignada la pieza ${asignacionExistente.codigo} — ${asignacionExistente.nombre}.`;
            } else {
                mensajeSeleccion.textContent =
                    `Selecciona una pieza disponible para ${participanteActual.nombre}.`;
            }


            actualizarPiezas();
            actualizarResumen();
        }
    );


    /* ==================================================
       13. SELECCIÓN DE UNA PIEZA
       ================================================== */

    tarjetasPiezas.forEach(
        (tarjeta) => {
            tarjeta.addEventListener(
                "click",
                () => {
                    if (
                        !participanteActual ||
                        tarjeta.disabled
                    ) {
                        return;
                    }


                    codigoPiezaTemporal =
                        tarjeta.dataset.codigo;


                    mensajeSeleccion.textContent =
                        `Seleccionaste provisionalmente la pieza ${tarjeta.dataset.codigo} — ${tarjeta.dataset.nombre}. Presiona “Confirmar pieza” para guardar.`;


                    actualizarPiezas();
                    actualizarResumen();
                }
            );
        }
    );


    /* ==================================================
       14. CONFIRMACIÓN DE LA PIEZA
       ================================================== */

    botonConfirmar.addEventListener(
        "click",
        () => {
            if (
                !participanteActual ||
                !codigoPiezaTemporal
            ) {
                return;
            }


            const tarjetaSeleccionada =
                tarjetasPiezas.find(
                    (tarjeta) =>
                        tarjeta.dataset.codigo ===
                        codigoPiezaTemporal
                );


            if (!tarjetaSeleccionada) {
                return;
            }


            const generoPieza =
                normalizarGenero(
                    tarjetaSeleccionada
                        .dataset.genero
                );


            if (
                generoPieza !==
                participanteActual.genero
            ) {
                alert(
                    "Esta pieza no corresponde al género registrado de la persona."
                );

                return;
            }


            const asignacionAnterior =
                asignaciones[
                    participanteActual.id
                ];


            const conservaMismaPieza =
                asignacionAnterior?.codigo ===
                codigoPiezaTemporal;


            if (
                !conservaMismaPieza &&
                calcularCuposRestantes(
                    tarjetaSeleccionada
                ) <= 0
            ) {
                alert(
                    "La pieza seleccionada ya no tiene cupos disponibles."
                );

                actualizarPiezas();
                actualizarResumen();
                return;
            }


            // Guarda la asignación de la persona.
            asignaciones[
                participanteActual.id
            ] = {
                participanteId:
                    participanteActual.id,

                nombreParticipante:
                    participanteActual.nombre,

                tipoParticipante:
                    participanteActual.tipo,

                genero:
                    participanteActual.genero,

                codigo:
                    tarjetaSeleccionada
                        .dataset.codigo,

                nombre:
                    tarjetaSeleccionada
                        .dataset.nombre,

                capacidad:
                    Number(
                        tarjetaSeleccionada
                            .dataset.capacidad
                    ),

                fechaAsignacion:
                    new Date().toISOString()
            };


            guardarAsignaciones();


            mensajeSeleccion.textContent =
                `Pieza confirmada para ${participanteActual.nombre}: ${tarjetaSeleccionada.dataset.codigo} — ${tarjetaSeleccionada.dataset.nombre}.`;


            actualizarPiezas();
            actualizarResumen();


            alert(
                `La pieza ${tarjetaSeleccionada.dataset.codigo} — ${tarjetaSeleccionada.dataset.nombre} fue asignada a ${participanteActual.nombre}.`
            );
        }
    );


    /* ==================================================
       15. ESTADO INICIAL
       ================================================== */

    cargarSelectorParticipantes();
    desactivarTodasLasPiezas();
    actualizarResumen();


    // Informa en la consola cuando se utiliza el modo de prueba.
    if (modoQA) {
        console.log(
            "Modo QA de selección de piezas activado."
        );
    }

});