
/*
 * ICEC JUVENIL 2027
 * Servicio de correo electrónico
 * Cloudflare Workers + Resend
 */

export async function enviarCorreo(
    env,
    { destinatario, asunto, mensaje }
) {

    if (!env.RESEND_API_KEY) {
        throw new Error(
            "La clave de Resend no está configurada."
        );
    }

    if (
        !destinatario ||
        !asunto ||
        !mensaje
    ) {
        throw new Error(
            "Faltan datos para enviar el correo."
        );
    }

    // Mientras no tengamos dominio verificado,
    // usamos el remitente de pruebas de Resend.
    const remitente =
        "ICEC Juvenil <onboarding@resend.dev>";

    const respuesta = await fetch(
        "https://api.resend.com/emails",
        {
            method: "POST",
            headers: {
                "Authorization":
                    `Bearer ${env.RESEND_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                from: remitente,
                to: [destinatario],
                subject: asunto,
                text: mensaje
            })
        }
    );

    if (!respuesta.ok) {
        const error = await respuesta.json()
            .catch(() => null);

        console.error(
            "Error de Resend:",
            respuesta.status,
            error?.name || "Error de envío"
        );

        throw new Error(
            "No fue posible enviar el correo electrónico."
        );
    }

    const resultado = await respuesta.json();

    return {
        enviado: true,
        id: resultado.id
    };
}
