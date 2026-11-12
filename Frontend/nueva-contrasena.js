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


/* Enviar nueva contraseña al backend */
formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    revisarConfirmacion();

    if (!formulario.reportValidity()) {
        return;
    }

    botonGuardar.disabled = true;
    mensaje.textContent = "Actualizando contraseña...";
    let respuestaExitosa = false;
    try {
        const respuesta = await fetch(
            "https://api.icec.cl/api/nueva-contrasena",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-ICEC-Solicitud": "web"
                },
                body: JSON.stringify({
                    correo: entradaCorreo.value.trim().toLowerCase(),
                    contrasenaProvisoria: entradaProvisoria.value.trim(),
                    nuevaContrasena: entradaNueva.value
                })
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.mensaje ||
                "No se pudo actualizar la contraseña."
            );
            
        }
        respuestaExitosa = true;
        mensaje.textContent =
            "Contraseña actualizada correctamente. Ya puedes iniciar sesión.";

        formulario.reset();
        entradaProvisoria.value = "";
        entradaNueva.value = "";
        entradaConfirmacion.value = "";

    } catch (error) {
        mensaje.textContent =
            error.message ||
            "Ocurrió un error al actualizar la contraseña.";

    } finally {
    actualizarFormulario();

    if (respuestaExitosa) {
        mensaje.textContent =
            "Contraseña actualizada correctamente. Ya puedes iniciar sesión.";
    }
}
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