/* ==================================================
   NUEVA CONTRASEÑA — VALIDACIÓN DEL FORMULARIO
   ================================================== */

(() => {
    const formulario =
        document.getElementById("formulario-nueva-contrasena");

    const entradaCorreo =
        document.getElementById("correo-nueva-contrasena");

    const entradaProvisoria =
        document.getElementById("contrasena-provisoria");

    const entradaNueva =
        document.getElementById("nueva-contrasena");

    const entradaConfirmacion =
        document.getElementById("confirmar-nueva-contrasena");

    const botonGuardar =
        document.getElementById("guardar-nueva-contrasena");

    const mensaje =
        document.getElementById("mensaje-nueva-contrasena");

    if (
        !formulario ||
        !entradaCorreo ||
        !entradaProvisoria ||
        !entradaNueva ||
        !entradaConfirmacion ||
        !botonGuardar ||
        !mensaje
    ) {
        return;
    }

    /* Revisar que las contraseñas coincidan */
    function revisarConfirmacion() {
        entradaConfirmacion.setCustomValidity("");

        if (
            entradaConfirmacion.value &&
            entradaNueva.value !== entradaConfirmacion.value
        ) {
            entradaConfirmacion.setCustomValidity(
                "Las contraseñas no coinciden."
            );
        }
    }

    /* Habilitar el botón al completar correctamente los campos */
    function actualizarFormulario() {
        revisarConfirmacion();

        const camposCompletos =
            entradaCorreo.value.trim() !== "" &&
            entradaProvisoria.value.trim() !== "" &&
            entradaNueva.value !== "" &&
            entradaConfirmacion.value !== "";

        botonGuardar.disabled =
            !camposCompletos ||
            !formulario.checkValidity();

        mensaje.textContent =
            entradaConfirmacion.value &&
            entradaNueva.value !== entradaConfirmacion.value
                ? "Las contraseñas no coinciden."
                : "Completa los campos para crear tu nueva contraseña.";
    }

    formulario.addEventListener(
        "input",
        actualizarFormulario
    );

    formulario.addEventListener(
        "change",
        actualizarFormulario
    );

    /* Evitar enviar contraseñas sin una conexión configurada */
    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();

        revisarConfirmacion();

        if (!formulario.reportValidity()) {
            return;
        }

        /*
         * Aquí se conectará la solicitud al backend.
         * No se guardan contraseñas en el navegador.
         */
        mensaje.textContent =
            "No es posible guardar la contraseña en este momento. " +
            "Inténtalo más tarde.";
    });

    actualizarFormulario();
})();

/* ==================================================
   MOSTRAR U OCULTAR LAS CONTRASEÑAS
   ================================================== */

(() => {
    const casillaMostrar =
        document.getElementById("mostrar-contrasenas");

    const camposContrasena = [
        document.getElementById("contrasena-provisoria"),
        document.getElementById("nueva-contrasena"),
        document.getElementById("confirmar-nueva-contrasena")
    ];

    if (!casillaMostrar) {
        return;
    }

    function actualizarVisibilidad() {
        const tipo = casillaMostrar.checked
            ? "text"
            : "password";

        camposContrasena.forEach((campo) => {
            if (campo) {
                campo.type = tipo;
            }
        });
    }

    casillaMostrar.addEventListener(
        "change",
        actualizarVisibilidad
    );

    actualizarVisibilidad();
})();