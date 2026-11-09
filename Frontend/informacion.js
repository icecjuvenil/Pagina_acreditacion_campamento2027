
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

    
    // Carteles oficiales de las 17 habitaciones
    const cartelesHabitaciones = {
        // Habitaciones de hombres
        "H1": "habitaciones-carteles/h1-muerte-y-resurreccion.png",
        "H2": "habitaciones-carteles/h2-victoria.png",
        "H3": "habitaciones-carteles/h3-salvacion.png",
        "H4": "habitaciones-carteles/h4-fe.png",
        "H5": "habitaciones-carteles/h5-humildad-y-obediencia.png",
        "H6": "habitaciones-carteles/h6-cruz-diaria.png",
        "H7": "habitaciones-carteles/h7-nuevo-pacto.png",

        // Habitaciones de mujeres
        "M1": "habitaciones-carteles/m1-redencion.png",
        "M2": "habitaciones-carteles/m2-expiacion.png",
        "M3": "habitaciones-carteles/m3-sacrificio.png",
        "M4": "habitaciones-carteles/m4-sangre-de-cristo.png",
        "M5": "habitaciones-carteles/m5-gracia.png",
        "M6": "habitaciones-carteles/m6-perdon.png",
        "M7": "habitaciones-carteles/m7-reconciliacion.png",
        "M8": "habitaciones-carteles/m8-justificacion.png",
        "M9": "habitaciones-carteles/m9-amor-de-dios.png",
        "M10": "habitaciones-carteles/m10-sustitucion.png"
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

        
        // Identificar el cartel de cualquiera de las 17 habitaciones
        const codigo = habitacion?.nombre
            ?.match(/\b(?:H[1-7]|M(?:10|[1-9]))\b/i)
            ?.[0]
            ?.toUpperCase();

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

