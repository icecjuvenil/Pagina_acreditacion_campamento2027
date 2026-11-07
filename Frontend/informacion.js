
/*
 * ICEC Juvenil 2027
 * Control de acceso a Informaciones
 * Requiere sesión activa y pago APROBADO en D1.
 */

document.addEventListener("DOMContentLoaded", async () => {
    const contenido = document.getElementById(
        "informacion"
    );

    const accesoDenegado = document.getElementById(
        "acceso-informacion-denegado"
    );

    if (!contenido || !accesoDenegado) {
        console.error(
            "No se encontraron las secciones de acceso."
        );
        return;
    }

    // Bloquear mientras se comprueba el permiso.
    contenido.hidden = true;
    accesoDenegado.hidden = false;

    try {
        const respuesta = await fetch(
            "http://127.0.0.1:8787/api/resumen",
            {
                method: "GET",
                credentials: "include",
                cache: "no-store"
            }
        );

        if (!respuesta.ok) {
            throw new Error("Acceso no autorizado.");
        }

        const datos = await respuesta.json();

        
if (datos.pago?.estado === "APROBADO") {
    contenido.hidden = false;
    accesoDenegado.hidden = true;

    try {
        await mostrarHabitacionesAsignadas(datos);
    } catch (error) {
        console.error(
            "No se pudieron mostrar las habitaciones:",
            error
        );
    }
}


    } catch (error) {
        console.error(
            "No se pudo verificar el acceso:",
            error
        );
    }
});


async function mostrarHabitacionesAsignadas(datos) {
    const contenedor = document.getElementById(
        "informacion-habitaciones"
    );

    if (!contenedor) return;

    const respuesta = await fetch(
        "http://127.0.0.1:8787/api/habitaciones",
        {
            method: "GET",
            credentials: "include",
            cache: "no-store"
        }
    );

    if (!respuesta.ok) {
        throw new Error(
            "No se pudieron consultar las habitaciones."
        );
    }

    const informacion = await respuesta.json();

    contenedor.replaceChildren();

    // Título principal
    const titulo = document.createElement("h3");
    titulo.textContent = "🛏 Habitaciones asignadas";
    contenedor.appendChild(titulo);

    // Participante principal y sus acompañantes
    const personas = [
        {
            ...datos.participante,
            tipo: "principal"
        },
        ...(datos.acompanantes || []).map(persona => ({
            ...persona,
            tipo: "acompanante"
        }))
    ];

    // Carteles disponibles para la prueba
    const cartelesHabitaciones = {
        "H1": "habitaciones-carteles/h1-muerte-y-resurreccion.png",
        "H4": "habitaciones-carteles/h4-fe.png"
    };

    // Contenedor de tarjetas
    const lista = document.createElement("div");
    lista.className = "lista-habitaciones-asignadas";

    for (const persona of personas) {

        const asignacion = (
            informacion.asignaciones || []
        ).find(a =>
            a.personaId === persona.id &&
            a.tipo === persona.tipo
        );

        const habitacion = (
            informacion.habitaciones || []
        ).find(h =>
            h.id === asignacion?.habitacionId
        );

        // Tarjeta individual
        const tarjeta = document.createElement("div");
        tarjeta.className = "tarjeta-habitacion-asignada";

        // Nombre del participante
        const nombre = document.createElement("p");
        nombre.className = "tarjeta-habitacion-persona";
        nombre.textContent = persona.nombreCompleto;

        tarjeta.appendChild(nombre);

        // Nombre completo de la habitación
        const nombreHabitacion = document.createElement("p");
        nombreHabitacion.className = "tarjeta-habitacion-nombre";

        nombreHabitacion.textContent = habitacion?.nombre
            || "Sin habitación asignada";

        tarjeta.appendChild(nombreHabitacion);

        // Identificar cartel correspondiente
        const codigo = habitacion?.nombre
            ?.match(/\bH[14]\b/i)?.[0]?.toUpperCase();

        const rutaCartel = cartelesHabitaciones[codigo];

        if (rutaCartel) {
            const imagen = document.createElement("img");

            imagen.src = rutaCartel;
            imagen.alt = "Cartel de " + habitacion.nombre;
            imagen.className = "tarjeta-habitacion-cartel";
            imagen.loading = "lazy";

            tarjeta.appendChild(imagen);
        }

        lista.appendChild(tarjeta);
    }

    contenedor.appendChild(lista);
    contenedor.hidden = false;
}

