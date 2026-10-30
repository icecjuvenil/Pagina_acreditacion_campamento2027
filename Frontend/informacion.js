/* ==================================================
   CONTROL DE ACCESO A LA INFORMACIÓN DEL CAMPAMENTO
   ================================================== */
/*
 * Esta validación es temporal mientras se desarrolla el backend.
 * Permite ver la información solamente cuando:
 *
 * 1. Existen los datos de la persona principal.
 * 2. El voucher fue enviado y está pendiente de revisión,
 *    o el pago ya fue aprobado.
 */

document.addEventListener("DOMContentLoaded", function () {
    
    /* Secciones principales de informacion.html */
    const contenidoInformacion =
        document.getElementById("informacion");

    const mensajeAccesoDenegado = 
        document.getElementById("acceso-informacion-denegado");

    /*Convierte de forma segura un valor de sessionStorage*/

    function obtenerDatosGuardados(clave) {

        try{
            const datos = sessionStorage.getItem(clave);

            return datos ? JSON.parse(datos) : null;

        } catch(error){
            console.error(
                `No fue posible leer ${clave}:`,
                error
            );

            return null;
        }
    }
    /* Información guardada durante la acreditación */

    const personaPrincipal = 
        obtenerDatosGuardados("personaPrincipalCampamento");

    const informacionPago=
        obtenerDatosGuardados("pagoCampamento");

    /*
     * Estados que permiten acceder a la información.
     *
     * pendiente_revision:
     * El voucher fue enviado y todavía debe ser revisado.
     *
     * aprobado:
     * El pago ya fue validado.
     */

    const estadosPermitidos = [
        "pendiente_revision",
        "aprobado"
    ];

    /*Comprueba si el voucher ya fue enviado*/
    const voucherEnviado = Boolean(
        informacionPago &&
        estadosPermitidos.includes(informacionPago.estado)
    );

    /*
     * Acceso temporal:
     * La persona puede ver la información después de enviar
     * su voucher.
     */

    const puedeVerInformacion = Boolean(
        personaPrincipal &&
        voucherEnviado
    );

    /*Muestra la seccion correspondiente*/
    if (puedeVerInformacion) {

        contenidoInformacion.hidden = false;
        mensajeAccesoDenegado.hidden = true;
    }else{
        contenidoInformacion.hidden = true;
        mensajeAccesoDenegado.hidden = false;
    }

});