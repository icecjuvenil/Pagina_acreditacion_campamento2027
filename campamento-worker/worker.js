
async function crearHashContrasena(contrasena) {
  const encoder = new TextEncoder();

  const salt = crypto.getRandomValues(
    new Uint8Array(16)
  );

  const clave = await crypto.subtle.importKey(
    "raw",
    encoder.encode(contrasena),
    "PBKDF2",
    false,
    ["deriveBits"]
  );

  const iteraciones = 210000;

  const hash = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: iteraciones,
      hash: "SHA-256"
    },
    clave,
    256
  );

  const convertirHex = (bytes) =>
    Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("");

  return [
    "pbkdf2_sha256",
    iteraciones,
    convertirHex(salt),
    convertirHex(new Uint8Array(hash))
  ].join("$");
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/api/estado") {
      return new Response("Ruta no encontrada", {
        status: 404
      });
    }

    try {
      const resultado = await env.DB.prepare(
        "SELECT COUNT(*) AS total FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'"
      ).first();

      return Response.json({
        estado: "OK",
        baseDatos: "Conectada",
        tablas: resultado.total
      });
    } catch (error) {
      console.error("Error al consultar D1:", error);

      return Response.json({
        estado: "ERROR",
        baseDatos: "No disponible"
      }, { status: 500 });
    }
  }
};
