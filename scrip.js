//preguntas que muestran un campo adicional al responder si//
const preguntasCondicionales = [
    {
        selectId: "tiene-alergias",
        campoId: "campo-detalle-alergias",
        inputId: "detalle-alergias"
    },
    {
        selectId: "tiene-enfermedad",
        campoId: "campo-detalle-enfermedad",
        inputId: "detalle-enfermedad"
    },
    {
        selectId: "toma-medicamentos",
        campoId: "campo-detalle-medicamentos",
        inputId: "detalle-medicamentos"
    },
    {
        selectId: "restriccion-alimentaria",
        campoId: "campo-detalle-alimentacion",
        inputId: "detalle-alimentacion"
    }
];

preguntasCondicionales.forEach((pregunta) => {
    const seleccion = document.getElementById(pregunta.selectId);
    const campoDetalle = document.getElementById(pregunta.campoId);
    const entradaDetalle = document.getElementById(pregunta.inputId);

    function actualizarCampo() {
        const respondioSi = seleccion.value === "si";

        campoDetalle.hidden = !respondioSi;
        entradaDetalle.required = respondioSi;

        if (!respondioSi) {
            entradaDetalle.value = "";
        }
    }

    seleccion.addEventListener("change", actualizarCampo);
    actualizarCampo();
});