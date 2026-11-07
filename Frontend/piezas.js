document.addEventListener("DOMContentLoaded", async () => {

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
       2. CONTROL DE ACCESO CON CLOUDFLARE D1
       ================================================== */

    const contenidoPiezas = document.querySelector(
        ".contenido-piezas"
    );

    if (contenidoPiezas) {
        contenidoPiezas.hidden = true;
    }

    let pagoAutorizado = false;

    try {
        const respuesta = await fetch(
            "http://127.0.0.1:8787/api/resumen",
            {
                method: "GET",
                credentials: "include",
                cache: "no-store"
            }
        );

        if (!respuesta.ok) {
            throw new Error("No se pudo verificar el acceso.");
        }

        const datos = await respuesta.json();

        pagoAutorizado =
            datos.pago?.estado === "APROBADO";

    } catch (error) {
        console.error(
            "Error al verificar el pago:",
            error
        );
    }

    if (!pagoAutorizado) {
        alert(
            "Debes tener tu pago aprobado para seleccionar una habitación."
        );

        window.location.replace("login.html");
        return;
    }

    if (contenidoPiezas) {
        contenidoPiezas.hidden = false;
    }



    
    /* ==================================================
       3. RECUPERACIÓN DE PARTICIPANTES DESDE D1
       ================================================== */

    let resumenInscripcion;

    try {
        const respuesta = await fetch(
            "http://127.0.0.1:8787/api/resumen",
            {
                method: "GET",
                credentials: "include",
                cache: "no-store"
            }
        );

        if (!respuesta.ok) {
            throw new Error(
                "No se pudieron recuperar los participantes."
            );
        }

        resumenInscripcion = await respuesta.json();

        if (resumenInscripcion.pago?.estado !== "APROBADO") {
            throw new Error(
                "Tu pago debe estar aprobado."
            );
        }

    } catch (error) {
        console.error(error);
        alert(error.message);
        window.location.replace("login.html");
        return;
    }

    const participantes = [];

    // Participante principal
    const principal = resumenInscripcion.participante;

    if (principal) {
        participantes.push({
            id: `principal-${principal.id}`,
            tipo: "principal",
            nombre: principal.nombreCompleto,
            genero: normalizarGenero(principal.genero),
            datos: principal
        });
    }

    // Acompañantes registrados
    const acompanantes = Array.isArray(
        resumenInscripcion.acompanantes
    ) ? resumenInscripcion.acompanantes : [];

    acompanantes.forEach((acompanante) => {
        participantes.push({
            id: `acompanante-${acompanante.id}`,
            tipo: "acompanante",
            nombre: acompanante.nombreCompleto,
            genero: normalizarGenero(acompanante.genero),
            datos: acompanante
        });
    });

    if (participantes.length === 0) {
        alert(
            "No se encontraron participantes registrados."
        );

        window.location.replace("login.html");
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
        const disponibles = Number(
            tarjeta.dataset.disponibles
        );


        if (
            !Number.isSafeInteger(disponibles) ||
            disponibles < 0
        ) {
            return 0;
        }

        return disponibles;
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

        
    // Verificar si la persona ya tiene una
    // habitación asignada en Cloudflare D1.
    const asignacionExistente = participanteActual
        ? asignaciones[participanteActual.id]
        : null;

    if (asignacionExistente) {
        salidaNombrePieza.textContent =
            `${asignacionExistente.codigo} — ${asignacionExistente.nombre}`;

        salidaCuposPieza.textContent =
            "Habitación asignada correctamente. " +
            "No puedes reservar una segunda habitación.";

        botonConfirmar.disabled = true;
        botonConfirmar.textContent = "Habitación ya asignada";

        return;
    }

    // Restaurar el texto para personas
    // que todavía no tienen habitación.
    botonConfirmar.textContent = "Confirmar pieza";

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

                    // Evitar seleccionar otra habitación
                    // si esta persona ya tiene una asignación en D1.
                    const asignacionExistente =
                        asignaciones[participanteActual.id];

                    if (asignacionExistente) {
                        alert(
                            `${participanteActual.nombre} ya tiene asignada ` +
                            `la habitación ${asignacionExistente.codigo} — ` +
                            `${asignacionExistente.nombre}.`
                        );

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
        async () => {
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


            // ==========================================
            // GUARDAR LA RESERVA EN CLOUDFLARE D1
            // ==========================================

            botonConfirmar.disabled = true;

            try {
                // Consultar las habitaciones reales de D1.
                const respuestaHabitaciones = await fetch(
                    "http://127.0.0.1:8787/api/habitaciones",
                    {
                        method: "GET",
                        credentials: "include",
                        cache: "no-store"
                    }
                );

                if (!respuestaHabitaciones.ok) {
                    throw new Error(
                        "No se pudieron consultar las habitaciones."
                    );
                }

                const datosHabitaciones =
                    await respuestaHabitaciones.json();

                // Buscar el identificador real de la pieza.
                const codigo = tarjetaSeleccionada.dataset.codigo;

                const habitacion = datosHabitaciones.habitaciones.find(
                    h => h.nombre.startsWith(`${codigo} - `)
                );

                if (!habitacion) {
                    throw new Error(
                        "La habitación seleccionada no existe en D1."
                    );
                }

                // Enviar la asignación al backend.
                const respuestaReserva = await fetch(
                    "http://127.0.0.1:8787/api/habitaciones",
                    {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                            "X-ICEC-Solicitud": "web"
                        },
                        body: JSON.stringify({
                            habitacionId: habitacion.id,
                            personaId: participanteActual.datos.id,
                            tipo: participanteActual.tipo
                        })
                    }
                );

                const resultadoReserva =
                    await respuestaReserva.json();

                if (
                    !respuestaReserva.ok ||
                    resultadoReserva.estado !== "ASIGNADA"
                ) {
                    throw new Error(
                        resultadoReserva.mensaje ||
                        "No se pudo guardar la habitación."
                    );
                }

            } catch (error) {
                console.error(
                    "Error al reservar habitación:",
                    error
                );

                alert(error.message);
                return;

            } finally {
                botonConfirmar.disabled = false;
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

            // Actualizar los cupos reales después
            // de guardar correctamente en D1.
            try {
                await cargarDisponibilidadD1();
            } catch (error) {
                console.error(
                    "No se pudieron actualizar los cupos:",
                    error
                );

                alert(
                    "La habitación se guardó en D1, " +
                    "pero no se pudieron actualizar los cupos. " +
                    "Recarga la página antes de continuar."
                );

                botonConfirmar.disabled = true;
                return;
            }



            mensajeSeleccion.textContent =
                `Pieza confirmada para ${participanteActual.nombre}: ${tarjetaSeleccionada.dataset.codigo} — ${tarjetaSeleccionada.dataset.nombre}.`;


            actualizarPiezas();
            actualizarResumen();


            alert(
                `La pieza ${tarjetaSeleccionada.dataset.codigo} — ${tarjetaSeleccionada.dataset.nombre} fue asignada a ${participanteActual.nombre}.`
            );
        }
    );


    // ==========================================
    // CONSULTAR DISPONIBILIDAD REAL EN D1
    // ==========================================

    async function cargarDisponibilidadD1() {
        const respuesta = await fetch(
            "http://127.0.0.1:8787/api/habitaciones",
            {
                method: "GET",
                credentials: "include",
                cache: "no-store"
            }
        );

        if (!respuesta.ok) {
            throw new Error(
                "No se pudo consultar la disponibilidad."
            );
        }

        const datos = await respuesta.json();

        if (!Array.isArray(datos.habitaciones)) {
            throw new Error(
                "Respuesta de habitaciones no válida."
            );
        }

        // Bloquear todas las piezas hasta identificar
        // correctamente las habitaciones de D1.
        tarjetasPiezas.forEach(tarjeta => {
            tarjeta.dataset.disponibles = "0";
            tarjeta.disabled = true;
        });

        for (const habitacion of datos.habitaciones) {
            // En D1 el nombre incluye el código:
            // Ejemplo: "M5 - Gracia".
            const tarjeta = tarjetasPiezas.find(t =>
                habitacion.nombre.startsWith(
                    `${t.dataset.codigo} - `
                )
            );

            if (!tarjeta) {
                continue;
            }

            tarjeta.dataset.habitacionId =
                String(habitacion.id);

            tarjeta.dataset.disponibles =
                String(habitacion.disponibles);

            tarjeta.dataset.capacidad =
                String(habitacion.capacidad);

                
            // Identificar el estado real de la habitación
            // para aplicar colores al pasar el mouse.

            tarjeta.classList.remove(
                "habitacion-verde",
                "habitacion-amarilla",
                "habitacion-roja"
            );

            const cuposDisponibles = Number(
                habitacion.disponibles
            );

            const capacidadTotal = Number(
                habitacion.capacidad
            );

            if (cuposDisponibles <= 0) {
                // Habitación completa.
                tarjeta.classList.add("habitacion-roja");

            } else if (cuposDisponibles < capacidadTotal) {
                // Habitación parcialmente ocupada.
                tarjeta.classList.add("habitacion-amarilla");

            } else {
                // Habitación completamente disponible.
                tarjeta.classList.add("habitacion-verde");
            }


                
            // ==========================================
            // MOSTRAR PERSONAS ASIGNADAS A LA HABITACIÓN
            // ==========================================

            let listaOcupantes = tarjeta.querySelector(
                ".lista-ocupantes-pieza"
            );

            if (!listaOcupantes) {
                listaOcupantes = document.createElement("div");
                listaOcupantes.className =
                    "lista-ocupantes-pieza";

                tarjeta.appendChild(listaOcupantes);
            }

            // Limpiar nombres anteriores para evitar duplicados.
            listaOcupantes.replaceChildren();

            const ocupantes = Array.isArray(habitacion.ocupantes)
                ? habitacion.ocupantes
                : [];

            const titulo = document.createElement("strong");
            titulo.textContent = "Personas asignadas:";
            listaOcupantes.appendChild(titulo);

            if (ocupantes.length === 0) {
                const mensaje = document.createElement("span");
                mensaje.textContent = "Sin personas asignadas";
                listaOcupantes.appendChild(mensaje);
            } else {
                ocupantes.forEach(nombre => {
                    const persona = document.createElement("span");
                    persona.textContent = "• " + nombre;
                    listaOcupantes.appendChild(persona);
                });
            }

        }

        
        // ==========================================
        // RECUPERAR ASIGNACIONES REALES DESDE D1
        // ==========================================

        if (!Array.isArray(datos.asignaciones)) {
            throw new Error(
                "No se pudieron recuperar las asignaciones."
            );
        }

        // Eliminar las reservas temporales anteriores.
        Object.keys(asignaciones).forEach(clave => {
            delete asignaciones[clave];
        });

        sessionStorage.removeItem(
            "asignacionesPiezasCampamento"
        );

        // Recuperar las asignaciones de esta cuenta.
        datos.asignaciones.forEach(asignacion => {
            const idPersona =
                `${asignacion.tipo === "principal"
                    ? "principal"
                    : "acompanante"}-${asignacion.personaId}`;

            const persona = participantes.find(
                p => p.id === idPersona
            );

            const tarjeta = tarjetasPiezas.find(
                t => asignacion.nombreHabitacion.startsWith(
                    `${t.dataset.codigo} - `
                )
            );

            if (!persona || !tarjeta) {
                return;
            }

            asignaciones[idPersona] = {
                participanteId: idPersona,
                nombreParticipante: persona.nombre,
                tipoParticipante: persona.tipo,
                genero: persona.genero,
                codigo: tarjeta.dataset.codigo,
                nombre: tarjeta.dataset.nombre,
                capacidad: Number(
                    tarjeta.dataset.capacidad
                ),
                habitacionId: asignacion.habitacionId
            };
        });


        return datos.habitaciones;
    }


    /* ==================================================
       15. ESTADO INICIAL
       ================================================== */

    
    cargarSelectorParticipantes();
    desactivarTodasLasPiezas();
    actualizarResumen();

    try {
        await cargarDisponibilidadD1();
        actualizarPiezas();
        actualizarResumen();
    } catch (error) {
        console.error(
            "Error al cargar habitaciones:",
            error
        );

        alert(
            "No fue posible cargar los cupos reales. " +
            "No se pueden seleccionar habitaciones."
        );

        botonConfirmar.disabled = true;
        tarjetasPiezas.forEach(tarjeta => {
            tarjeta.disabled = true;
        });

        return;
    }



    // Informa en la consola cuando se utiliza el modo de prueba.
    if (modoQA) {
        console.log(
            "Modo QA de selección de piezas activado."
        );
    }

});