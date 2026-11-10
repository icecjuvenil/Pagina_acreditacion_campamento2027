/* ==================================================
   ACCESO ADMINISTRATIVO
   ================================================== */

/*
 * Dirección provisional del backend.
 * Cuando el equipo de backend entregue la dirección definitiva,
 * solamente será necesario cambiar esta constante.
 */

const URL_LOGIN_ADMIN = "https://icec-campamento-2027-api.brantemarco777.workers.dev/api/login";

/* ==================================================
   ELEMENTOS DE LA PÁGINA
   ================================================== */

const formularioAdmin =
    document.getElementById("formulario-admin-login");

const correoAdmin =
    document.getElementById("correo-admin");

const contrasenaAdmin =
    document.getElementById("contrasena-admin");

const botonMostrarContrasena =
    document.getElementById("boton-mostrar-contrasena-admin");

const mensajeAdmin =
    document.getElementById("mensaje-admin-login");

const botonIngresar =
    formularioAdmin?.querySelector(".boton-ingresar-admin");


/* ==================================================
   MOSTRAR MENSAJES
   ================================================== */

/**
 * Muestra un mensaje dentro del formulario.
 *
 * @param {string} texto Mensaje que verá el usuario.
 */

function mostrarMensajeAdmin(texto) {

    if (!mensajeAdmin) {
        return;
    }

    mensajeAdmin.textContent = texto;
    mensajeAdmin.hidden = false;
}

/**
 * Oculta y limpia el mensaje del formulario.
 */

function ocultarMensajeAdmin() {

    if (!mensajeAdmin) {
        return;
    }

    mensajeAdmin.textContent = "";
    mensajeAdmin.hidden = true;
}

/* ==================================================
   MOSTRAR U OCULTAR CONTRASEÑA
   ================================================== */

function cambiarVisibilidadContrasena() {

    if (!contrasenaAdmin || !botonMostrarContrasena) {
        return;
    }

    const contrasenaVisible =
        contrasenaAdmin.type === "text";

    if (contrasenaVisible) {

        contrasenaAdmin.type = "password";

        botonMostrarContrasena.setAttribute(
            "aria-label",
            "Mostrar contraseña"
        );

        botonMostrarContrasena.setAttribute(
            "aria-pressed",
            "false"
        );

    } else {

        contrasenaAdmin.type = "text";

        botonMostrarContrasena.setAttribute(
            "aria-label",
            "Ocultar contraseña"
        );

        botonMostrarContrasena.setAttribute(
            "aria-pressed",
            "true"
        );
    }

    contrasenaAdmin.focus();
}


botonMostrarContrasena?.addEventListener(
    "click",
    cambiarVisibilidadContrasena
);

/* ==================================================
   ESTADO DEL BOTÓN
   ================================================== */

   function cambiarEstadoBotonAdmin(cargando) {

    if (!botonIngresar) {
        return;
    }

    botonIngresar.disabled = cargando;

    if (cargando) {

        botonIngresar.innerHTML = `
            <span aria-hidden="true">⌛</span>
            Verificando acceso...
        `;

    } else {

        botonIngresar.innerHTML = `
            <span aria-hidden="true">→</span>
            Ingresar al panel
        `;
    }
}

/* ==================================================
   ENVÍO DEL FORMULARIO
   ================================================== */
async function iniciarSesionAdministrador(evento) {

    evento.preventDefault();

    ocultarMensajeAdmin();

    /*
     * Utiliza las validaciones definidas en el HTML:
     * correo obligatorio, formato válido y contraseña mínima.
     */

     if (!formularioAdmin.checkValidity()) {

        formularioAdmin.reportValidity();
        return;
    }

    // Obtener el token de Cloudflare Turnstile
const tokenTurnstile =
    window.turnstile?.getResponse();

if (!tokenTurnstile) {
    mostrarMensajeAdmin(
        "Completa la verificación de seguridad."
    );
    return;
}

// Datos enviados al backend
const datosAcceso = {
    correo: correoAdmin.value.trim(),
    contrasena: contrasenaAdmin.value,
    turnstileToken: tokenTurnstile
};

    cambiarEstadoBotonAdmin(true);

    try {

        const respuesta = await fetch(URL_LOGIN_ADMIN, {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-ICEC-Solicitud": "web"
            },

            /*
             * Permite que el backend cree y reciba
             * una cookie segura de sesión.
             */
            credentials: "include",

            body: JSON.stringify(datosAcceso)
        });

        let resultado = {};

        try {
            resultado = await respuesta.json();
        } catch (error) {
            resultado = {};
        }

        if (!respuesta.ok) {

            const mensaje =
                resultado.mensaje ||
                "El correo o la contraseña no son correctos.";

            throw new Error(mensaje);
        }

       
if (resultado.rol !== "ADMINISTRADOR") {

    // Cerrar la sesión si corresponde a un participante
    try {
        await fetch(
            "https://icec-campamento-2027-api.brantemarco777.workers.dev/api/logout",
            {
                method: "POST",
                credentials: "include",
                headers: {
                    "X-ICEC-Solicitud": "web"
                }
            }
        );
    } catch (error) {
        console.error(
            "No fue posible cerrar la sesión:",
            error
        );
    }

    throw new Error(
        "Acceso denegado. Esta sección es exclusiva para administradores."
    );
}

// Acceso permitido
window.location.href = "admin.html";

    } catch (error) {

        /*
         * Mientras el backend no esté disponible,
         * también aparecerá este mensaje.
         */
        const mensaje =
            error instanceof TypeError
                ? "No fue posible conectar con el servidor administrativo."
                : error.message;

        mostrarMensajeAdmin(mensaje);

    } finally {

        cambiarEstadoBotonAdmin(false);
    }
}


formularioAdmin?.addEventListener(
    "submit",
    iniciarSesionAdministrador
);

/* ==================================================
   LIMPIEZA DE MENSAJES
   ================================================== */

/*
 * Al modificar los datos se oculta el error anterior
 * para no mantener información desactualizada.
 */

correoAdmin?.addEventListener(
    "input",
    ocultarMensajeAdmin
);

contrasenaAdmin?.addEventListener(
    "input",
    ocultarMensajeAdmin
); 
