
/*
 * CAMPAMENTO JUVENIL ICEC 2027
 *
 * Frontend: inicio de sesión
 * Backend: Cloudflare Workers + D1
 *
 * Funciones:
 * - Iniciar sesión
 * - Verificar sesión activa
 * - Mostrar información del usuario
 * - Cerrar sesión
 */

// ==========================================
// CONFIGURACIÓN DE LA API
// ==========================================

const API_LOGIN =
 /* "https://api.icec.cl";*/
    "https://api.icec.cl";
// ==========================================
// ELEMENTOS DEL FORMULARIO
// ==========================================

const formularioLogin =
  document.getElementById("formulario-login");

const correoLogin =
  document.getElementById("correo-login");

const contrasenaLogin =
  document.getElementById("contrasena-login");

const botonIniciar =
  document.getElementById("boton-iniciar-sesion");

const mensajeLogin =
  document.getElementById("mensaje-login");

const panelSesion =
  document.getElementById("panel-sesion");

const nombreUsuario =
  document.getElementById("nombre-usuario");

const correoUsuario =
  document.getElementById("correo-usuario");

const botonCerrar =
  document.getElementById("boton-cerrar-sesion");

const crearCuenta =
  document.getElementById("crear-cuenta-login");

// ==========================================
// MENSAJES
// ==========================================

function mostrarMensaje(texto, error = false) {
  if (!mensajeLogin) return;

  mensajeLogin.textContent = texto;

  mensajeLogin.style.color =
    error ? "#b42318" : "#18794e";
}

// ==========================================
// ESTADO DE CARGA
// ==========================================

function cambiarEstadoBoton(cargando) {
  if (!botonIniciar) return;

  botonIniciar.disabled = cargando;

  botonIniciar.textContent = cargando
    ? "Iniciando sesión..."
    : "Iniciar sesión";
}

// ==========================================
// MOSTRAR USUARIO CONECTADO
// ==========================================


async function verificarAccesosCampamento(usuario) {
    const accesos = document.getElementById(
        "accesos-pago-aprobado"
    );

    if (!accesos) return;

    // Mantener ocultos los accesos por defecto.
    accesos.hidden = true;

    if (usuario?.rol !== "PARTICIPANTE") {
        return;
    }

    try {
        const respuesta = await fetch(
            `${API_LOGIN}/api/resumen`,
            {
                method: "GET",
                credentials: "include",
                cache: "no-store"
            }
        );

        if (!respuesta.ok) return;

        const datos = await respuesta.json();

        if (datos.pago?.estado === "APROBADO") {
            accesos.hidden = false;
        }

    } catch (error) {
        console.error(
            "No se pudo verificar el estado del pago:",
            error
        );
    }
}


function mostrarUsuario(usuario) {
  if (!usuario) return;
  verificarAccesosCampamento(usuario);

  if (formularioLogin) {
    formularioLogin.hidden = true;
  }

  if (crearCuenta) {
    crearCuenta.hidden = true;
  }

  if (panelSesion) {
    panelSesion.hidden = false;
  }

  if (nombreUsuario) {
    nombreUsuario.textContent =
      usuario.nombreCompleto
        ? `Bienvenido: ${usuario.nombreCompleto}`
        : "Bienvenido al Campamento ICEC 2027";
  }

  if (correoUsuario) {
    correoUsuario.textContent =
      usuario.correo || "";
  }
}

// ==========================================
// MOSTRAR FORMULARIO
// ==========================================

function mostrarFormulario() {
  if (formularioLogin) {
    formularioLogin.hidden = false;
  }

  if (crearCuenta) {
    crearCuenta.hidden = false;
  }

  if (panelSesion) {
    panelSesion.hidden = true;
  }

  if (contrasenaLogin) {
    contrasenaLogin.value = "";
  }

  mostrarMensaje("");
}

// ==========================================
// VERIFICAR SESIÓN ACTIVA
// ==========================================

async function consultarSesionActiva() {
  const respuesta = await fetch(
    `${API_LOGIN}/api/sesion`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store"
    }
  );

  if (respuesta.status === 401) {
    return null;
  }

  if (!respuesta.ok) {
    throw new Error(
      "No fue posible verificar la sesión."
    );
  }

  const resultado = await respuesta.json();

  if (
    resultado.autenticado !== true ||
    !resultado.usuario
  ) {
    return null;
  }

  return resultado.usuario;
}

// ==========================================
// INICIAR SESIÓN
// ==========================================

async function iniciarSesion(evento) {
  evento.preventDefault();

  if (
    !formularioLogin ||
    !correoLogin ||
    !contrasenaLogin
  ) {
    return;
  }

  if (!formularioLogin.reportValidity()) {
    return;
  }

  const tokenTurnstile =
    window.turnstile?.getResponse();

  if (!tokenTurnstile) {
    mostrarMensaje(
      "Completa la verificación de seguridad.",
      true
    );

    return;
  }

  const correo = correoLogin.value
    .trim()
    .toLowerCase();

  const contrasena = contrasenaLogin.value;

  cambiarEstadoBoton(true);

  mostrarMensaje("");

  try {
    const respuesta = await fetch(
      `${API_LOGIN}/api/login`,
      {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "X-ICEC-Solicitud": "web"
        },
        body: JSON.stringify({
            correo,
            contrasena,
            turnstileToken: tokenTurnstile
        })
      }
    );

    const resultado = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(
        resultado.mensaje ||
        "No fue posible iniciar sesión."
      );
    }

    // Comprobar que el navegador
    // haya conservado la cookie.

    const usuario = await consultarSesionActiva();

    if (!usuario) {
      throw new Error(
        "Las credenciales fueron aceptadas, " +
        "pero el navegador no conservó la sesión. " +
        "Revisa las cookies de terceros."
      );
    }

    mostrarUsuario(usuario);

mostrarMensaje(
  "Sesión iniciada correctamente."
);

// Redirigir al participante a Mi perfil.
if (
  usuario.rol === "PARTICIPANTE" ||
  usuario.rol === "ADMINISTRADOR"
) {
  window.location.replace("perfil.html");
  return;
}
  } catch (error) {
    console.error(
      "Error al iniciar sesión:",
      error
    );

    mostrarMensaje(
      error.message ||
      "Ocurrió un error al iniciar sesión.",
      true
    );

  } finally {
    cambiarEstadoBoton(false);

    if (window.turnstile) {
      window.turnstile.reset();
    }
  }
}

// ==========================================
// CERRAR SESIÓN
// ==========================================

async function cerrarSesion() {
  if (botonCerrar) {
    botonCerrar.disabled = true;
    botonCerrar.textContent =
      "Cerrando sesión...";
  }

  try {
    const respuesta = await fetch(
      `${API_LOGIN}/api/logout`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "X-ICEC-Solicitud": "web"
        }
      }
    );

    if (!respuesta.ok) {
      throw new Error(
        "No fue posible cerrar la sesión."
      );
    }

    mostrarFormulario();

    if (window.turnstile) {
      window.turnstile.reset();
    }

    mostrarMensaje(
      "Sesión cerrada correctamente."
    );

  } catch (error) {
    console.error(
      "Error al cerrar sesión:",
      error
    );

    mostrarMensaje(
      error.message ||
      "No fue posible cerrar la sesión.",
      true
    );

  } finally {
    if (botonCerrar) {
      botonCerrar.disabled = false;
      botonCerrar.textContent =
        "Cerrar sesión";
    }
  }
}

// ==========================================
// INICIALIZAR FORMULARIO
// ==========================================

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    if (formularioLogin) {
      formularioLogin.addEventListener(
        "submit",
        iniciarSesion
      );
    }

    if (botonCerrar) {
      botonCerrar.addEventListener(
        "click",
        cerrarSesion
      );
    }

    // Revisar si el participante
    // ya tiene una sesión activa.

    try {
      const usuario =
        await consultarSesionActiva();

      if (usuario) {
    if (usuario.rol === "PARTICIPANTE") {
        window.location.replace("perfil.html");
        return;
    }

    mostrarUsuario(usuario);
} else {
    mostrarFormulario();
}

    } catch (error) {
      console.error(
        "Error al consultar sesión:",
        error
      );

      mostrarMensaje(
        "No fue posible comprobar la sesión. " +
        "Intenta nuevamente.",
        true
      );
    }
  }
);
