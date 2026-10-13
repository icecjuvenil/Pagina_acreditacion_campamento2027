package cl.icec.campamento.controlador;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/*Controlador utilizador par comprobar que el backend 
esta iniciado */

@RestController
@RequestMapping ("/api")

public class EstadoControlador {

    /*Devuelve el estado actual del servidor */
    @GetMapping("/estado")
    public Map<String, String> obtenerEstado() {
        return Map.of(
            "estado", "ok",
            "mensaje", "El backend del campamento está funcionando"
        );
    } 
}
