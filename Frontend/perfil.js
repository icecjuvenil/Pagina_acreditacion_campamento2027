
/*
 * CAMPAMENTO ICEC JUVENIL 2027
 * Menú de perfil compartido
 */

document.addEventListener("DOMContentLoaded", async () => {
    const menuPrincipal = document.querySelector(
        ".menu-principal"
    );

    if (!menuPrincipal) return;

    const API = "http://127.0.0.1:8787";

    // Mostrar el menú solo si existe una sesión activa.
    let usuario;

    try {
        const respuesta = await fetch(
            `${API}/api/sesion`,
            {
                method: "GET",
                credentials: "include",
                cache: "no-store"
            }
        );

        if (!respuesta.ok) return;

        const datos = await respuesta.json();

        if (!datos.autenticado || !datos.usuario) {
            return;
        }

        usuario = datos.usuario;

    } catch (error) {
        console.error(
            "No fue posible consultar la sesión:",
            error
        );
        return;
    }

    // Estilos del menú.
    const estilos = document.createElement("style");

    estilos.textContent = `
        .icec-perfil {
            position: relative;
            display: inline-flex;
            align-items: center;
            margin-left: 16px;
        }

        .icec-perfil-boton {
            width: 42px;
            height: 42px;
            border: 2px solid #d6b45c;
            border-radius: 50%;
            background: #153d21;
            color: white;
            font-size: 21px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .icec-perfil-boton:hover {
            background: #245a32;
        }

        .icec-perfil-menu {
            position: absolute;
            top: calc(100% + 12px);
            right: 0;
            z-index: 9999;
            width: 245px;
            padding: 10px;
            border-radius: 12px;
            background: #fff;
            box-shadow: 0 8px 28px rgba(0,0,0,.18);
            border: 1px solid #e8e5da;
        }

        .icec-perfil-menu[hidden] {
            display: none !important;
        }

        .icec-perfil-titulo {
            padding: 10px;
            font-weight: 700;
            color: #153d21;
            overflow-wrap: anywhere;
            border-bottom: 1px solid #eee;
            margin-bottom: 5px;
        }

        .icec-perfil-opcion {
            display: block;
            width: 100%;
            box-sizing: border-box;
            padding: 12px;
            border: 0;
            border-radius: 7px;
            background: transparent;
            color: #153d21;
            text-align: left;
            text-decoration: none;
            font: inherit;
            font-size: 14px;
            cursor: pointer;
        }

        .icec-perfil-opcion:hover {
            background: #f2f5ed;
        }

        .icec-perfil-pendiente {
            color: #888;
            cursor: default;
        }

        .icec-perfil-salir {
            color: #ac3028;
            border-top: 1px solid #eee;
            margin-top: 5px;
        }
    `;

    document.head.appendChild(estilos);

    // Crear contenedor.
    const perfil = document.createElement("div");
    perfil.className = "icec-perfil";

    const botonPerfil = document.createElement("button");
    botonPerfil.type = "button";
    botonPerfil.className = "icec-perfil-boton";
    // Mostrar la inicial del nombre del usuario.
const nombrePerfil = (
    usuario.nombreCompleto ||
    usuario.correo ||
    "U"
).trim();

botonPerfil.textContent =
    nombrePerfil.charAt(0).toLocaleUpperCase("es-CL");
    botonPerfil.setAttribute("aria-label", "Mi perfil");
    botonPerfil.setAttribute("aria-expanded", "false");
    botonPerfil.setAttribute("aria-haspopup", "true");

    const menu = document.createElement("div");
    menu.className = "icec-perfil-menu";
    menu.hidden = true;

    const titulo = document.createElement("div");
    titulo.className = "icec-perfil-titulo";
    titulo.textContent =
        usuario.nombreCompleto ||
        usuario.correo ||
        "Mi cuenta";

    menu.appendChild(titulo);

    // Crear opciones del menú.
    function agregarEnlace(texto, destino) {
        const enlace = document.createElement("a");
        enlace.className = "icec-perfil-opcion";
        enlace.href = destino;
        enlace.textContent = texto;
        menu.appendChild(enlace);
    }

    // Acceso a la página Mi perfil.
agregarEnlace(
    "Mi perfil",
    "perfil.html"
);

    agregarEnlace(
        "Informaciones",
        "informacion.html"
    );

    agregarEnlace(
        "Habitaciones",
        "piezas.html"
    );

    // Cerrar sesión.
    const salir = document.createElement("button");
    salir.type = "button";
    salir.className =
        "icec-perfil-opcion icec-perfil-salir";
    salir.textContent = "Cerrar sesión";

    salir.addEventListener("click", async () => {
        salir.disabled = true;
        salir.textContent = "Cerrando sesión...";

        try {
            const respuesta = await fetch(
                `${API}/api/logout`,
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
                    "No se pudo cerrar la sesión."
                );
            }

            // Limpiar información temporal.
            sessionStorage.removeItem(
                "personaPrincipalCampamento"
            );
            sessionStorage.removeItem(
                "acompanantesCampamento"
            );
            sessionStorage.removeItem(
                "pagoCampamento"
            );

            window.location.replace(
                usuario.rol === "ADMINISTRADOR"
                    ? "admin-login.html"
                    : "login.html"
            );

        } catch (error) {
            alert(error.message);
            salir.disabled = false;
            salir.textContent = "Cerrar sesión";
        }
    });

    menu.appendChild(salir);

    // Abrir o cerrar el menú.
    botonPerfil.addEventListener("click", () => {
        menu.hidden = !menu.hidden;
        botonPerfil.setAttribute(
            "aria-expanded",
            String(!menu.hidden)
        );
    });

    // Cerrar al hacer clic fuera.
    document.addEventListener("click", (evento) => {
        if (!perfil.contains(evento.target)) {
            menu.hidden = true;
            botonPerfil.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    });

    // Cerrar con Escape.
    document.addEventListener("keydown", (evento) => {
        if (evento.key === "Escape") {
            menu.hidden = true;
            botonPerfil.setAttribute(
                "aria-expanded",
                "false"
            );
        }
    });

    perfil.append(botonPerfil, menu);
    menuPrincipal.appendChild(perfil);
});
