
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
