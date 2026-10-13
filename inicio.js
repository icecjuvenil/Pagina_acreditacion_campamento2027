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