//fechas del campamento//
const fechaInicioCampamento = new Date(2027,0,8);
const fechaFinCampamento = new Date(2027, 0, 11);

const contadorCampamento = document.querySelector(
    ".contador-campamento"
);

const diasRestantes = document.getElementById(
    "dias-restantes"
);

function actualizarContador() {
    const fechaActual = new Date();

    if (fechaActual < fechaInicioCampamento) {
        const milisegundoPorDia = 1000 * 60 * 60 *24;

        const diferencia = 
            fechaInicioCampamento - fechaActual;
        
        const cantidadDias = Math.ceil(
            diferencia / milisegundoPorDia
        );

        diasRestantes.textContent = cantidadDias;
        return;
    }

    if (fechaActual < fechaFinCampamento) {
        contadorCampamento.textContent =
            "¡El campamento ya comenzó! ";
            return;
    }

    contadorCampamento.textContent = 
        "El campamento 2027 ya ha finalizado.";
}

if (contadorCampamento && diasRestantes) {
    actualizarContador();

    setInterval(
        actualizarContador,
        1000 * 60 * 60
    );
}

// Mantiene el modo QA al entrar desde la página de inicio
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

    // Modifica todos los enlaces hacia la acreditación
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


// CARRUSEL DEL CAMPAMENTO ANTERIOR


(() => {
    // Elementos principales del carrusel
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

    const contenedorIndicadores = document.querySelector(
        ".indicadores-carrusel"
    );

    const fotografias = document.querySelectorAll(
        ".diapositiva-carrusel"
    );

    // Detiene el código si el carrusel no existe
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

    // Agrega los símbolos de las flechas
    botonAnterior.textContent = "‹";
    botonSiguiente.textContent = "›";

    let paginaActual = 0;

    // Determina cuántas fotografías se muestran
    function obtenerCantidadVisible() {
        if (window.innerWidth <= 600) {
            return 1;
        }

        if (window.innerWidth <= 900) {
            return 2;
        }

        return 3;
    }

    // Calcula cuántos grupos de fotografías existen
    function obtenerTotalPaginas() {
        return Math.ceil(
            fotografias.length / obtenerCantidadVisible()
        );
    }

    // Crea los puntos inferiores automáticamente
    function crearIndicadores() {
        contenedorIndicadores.innerHTML = "";

        const totalPaginas = obtenerTotalPaginas();

        for (
            let indice = 0;
            indice < totalPaginas;
            indice++
        ) {
            const indicador = document.createElement("button");

            indicador.type = "button";
            indicador.className = "indicador-carrusel";
            indicador.setAttribute(
                "aria-label",
                `Mostrar grupo ${indice + 1} de fotografías`
            );

            indicador.addEventListener("click", () => {
                paginaActual = indice;
                actualizarCarrusel();
            });

            contenedorIndicadores.appendChild(indicador);
        }
    }

    // Mueve la pista y actualiza los controles
    function actualizarCarrusel() {
        const totalPaginas = obtenerTotalPaginas();

        paginaActual = Math.max(
            0,
            Math.min(paginaActual, totalPaginas - 1)
        );

        const separacion = 16;

        const desplazamientoPorPagina =
            ventanaCarrusel.clientWidth + separacion;

        const desplazamientoMaximo = Math.max(
            0,
            pistaCarrusel.scrollWidth -
            ventanaCarrusel.clientWidth
        );

        const desplazamiento = Math.min(
            paginaActual * desplazamientoPorPagina,
            desplazamientoMaximo
        );

        pistaCarrusel.style.transform =
            `translateX(-${desplazamiento}px)`;

        const indicadores =
            contenedorIndicadores.querySelectorAll(
                ".indicador-carrusel"
            );

        indicadores.forEach((indicador, indice) => {
            const estaActivo = indice === paginaActual;

            indicador.classList.toggle(
                "activo",
                estaActivo
            );

            indicador.setAttribute(
                "aria-current",
                estaActivo ? "true" : "false"
            );
        });

        botonAnterior.disabled =
            paginaActual === 0;

        botonSiguiente.disabled =
            paginaActual === totalPaginas - 1;
    }

    // Retrocede un grupo
    botonAnterior.addEventListener("click", () => {
        paginaActual--;
        actualizarCarrusel();
    });

    // Avanza un grupo
    botonSiguiente.addEventListener("click", () => {
        paginaActual++;
        actualizarCarrusel();
    });

    // Recalcula el carrusel al cambiar la ventana
    window.addEventListener("resize", () => {
        paginaActual = 0;
        crearIndicadores();
        actualizarCarrusel();
    });

    // Inicia el carrusel
    crearIndicadores();
    actualizarCarrusel();
})();

// ==================================================
// VISOR DE FOTOGRAFÍAS AMPLIADAS
// ==================================================

(() => {

    // Elementos principales del visor
    const visor = document.getElementById("visor-fotografia");
    const imagenAmpliada = document.getElementById("imagen-ampliada");

    // Botones del visor
    const botonCerrar = document.getElementById("cerrar-visor");
    const botonAnterior = document.getElementById(
        "fotografia-anterior"
    );
    const botonSiguiente = document.getElementById(
        "fotografia-siguiente"
    );

    // Fotografías disponibles en el carrusel
    const fotografias = Array.from(
        document.querySelectorAll(".diapositiva-carrusel img")
    );

    // Detiene el código si falta algún elemento
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

    // Posición de la fotografía mostrada
    let indiceActual = 0;

    // Muestra una fotografía dentro del visor
    function mostrarFotografia(indice) {

        // Permite volver al principio o al final
        indiceActual =
            (indice + fotografias.length) %
            fotografias.length;

        const fotografia = fotografias[indiceActual];

        imagenAmpliada.src =
            fotografia.currentSrc || fotografia.src;

        imagenAmpliada.alt = fotografia.alt;
    }

    // Abre el visor en la fotografía seleccionada
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

    // Abre cada fotografía con clic o teclado
    fotografias.forEach((fotografia, indice) => {

        fotografia.tabIndex = 0;
        fotografia.setAttribute("role", "button");

        fotografia.setAttribute(
            "aria-label",
            `Ampliar fotografía: ${fotografia.alt}`
        );

        fotografia.addEventListener("click", () => {
            abrirVisor(indice);
        });

        fotografia.addEventListener("keydown", (evento) => {

            if (
                evento.key === "Enter" ||
                evento.key === " "
            ) {
                evento.preventDefault();
                abrirVisor(indice);
            }
        });
    });

    // Muestra la fotografía anterior
    botonAnterior.addEventListener("click", () => {
        mostrarFotografia(indiceActual - 1);
    });

    // Muestra la fotografía siguiente
    botonSiguiente.addEventListener("click", () => {
        mostrarFotografia(indiceActual + 1);
    });

    // Cierra desde el botón X
    botonCerrar.addEventListener("click", cerrarVisor);

    // Permite navegar con las flechas del teclado
    visor.addEventListener("keydown", (evento) => {

        if (evento.key === "ArrowLeft") {
            mostrarFotografia(indiceActual - 1);
        }

        if (evento.key === "ArrowRight") {
            mostrarFotografia(indiceActual + 1);
        }
    });

    // Cierra al hacer clic sobre el fondo oscuro
    visor.addEventListener("click", (evento) => {

        if (evento.target === visor) {
            cerrarVisor();
        }
    });

    // Limpia la fotografía después de cerrar
    visor.addEventListener("close", () => {
        imagenAmpliada.src = "";
        imagenAmpliada.alt = "";
    });

})();