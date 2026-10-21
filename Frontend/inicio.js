// ==================================================
// 1. CONTADOR DEL CAMPAMENTO
// ==================================================

// Inicio: viernes 8 de enero de 2027 a las 19:30
const fechaInicioCampamento = new Date(
    2027,
    0,
    8,
    19,
    30,
    0
);

// Final: domingo 10 de enero de 2027 a las 14:30
const fechaFinCampamento = new Date(
    2027,
    0,
    10,
    14,
    30,
    0
);

// Elementos del contador
const contadorCampamento = document.querySelector(
    ".contador-campamento"
);

const diasRestantes = document.getElementById(
    "dias-restantes"
);

const horasRestantes = document.getElementById(
    "horas-restantes"
);

const minutosRestantes = document.getElementById(
    "minutos-restantes"
);

const segundosRestantes = document.getElementById(
    "segundos-restantes"
);

let intervaloContador = null;

// Actualiza los días, horas, minutos y segundos
function actualizarContador() {
    const fechaActual = new Date();

    const diferencia =
        fechaInicioCampamento.getTime() -
        fechaActual.getTime();

    if (diferencia > 0) {
        const segundosTotales = Math.floor(
            diferencia / 1000
        );

        const dias = Math.floor(
            segundosTotales / 86400
        );

        const horas = Math.floor(
            (segundosTotales % 86400) / 3600
        );

        const minutos = Math.floor(
            (segundosTotales % 3600) / 60
        );

        const segundos =
            segundosTotales % 60;

        diasRestantes.textContent = dias;

        horasRestantes.textContent =
            String(horas).padStart(2, "0");

        minutosRestantes.textContent =
            String(minutos).padStart(2, "0");

        segundosRestantes.textContent =
            String(segundos).padStart(2, "0");

        return;
    }

    // Mensaje durante o después del campamento
    if (fechaActual <= fechaFinCampamento) {
        contadorCampamento.textContent =
            "¡El campamento ya comenzó!";
    } else {
        contadorCampamento.textContent =
            "El campamento 2027 ya finalizó.";
    }

    if (intervaloContador) {
        clearInterval(intervaloContador);
    }
}

// Inicia el contador
if (
    contadorCampamento &&
    diasRestantes &&
    horasRestantes &&
    minutosRestantes &&
    segundosRestantes
) {
    actualizarContador();

    if (new Date() < fechaInicioCampamento) {
        intervaloContador = setInterval(
            actualizarContador,
            1000
        );
    }
}


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