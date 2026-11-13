
/*
 * CAMPAMENTO ICEC JUVENIL 2027
 * Página Mi perfil
 * Datos obtenidos desde Cloudflare D1
 */

document.addEventListener("DOMContentLoaded", cargarMiPerfil);

const API_PERFIL = "https://api.icec.cl";

function obtenerElemento(id) {
    return document.getElementById(id);
}

function mostrarTexto(valor) {
    if (valor === null || valor === undefined || valor === "") {
        return "No informado";
    }

    return String(valor);
}

// Mostrar el RUT con formato chileno.
function formatearRut(rut) {
    if (!rut) return "No informado";

    const limpio = String(rut)
        .replace(/[^0-9kK]/g, "")
        .toUpperCase();

    if (limpio.length < 2) {
        return String(rut);
    }

    const cuerpo = limpio.slice(0, -1);
    const dv = limpio.slice(-1);

    const cuerpoFormateado = cuerpo.replace(
        /\B(?=(\d{3})+(?!\d))/g,
        "."
    );

    return `${cuerpoFormateado}-${dv}`;
}
function formatearFecha(fecha) {
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
        return "No informada";
    }

    const [anio, mes, dia] = fecha.split("-");

    return `${dia}/${mes}/${anio}`;
}

function formatearDinero(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
        return "No disponible";
    }

    return `$${numero.toLocaleString("es-CL")}`;
}

function crearDato(etiqueta, valor) {
    const contenedor = document.createElement("div");
    contenedor.className = "perfil-dato";

    const titulo = document.createElement("strong");
    titulo.textContent = etiqueta;

    const contenido = document.createElement("span");
    contenido.textContent = mostrarTexto(valor);

    contenedor.append(titulo, contenido);

    return contenedor;
}

function crearGrid() {
    const grid = document.createElement("div");
    grid.className = "perfil-grid";

    return grid;
}

async function consultarAPI(ruta) {
    const respuesta = await fetch(
        `${API_PERFIL}${ruta}`,
        {
            method: "GET",
            credentials: "include",
            cache: "no-store"
        }
    );

    const datos = await respuesta.json().catch(() => null);

    if (!respuesta.ok) {
        throw new Error(
            datos?.mensaje ||
            "No se pudo consultar la información."
        );
    }

    return datos;
}

// ==========================================
// DATOS PERSONALES
// ==========================================

function mostrarDatosPersonales(participante) {
    const contenedor = obtenerElemento(
        "perfil-datos-personales"
    );

    const grid = crearGrid();

    grid.append(
        crearDato("Nombre completo", participante.nombreCompleto),
        crearDato("RUT", formatearRut(participante.rut)),
        crearDato("Correo electrónico", participante.correo),
        crearDato("Teléfono", participante.telefono),
        crearDato(
            "Fecha de nacimiento",
            formatearFecha(participante.fechaNacimiento)
        ),
        crearDato("Género", participante.genero)
    );

    contenedor.replaceChildren(grid);
}

// ==========================================
// ACOMPAÑANTES
// ==========================================

function mostrarAcompanantes(acompanantes) {
    const contenedor = obtenerElemento(
        "perfil-acompanantes"
    );

    contenedor.replaceChildren();

    if (acompanantes.length === 0) {
        const mensaje = document.createElement("p");
        mensaje.textContent = "No tienes acompañantes registrados.";

        contenedor.appendChild(mensaje);
        return;
    }

    acompanantes.forEach((persona, indice) => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "perfil-acompanante";

        const titulo = document.createElement("h3");
        titulo.textContent = `Acompañante ${indice + 1}`;

        const grid = crearGrid();

        grid.append(
            crearDato("Nombre completo", persona.nombreCompleto),
            crearDato("RUT", formatearRut(persona.rut)),
            crearDato("Correo", persona.correo),
            crearDato(
                "Fecha de nacimiento",
                formatearFecha(persona.fechaNacimiento)
            ),
            crearDato("Género", persona.genero),
            crearDato(
                "Valor de acreditación",
                formatearDinero(persona.valorAcreditacion)
            )
        );

        tarjeta.append(titulo, grid);
        contenedor.appendChild(tarjeta);
    });
}

// ==========================================
// ESTADO DE ACREDITACIÓN
// ==========================================

function obtenerEstadoPago(estado) {
    const estados = {
        PENDIENTE: "Pendiente de pago",
        EN_REVISION: "Pago en revisión",
        APROBADO: "Acreditación aprobada",
        RECHAZADO: "Pago rechazado"
    };

    return estados[estado] || mostrarTexto(estado);
}

function mostrarAcreditacion(participante, pago, esAdministrador = false) {
    const contenedor = obtenerElemento(
        "perfil-acreditacion"
    );

    const grid = crearGrid();

    grid.append(
        
        crearDato(
            "Valor de inscripción principal",
            formatearDinero(participante.valorAcreditacion)
        ),
        crearDato(
            "Total de la inscripción",
            formatearDinero(pago.montoTotal)
        ),
        crearDato(
            "Monto pagado",
            formatearDinero(pago.montoPagado)
        )
    );

   

    contenedor.replaceChildren(grid);
    // Mostrar el beneficio de líder cuando esté aplicado.
if (participante.beneficioLider === true) {
    const beneficio = document.createElement("div");

    beneficio.className = "perfil-beneficio-lider";

    beneficio.textContent =
        "★ Beneficio de líder aplicado — Inscripción gratuita";

    contenedor.appendChild(beneficio);
}

    const estado = document.createElement("p");
    estado.className = "perfil-estado";
    estado.textContent = esAdministrador
    ? "Acreditación habilitada — Administrador"
    : obtenerEstadoPago(pago.estado);

    contenedor.prepend(estado);

    if (pago.estado === "RECHAZADO" && pago.motivoRechazo) {
        const motivo = document.createElement("p");
        motivo.textContent =
            `Motivo del rechazo: ${pago.motivoRechazo}`;

        contenedor.appendChild(motivo);
    }
}

// ==========================================
// HABITACIONES ASIGNADAS
// ==========================================

function mostrarHabitaciones(participante, acompanantes, informacion) {
    // Carteles oficiales de las habitaciones ICEC 2027.
const cartelesHabitaciones = {
    // Habitaciones de hombres
    H1: "habitaciones-carteles/h1-muerte-y-resurreccion.png",
    H2: "habitaciones-carteles/h2-victoria.png",
    H3: "habitaciones-carteles/h3-salvacion.png",
    H4: "habitaciones-carteles/h4-fe.png",
    H5: "habitaciones-carteles/h5-humildad-y-obediencia.png",
    H6: "habitaciones-carteles/h6-cruz-diaria.png",
    H7: "habitaciones-carteles/h7-nuevo-pacto.png",

    // Habitaciones de mujeres
    M1: "habitaciones-carteles/m1-redencion.png",
    M2: "habitaciones-carteles/m2-expiacion.png",
    M3: "habitaciones-carteles/m3-sacrificio.png",
    M4: "habitaciones-carteles/m4-sangre-de-cristo.png",
    M5: "habitaciones-carteles/m5-gracia.png",
    M6: "habitaciones-carteles/m6-perdon.png",
    M7: "habitaciones-carteles/m7-reconciliacion.png",
    M8: "habitaciones-carteles/m8-justificacion.png",
    M9: "habitaciones-carteles/m9-amor-de-dios.png",
    M10: "habitaciones-carteles/m10-sustitucion.png"
};
    const contenedor = obtenerElemento(
        "perfil-habitaciones"
    );

    contenedor.replaceChildren();

    const personas = [
        { ...participante, tipo: "principal" },
        ...acompanantes.map(persona => ({
            ...persona,
            tipo: "acompanante"
        }))
    ];

    const asignaciones = Array.isArray(informacion.asignaciones)
        ? informacion.asignaciones
        : [];

    const grid = crearGrid();

    personas.forEach(persona => {
        const esLider =
            persona.tipo === "principal" &&
            persona.beneficioLider === true;

        const asignacion = asignaciones.find(item =>
            Number(item.personaId) === Number(persona.id) &&
            item.tipo === persona.tipo
        );

        let descripcion;

        if (esLider) {
            descripcion = "Líder acreditado - no requiere habitación";
        } else if (asignacion) {
            descripcion = asignacion.nombreHabitacion ||
                "Habitación asignada";
        } else {
            descripcion = "Sin habitación asignada";
        }

        const tarjeta = document.createElement("div");
tarjeta.className = "perfil-habitacion";

tarjeta.appendChild(
    crearDato(persona.nombreCompleto, descripcion)
);

// Identificar el código de la habitación asignada.
const codigo = asignacion?.nombreHabitacion
    ?.match(/\b(?:H[1-7]|M(?:10|[1-9]))\b/i)
    ?.[0]
    ?.toUpperCase();

if (codigo && !esLider) {
    const media = document.createElement("div");
    media.className = "perfil-habitacion-media";

    const imagen = document.createElement("img");

    imagen.src = cartelesHabitaciones[codigo];
    imagen.alt = `Cartel de ${descripcion}`;
    imagen.className = "perfil-habitacion-imagen";
    imagen.loading = "lazy";

    media.appendChild(imagen);
    tarjeta.appendChild(media);
}

grid.appendChild(tarjeta);
    });

    contenedor.appendChild(grid);
}

// ==========================================
// CARGAR PERFIL DESDE D1
// ==========================================

async function cargarMiPerfil() {
    const cargando = obtenerElemento("perfil-cargando");
    const errorSeccion = obtenerElemento("perfil-error");
    const errorMensaje = obtenerElemento("perfil-error-mensaje");
    const contenido = obtenerElemento("perfil-contenido");

    cargando.hidden = false;
    errorSeccion.hidden = true;
    contenido.hidden = true;

    try {
        const datos = await consultarAPI("/api/resumen");

        if (
            !datos.participante ||
            !Array.isArray(datos.acompanantes) ||
            !datos.pago
        ) {
            throw new Error(
                "El servidor entregó información incompleta."
            );
        }

        mostrarDatosPersonales(datos.participante);
        mostrarAcompanantes(datos.acompanantes);

        mostrarAcreditacion(
    datos.participante,
    datos.pago,
    datos.esAdministrador === true
);

        const habitacionesContenedor = obtenerElemento(
            "perfil-habitaciones"
        );

        if (
    datos.pago.estado === "APROBADO" ||
    datos.esAdministrador === true
) {
            try {
                const habitaciones = await consultarAPI(
                    "/api/habitaciones"
                );

                mostrarHabitaciones(
                    datos.participante,
                    datos.acompanantes,
                    habitaciones
                );
            } catch (error) {
                console.error(error);

                habitacionesContenedor.textContent =
                    "No se pudieron consultar las habitaciones.";
            }
        } else {
            habitacionesContenedor.textContent =
                "Las habitaciones estarán disponibles " +
                "cuando tu acreditación sea aprobada.";
        }

        contenido.hidden = false;

    } catch (error) {
        console.error("Error al cargar perfil:", error);

        errorMensaje.textContent = error.message;
        errorSeccion.hidden = false;

    } finally {
        cargando.hidden = true;
    }
}
