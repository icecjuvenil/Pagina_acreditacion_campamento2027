// ==================================================
// 1. PLAZO, CAMPAMENTO Y CUPOS
// ==================================================

(() => {
    // Elementos del resumen mostrado en la portada
    const contadorCampamento =
        document.querySelector(".contador-campamento");

    const salidaDiasCierreAcreditacion =
        document.getElementById(
            "dias-cierre-acreditacion"
        );

    const salidaEstadoAcreditacion =
        document.getElementById(
            "estado-acreditacion"
        );

    const salidaDiasCampamento =
        document.getElementById(
            "dias-campamento"
        );

    const salidaCuposDisponibles =
        document.getElementById(
            "cupos-disponibles"
        );

    const botonAcreditacion =
        document.querySelector(
            ".boton-acreditacion"
        );

    // Detiene solamente esta sección si falta algún elemento
    if (
        !contadorCampamento ||
        !salidaDiasCierreAcreditacion ||
        !salidaEstadoAcreditacion ||
        !salidaDiasCampamento ||
        !salidaCuposDisponibles
    ) {
        return;
    }

    // Fechas oficiales
    const fechaInicioAcreditacion =
        new Date(2026, 10, 6, 0, 0, 0);

    const fechaFinAcreditacion =
        new Date(2026, 11, 6, 23, 59, 59);

    const fechaInicioCampamento =
        new Date(2027, 0, 8, 19, 30, 0);

    // Los líderes también se descuentan de estos 90 cupos
    const TOTAL_CUPOS_CAMPAMENTO = 90;

    /*
     * Valor temporal mientras se conecta el backend.
     * Posteriormente debe reemplazarse por la cantidad
     * real de acreditaciones aprobadas.
     */
    const ACREDITACIONES_REGISTRADAS = 0;

    const MILISEGUNDOS_POR_DIA =
        1000 * 60 * 60 * 24;

    const enlaceOriginalAcreditacion =
        botonAcreditacion?.getAttribute("href") ||
        "acreditacion.html";

    /*
     * Devuelve una fecha sin horas para realizar
     * cálculos por días calendario.
     */
    function obtenerInicioDelDia(fecha) {
        return new Date(
            fecha.getFullYear(),
            fecha.getMonth(),
            fecha.getDate()
        );
    }

    /*
     * Calcula los días restantes sin considerar
     * horas, minutos ni segundos.
     */
    function calcularDiasCalendario(
        fechaDestino,
        fechaActual
    ) {
        const destino =
            obtenerInicioDelDia(fechaDestino);

        const actual =
            obtenerInicioDelDia(fechaActual);

        return Math.max(
            0,
            Math.ceil(
                (destino - actual) /
                MILISEGUNDOS_POR_DIA
            )
        );
    }

    /*
     * Habilita o bloquea el botón Acredítate
     * según el periodo de inscripción.
     */
    function cambiarDisponibilidadBoton(
        disponible
    ) {
        if (!botonAcreditacion) {
            return;
        }

        botonAcreditacion.classList.toggle(
            "deshabilitado",
            !disponible
        );

        botonAcreditacion.setAttribute(
            "aria-disabled",
            String(!disponible)
        );

        if (disponible) {
            botonAcreditacion.setAttribute(
                "href",
                enlaceOriginalAcreditacion
            );

            botonAcreditacion.removeAttribute(
                "tabindex"
            );
        } else {
            botonAcreditacion.removeAttribute(
                "href"
            );

            botonAcreditacion.setAttribute(
                "tabindex",
                "-1"
            );
        }
    }

    /*
     * Actualiza el plazo de las acreditaciones.
     */
    function actualizarPlazoAcreditacion(
        fechaActual
    ) {
        // Antes de la apertura
        if (
            fechaActual <
            fechaInicioAcreditacion
        ) {
            salidaDiasCierreAcreditacion.textContent =
                "--";

            salidaEstadoAcreditacion.textContent =
                "Acreditaciones próximamente";

            cambiarDisponibilidadBoton(false);

            return;
        }

        // Después del cierre
        if (
            fechaActual >
            fechaFinAcreditacion
        ) {
            salidaDiasCierreAcreditacion.textContent =
                "0";

            salidaEstadoAcreditacion.textContent =
                "Acreditaciones cerradas";

            cambiarDisponibilidadBoton(false);

            return;
        }

        const diasParaCerrar =
            calcularDiasCalendario(
                fechaFinAcreditacion,
                fechaActual
            );

        salidaDiasCierreAcreditacion.textContent =
            String(diasParaCerrar);

        // Durante el 6 de diciembre
        if (diasParaCerrar === 0) {
            salidaEstadoAcreditacion.textContent =
                "Último día para acreditarte";
        } else {
            salidaEstadoAcreditacion.textContent =
                "días para el cierre";
        }

        cambiarDisponibilidadBoton(true);
    }

    /*
     * Actualiza los días restantes para el campamento.
     */
    function actualizarDiasCampamento(
        fechaActual
    ) {
        const diasParaCampamento =
            calcularDiasCalendario(
                fechaInicioCampamento,
                fechaActual
            );

        salidaDiasCampamento.textContent =
            String(diasParaCampamento);

        const descripcion =
            salidaDiasCampamento.nextElementSibling;

        if (
            descripcion &&
            fechaActual >= fechaInicioCampamento
        ) {
            descripcion.textContent =
                "campamento en curso";
        }
    }

    /*
     * Calcula los cupos disponibles.
     */
    
async function actualizarCuposDisponibles() {
    try {
        const respuesta = await fetch(
            "https://icec-campamento-2027-api.brantemarco777.workers.dev/api/cupos",
            {
                method: "GET",
                cache: "no-store"
            }
        );

        if (!respuesta.ok) {
            throw new Error(
                "No se pudieron consultar los cupos."
            );
        }

        const datos = await respuesta.json();

        if (
            datos.estado !== "OK" ||
            !Number.isSafeInteger(datos.total) ||
            !Number.isSafeInteger(datos.ocupados) ||
            !Number.isSafeInteger(datos.disponibles) ||
            datos.total < 0 ||
            datos.ocupados < 0 ||
            datos.disponibles !==
                Math.max(0, datos.total - datos.ocupados)
        ) {
            throw new Error(
                "Los datos de cupos no son válidos."
            );
        }

        salidaCuposDisponibles.textContent =
            String(datos.disponibles);

        contadorCampamento.querySelector(
            ".resumen-cupos"
        )?.setAttribute(
            "aria-label",
            `${datos.disponibles} cupos disponibles de ${datos.total}`
        );

    } catch (error) {
        console.error(
            "Error al consultar los cupos:",
            error
        );

        salidaCuposDisponibles.textContent = "--";
    }
}


    /*
     * Actualiza todos los datos del resumen.
     */
    function actualizarResumenCampamento() {
        const ahora = new Date();

        actualizarPlazoAcreditacion(ahora);
        actualizarDiasCampamento(ahora);
        actualizarCuposDisponibles();
    }

    // Primera actualización inmediata
    actualizarResumenCampamento();

    // Actualización automática cada minuto
    const intervaloResumen =
        window.setInterval(
            actualizarResumenCampamento,
            60 * 1000
        );

    // Limpia el intervalo al abandonar la página
    window.addEventListener(
        "beforeunload",
        () => {
            window.clearInterval(
                intervaloResumen
            );
        },
        { once: true }
    );
})();

// ==================================================
// 2. MODO QA
// ==================================================

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

    // Conserva el modo QA al ir a acreditación
    const enlacesAcreditacion =
        document.querySelectorAll(
            'a[href="acreditacion.html"]'
        );

    enlacesAcreditacion.forEach((enlace) => {
        enlace.href =
            "acreditacion.html?qa=1";
    });

    console.log(
        "Modo QA iniciado desde la página principal"
    );
})();


// ==================================================
// 3. CARRUSEL DEL CAMPAMENTO ANTERIOR
// ==================================================

(() => {
    const ventanaCarrusel = document.querySelector(
        ".carrusel-ventana"
    );

    const pistaCarrusel = document.getElementById(
        "carrusel-pista"
    );

    const botonAnterior = document.getElementById(
        "carrusel-anterior"
    );

    const botonSiguiente = document.getElementById(
        "carrusel-siguiente"
    );

    const contenedorIndicadores =
        document.querySelector(
            ".indicadores-carrusel"
        );

    const fotografias =
        document.querySelectorAll(
            ".diapositiva-carrusel"
        );

    // Detiene la función si falta algún elemento
    if (
        !ventanaCarrusel ||
        !pistaCarrusel ||
        !botonAnterior ||
        !botonSiguiente ||
        !contenedorIndicadores ||
        fotografias.length === 0
    ) {
        return;
    }

    // Símbolos de las flechas
    botonAnterior.textContent = "‹";
    botonSiguiente.textContent = "›";

    let paginaActual = 0;
    let intervaloAutomatico = null;

    const tiempoEntreMovimientos = 4500;

    // Fotografías visibles según el ancho de pantalla
    function obtenerCantidadVisible() {
        if (window.innerWidth <= 600) {
            return 1;
        }

        if (window.innerWidth <= 900) {
            return 2;
        }

        return 3;
    }

    // Cantidad de grupos del carrusel
    function obtenerTotalPaginas() {
        return Math.ceil(
            fotografias.length /
            obtenerCantidadVisible()
        );
    }

    // Crea los puntos inferiores
    function crearIndicadores() {
        contenedorIndicadores.innerHTML = "";

        const totalPaginas =
            obtenerTotalPaginas();

        for (
            let indice = 0;
            indice < totalPaginas;
            indice++
        ) {
            const indicador =
                document.createElement("button");

            indicador.type = "button";

            indicador.className =
                "indicador-carrusel";

            indicador.setAttribute(
                "aria-label",
                `Mostrar grupo ${indice + 1} de fotografías`
            );

            indicador.addEventListener(
                "click",
                () => {
                    paginaActual = indice;
                    actualizarCarrusel();
                    reiniciarMovimientoAutomatico();
                }
            );

            contenedorIndicadores.appendChild(
                indicador
            );
        }
    }

    // Mueve las fotografías
    function actualizarCarrusel() {
        const totalPaginas =
            obtenerTotalPaginas();

        paginaActual =
            (paginaActual + totalPaginas) %
            totalPaginas;

        const separacion = 16;

        const desplazamientoPorPagina =
            ventanaCarrusel.clientWidth +
            separacion;

        const desplazamientoMaximo = Math.max(
            0,
            pistaCarrusel.scrollWidth -
            ventanaCarrusel.clientWidth
        );

        const desplazamiento = Math.min(
            paginaActual *
            desplazamientoPorPagina,
            desplazamientoMaximo
        );

        pistaCarrusel.style.transform =
            `translateX(-${desplazamiento}px)`;

        actualizarIndicadores();
        actualizarFlechas(totalPaginas);
    }

    // Activa el indicador correspondiente
    function actualizarIndicadores() {
        const indicadores =
            contenedorIndicadores.querySelectorAll(
                ".indicador-carrusel"
            );

        indicadores.forEach(
            (indicador, indice) => {
                const estaActivo =
                    indice === paginaActual;

                indicador.classList.toggle(
                    "activo",
                    estaActivo
                );

                indicador.setAttribute(
                    "aria-current",
                    estaActivo
                        ? "true"
                        : "false"
                );
            }
        );
    }

    // Desactiva las flechas si no hay más grupos
    function actualizarFlechas(totalPaginas) {
        const hayVariasPaginas =
            totalPaginas > 1;

        botonAnterior.disabled =
            !hayVariasPaginas;

        botonSiguiente.disabled =
            !hayVariasPaginas;
    }

    // Detiene el movimiento automático
    function detenerMovimientoAutomatico() {
        if (!intervaloAutomatico) {
            return;
        }

        clearInterval(intervaloAutomatico);
        intervaloAutomatico = null;
    }

    // Inicia el movimiento automático
    function iniciarMovimientoAutomatico() {
        detenerMovimientoAutomatico();

        const reducirMovimiento =
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches;

        if (
            obtenerTotalPaginas() <= 1 ||
            reducirMovimiento
        ) {
            return;
        }

        intervaloAutomatico = setInterval(
            () => {
                paginaActual++;
                actualizarCarrusel();
            },
            tiempoEntreMovimientos
        );
    }

    // Reinicia el tiempo después de una acción manual
    function reiniciarMovimientoAutomatico() {
        detenerMovimientoAutomatico();
        iniciarMovimientoAutomatico();
    }

    // Flecha anterior
    botonAnterior.addEventListener(
        "click",
        () => {
            paginaActual--;
            actualizarCarrusel();
            reiniciarMovimientoAutomatico();
        }
    );

    // Flecha siguiente
    botonSiguiente.addEventListener(
        "click",
        () => {
            paginaActual++;
            actualizarCarrusel();
            reiniciarMovimientoAutomatico();
        }
    );

    // Pausa el movimiento al colocar el cursor
    ventanaCarrusel.addEventListener(
        "mouseenter",
        detenerMovimientoAutomatico
    );

    ventanaCarrusel.addEventListener(
        "mouseleave",
        iniciarMovimientoAutomatico
    );

    // Pausa mientras se navega con teclado
    ventanaCarrusel.addEventListener(
        "focusin",
        detenerMovimientoAutomatico
    );

    ventanaCarrusel.addEventListener(
        "focusout",
        (evento) => {
            if (
                !ventanaCarrusel.contains(
                    evento.relatedTarget
                )
            ) {
                iniciarMovimientoAutomatico();
            }
        }
    );

    // Recalcula el carrusel al cambiar la pantalla
    window.addEventListener(
        "resize",
        () => {
            paginaActual = 0;
            crearIndicadores();
            actualizarCarrusel();
            reiniciarMovimientoAutomatico();
        }
    );

    // Pausa si la pestaña del navegador no está visible
    document.addEventListener(
        "visibilitychange",
        () => {
            if (document.hidden) {
                detenerMovimientoAutomatico();
            } else {
                iniciarMovimientoAutomatico();
            }
        }
    );

    // Inicia el carrusel
    crearIndicadores();
    actualizarCarrusel();
    iniciarMovimientoAutomatico();
})();


// ==================================================
// 4. VISOR DE FOTOGRAFÍAS AMPLIADAS
// ==================================================

(() => {
    const visor =
        document.getElementById(
            "visor-fotografia"
        );

    const imagenAmpliada =
        document.getElementById(
            "imagen-ampliada"
        );

    const botonCerrar =
        document.getElementById(
            "cerrar-visor"
        );

    const botonAnterior =
        document.getElementById(
            "fotografia-anterior"
        );

    const botonSiguiente =
        document.getElementById(
            "fotografia-siguiente"
        );

    const fotografias = Array.from(
        document.querySelectorAll(
            ".diapositiva-carrusel img"
        )
    );

    // Detiene la función si falta algún elemento
    if (
        !visor ||
        !imagenAmpliada ||
        !botonCerrar ||
        !botonAnterior ||
        !botonSiguiente ||
        fotografias.length === 0
    ) {
        return;
    }

    // Símbolos de los controles del visor
    botonCerrar.textContent = "×";
    botonAnterior.textContent = "‹";
    botonSiguiente.textContent = "›";

    let indiceActual = 0;

    // Muestra una fotografía
    function mostrarFotografia(indice) {
        indiceActual =
            (indice + fotografias.length) %
            fotografias.length;

        const fotografia =
            fotografias[indiceActual];

        imagenAmpliada.src =
            fotografia.currentSrc ||
            fotografia.src;

        imagenAmpliada.alt =
            fotografia.alt;
    }

    // Abre el visor
    function abrirVisor(indice) {
        mostrarFotografia(indice);

        if (!visor.open) {
            visor.showModal();
        }
    }

    // Cierra el visor
    function cerrarVisor() {
        if (visor.open) {
            visor.close();
        }
    }

    // Permite abrir cada fotografía
    fotografias.forEach(
        (fotografia, indice) => {
            fotografia.tabIndex = 0;
            fotografia.setAttribute(
                "role",
                "button"
            );

            fotografia.setAttribute(
                "aria-label",
                `Ampliar fotografía: ${fotografia.alt}`
            );

            fotografia.addEventListener(
                "click",
                () => {
                    abrirVisor(indice);
                }
            );

            fotografia.addEventListener(
                "keydown",
                (evento) => {
                    if (
                        evento.key === "Enter" ||
                        evento.key === " "
                    ) {
                        evento.preventDefault();
                        abrirVisor(indice);
                    }
                }
            );
        }
    );

    // Fotografía anterior
    botonAnterior.addEventListener(
        "click",
        () => {
            mostrarFotografia(
                indiceActual - 1
            );
        }
    );

    // Fotografía siguiente
    botonSiguiente.addEventListener(
        "click",
        () => {
            mostrarFotografia(
                indiceActual + 1
            );
        }
    );

    // Cierra desde el botón X
    botonCerrar.addEventListener(
        "click",
        cerrarVisor
    );

    // Navegación mediante teclado
    visor.addEventListener(
        "keydown",
        (evento) => {
            if (evento.key === "ArrowLeft") {
                mostrarFotografia(
                    indiceActual - 1
                );
            }

            if (evento.key === "ArrowRight") {
                mostrarFotografia(
                    indiceActual + 1
                );
            }
        }
    );

    // Cierra al presionar el fondo oscuro
    visor.addEventListener(
        "click",
        (evento) => {
            if (evento.target === visor) {
                cerrarVisor();
            }
        }
    );

    // Limpia la fotografía al cerrar
    visor.addEventListener(
        "close",
        () => {
            imagenAmpliada.src = "";
            imagenAmpliada.alt = "";
        }
    );
})();