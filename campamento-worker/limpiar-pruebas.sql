
-- CAMPAMENTO ICEC 2027
-- Limpieza de datos de prueba
-- Ejecutar solamente en D1 LOCAL

-- 1. Eliminar asignaciones de habitaciones.
DELETE FROM asignaciones_habitaciones
WHERE participante_id IN (
    SELECT id FROM participantes
)
OR acompanante_id IN (
    SELECT id FROM acompanantes
);

-- 2. Eliminar información médica.
DELETE FROM informacion_medica;

-- 3. Eliminar contactos de emergencia.
DELETE FROM contactos_emergencia;

-- 4. Eliminar pagos de participantes.
DELETE FROM pagos
WHERE participante_id IN (
    SELECT id FROM participantes
);

-- 5. Eliminar acompañantes.
DELETE FROM acompanantes;

-- 6. Limpiar recuperaciones de contraseña
-- de las cuentas de participantes.
DELETE FROM recuperaciones_contrasena
WHERE usuario_id IN (
    SELECT id FROM usuarios
    WHERE rol = 'PARTICIPANTE'
);

-- 7. Limpiar intentos de claves de líderes.
DELETE FROM intentos_clave_lider;

-- 8. Limpiar intentos de inicio de sesión.
DELETE FROM login_intentos;

-- 9. Eliminar participantes.
DELETE FROM participantes;

-- 10. Eliminar cuentas de participantes.
DELETE FROM usuarios
WHERE rol = 'PARTICIPANTE';
