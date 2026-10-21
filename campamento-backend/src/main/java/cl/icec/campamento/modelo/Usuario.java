package cl.icec.campamento.modelo;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

/* Representa una cuenta de usuario dentro del sistema */
@Entity 
@Table(name= "usuarios") 
public class Usuario {

    //Identificador generado automaticamente por MySQL
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;

    //El correo debe ser unico para cada cuenta
    @Column (nullable= false, unique = true, length = 150)
    private String correo;

    //Aqui se guardara la contraseña protegida, nunca con texto original. 
    @Column(name = "contrasena_hash", nullable = false, length = 255)
    private String contrasenaHash;

    //indica si la cuenta pertenece a un participante o adminsitrador
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length= 20)
    private RolUsuario rol = RolUsuario.PARTICIPANTE;

    //Permite habilitar o deshabilitar una cuenta
    @Column(nullable = false)
    private boolean activo = true;

    //Fecha en que secreo la cuenta
    @Column(name = "fecha_creacion", nullable = false, updatable = false)
    private LocalDateTime fechaCreacion;

    /*Constructor vacio requerido por JPA */

    public Usuario() {
    }

    /*Asigna automaticamente la fecha antes de guardar la cuenta */
    @PrePersist
    public void prepararCreacion() {
        if (fechaCreacion == null) {
            fechaCreacion = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public String getCorreo() {
        return correo;
    }

     public void setCorreo(String correo) {
        this.correo = correo;
    }

     public String getContrasenaHash() {
        return contrasenaHash;
    }

     public void setContrasenaHash(String contrasenaHash) {
        this.contrasenaHash = contrasenaHash;
    }

    public RolUsuario getRol() {
        return rol;
    }

    public void setRol(RolUsuario rol) {
        this.rol = rol;
    }

     public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }
}   


