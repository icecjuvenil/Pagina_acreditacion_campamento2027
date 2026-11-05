
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
        }

    } catch (error) {
        console.error(
            "No se pudo verificar el acceso:",
            error
        );
    }
});
