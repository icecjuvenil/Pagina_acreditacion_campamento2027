
/*
 * CAMPAMENTO ICEC 2027
 * Solicitar recuperación de contraseña
 */

const API_RECUPERACION = "https://api.icec.cl";

document.addEventListener("DOMContentLoaded", () => {

    const formulario = document.getElementById(
        "formulario-recuperacion"
    );

    const correo = document.getElementById(
        "correo-recuperacion"
    );

    const boton = document.getElementById(
        "enviar-provisoria"
    );

    const mensaje = document.getElementById(
        "mensaje-recuperacion"
    );

    if (!formulario || !correo || !boton || !mensaje) {
        return;
    }

    formulario.addEventListener("submit", async (evento) => {
        evento.preventDefault();

        if (!formulario.reportValidity()) {
            return;
        }

        boton.disabled = true;
        boton.textContent = "Enviando solicitud...";
        mensaje.textContent = "";

        try {
            const respuesta = await fetch(
                `${API_RECUPERACION}/api/recuperar-contrasena`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-ICEC-Solicitud": "web"
                    },
                    body: JSON.stringify({
                        correo: correo.value.trim().toLowerCase(),
                        turnstileToken: window.turnstile?.getResponse()
                    })
                }
            );

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    resultado.mensaje ||
                    "No fue posible procesar la solicitud."
                );
            }

            mensaje.textContent =
                resultado.mensaje ||
                "Si el correo está registrado, recibirás un código de recuperación.";

        } catch (error) {
            console.error(
                "Error al solicitar recuperación:",
                error.message
            );

            mensaje.textContent =
                "No fue posible procesar la solicitud. Inténtalo nuevamente.";

        } finally {
    boton.disabled = false;
    boton.textContent = "Enviar contraseña provisoria";

    // Preparar una nueva verificación de seguridad.
    window.turnstile?.reset();
}
    });
});
