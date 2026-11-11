
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
            "https://api.icec.cl/api/resumen",
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
    // Ocultar la selección de piezas cuando
// el líder no tiene acompañantes.
const esLider = datos.participante?.beneficioLider === true;

const tieneAcompanantes =
    Array.isArray(datos.acompanantes) &&
    datos.acompanantes.length > 0;

const accesoPiezas = document.querySelector(
    ".acceso-seleccion-piezas"
);

// Ocultar la selección de habitaciones
// para líderes sin acompañantes.
if (esLider && !tieneAcompanantes) {

    // Ocultar el botón de la página.
    if (accesoPiezas) {
        accesoPiezas.hidden = true;
    }

    // Ocultar el enlace del menú superior.
    const enlaceMenuPiezas = document.querySelector(
        '.menu-principal a[href="piezas.html"]'
    );

    if (enlaceMenuPiezas) {
        enlaceMenuPiezas.hidden = true;
    }
}

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
        "https://api.icec.cl/api/habitaciones",
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
    const esLiderSinAcompanantes =
    datos.participante?.beneficioLider === true &&
    (!datos.acompanantes || datos.acompanantes.length === 0);

titulo.textContent = esLiderSinAcompanantes
    ? "✓ Acreditación de líder"
    : "🛏 Habitaciones asignadas";
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

    // Mostrar "Escoger piezas" solo si falta alguna habitación.
const accesoPiezas = document.querySelector(
    ".acceso-seleccion-piezas"
);

const asignaciones = informacion.asignaciones || [];

const faltanHabitaciones = personas.some(persona => {

    // Los líderes no necesitan habitación.
    if (
        persona.tipo === "principal" &&
        persona.beneficioLider === true
    ) {
        return false;
    }

    // Comprobar si tiene una habitación asignada.
    return !asignaciones.some(asignacion =>
        asignacion.personaId === persona.id &&
        asignacion.tipo === persona.tipo &&
        asignacion.habitacionId != null
    );
});

if (accesoPiezas) {
    accesoPiezas.hidden = !faltanHabitaciones;
}

    
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

       if (
    persona.tipo === "principal" &&
    persona.beneficioLider === true
) {
    nombreHabitacion.textContent =
        "✓ Inscripción gratuita confirmada";

    nombreHabitacion.classList.add(
        "estado-lider-acreditado"
    );
} else {
    nombreHabitacion.textContent =
        habitacion?.nombre || "Sin habitación asignada";
}

        tarjeta.appendChild(nombreHabitacion);
        // Indicación especial para líderes acreditados.
if (
    persona.tipo === "principal" &&
    persona.beneficioLider === true
) {
    const avisoLider = document.createElement("p");

    avisoLider.className = "aviso-habitacion-lider";

    avisoLider.textContent =
        "No requiere asignación de habitación.";

    tarjeta.appendChild(avisoLider);
}

        
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

