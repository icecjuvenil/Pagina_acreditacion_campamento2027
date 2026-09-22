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