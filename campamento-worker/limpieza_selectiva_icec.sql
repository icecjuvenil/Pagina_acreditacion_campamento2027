-- ICEC 2027 - Limpieza de registros, conservando INTACTAS las dos cuentas
-- y todas sus inscripciones, pagos, acompanantes, salud y habitaciones asignadas.
-- No elimina ni altera tablas, disparadores ni indices.
-- Nota: si un pago o habitacion protegida referencia a un tercer usuario
-- mediante revisado_por o asignado_por, las FK impediran borrar ese usuario.

-- 1. Quitar asignaciones de participantes ajenos a las cuentas conservadas.
DELETE FROM asignaciones_habitaciones
WHERE participante_id IN (
    SELECT p.id FROM participantes p JOIN usuarios u ON u.id = p.usuario_id
    WHERE LOWER(TRIM(u.correo)) NOT IN ('brantemarco777@gmail.com', 'c.miranda1988@hotmail.com')
)
OR acompanante_id IN (
    SELECT a.id FROM acompanantes a
    JOIN participantes p ON p.id = a.participante_id
    JOIN usuarios u ON u.id = p.usuario_id
    WHERE LOWER(TRIM(u.correo)) NOT IN ('brantemarco777@gmail.com', 'c.miranda1988@hotmail.com')
);

-- 2. Borrar solo informacion medica de otras inscripciones.
DELETE FROM informacion_medica
WHERE participante_id IN (
    SELECT p.id FROM participantes p JOIN usuarios u ON u.id = p.usuario_id
    WHERE LOWER(TRIM(u.correo)) NOT IN ('brantemarco777@gmail.com', 'c.miranda1988@hotmail.com')
)
OR acompanante_id IN (
    SELECT a.id FROM acompanantes a
    JOIN participantes p ON p.id = a.participante_id
    JOIN usuarios u ON u.id = p.usuario_id
    WHERE LOWER(TRIM(u.correo)) NOT IN ('brantemarco777@gmail.com', 'c.miranda1988@hotmail.com')
);

-- 3. Borrar solo contactos de emergencia de otras inscripciones.
DELETE FROM contactos_emergencia
WHERE participante_id IN (
    SELECT p.id FROM participantes p JOIN usuarios u ON u.id = p.usuario_id
    WHERE LOWER(TRIM(u.correo)) NOT IN ('brantemarco777@gmail.com', 'c.miranda1988@hotmail.com')
)
OR acompanante_id IN (
    SELECT a.id FROM acompanantes a
    JOIN participantes p ON p.id = a.participante_id
    JOIN usuarios u ON u.id = p.usuario_id
    WHERE LOWER(TRIM(u.correo)) NOT IN ('brantemarco777@gmail.com', 'c.miranda1988@hotmail.com')
);

-- 4. Pagos de otras inscripciones (sin tocar los dos protegidos).
DELETE FROM pagos WHERE participante_id IN (
    SELECT p.id FROM participantes p JOIN usuarios u ON u.id = p.usuario_id
    WHERE LOWER(TRIM(u.correo)) NOT IN ('brantemarco777@gmail.com', 'c.miranda1988@hotmail.com')
);

-- 5. Acompanantes y participantes de otras inscripciones.
DELETE FROM acompanantes WHERE participante_id IN (
    SELECT p.id FROM participantes p JOIN usuarios u ON u.id = p.usuario_id
    WHERE LOWER(TRIM(u.correo)) NOT IN ('brantemarco777@gmail.com', 'c.miranda1988@hotmail.com')
);

DELETE FROM participantes WHERE usuario_id IN (
    SELECT id FROM usuarios
    WHERE LOWER(TRIM(correo)) NOT IN ('brantemarco777@gmail.com', 'c.miranda1988@hotmail.com')
);

-- 6. Tokens e intentos de clave de las otras cuentas.
DELETE FROM recuperaciones_contrasena WHERE usuario_id IN (
    SELECT id FROM usuarios
    WHERE LOWER(TRIM(correo)) NOT IN ('brantemarco777@gmail.com', 'c.miranda1988@hotmail.com')
);

DELETE FROM intentos_clave_lider WHERE usuario_id IN (
    SELECT id FROM usuarios
    WHERE LOWER(TRIM(correo)) NOT IN ('brantemarco777@gmail.com', 'c.miranda1988@hotmail.com')
);

-- 7. Borrar otras cuentas. Una FK desde un registro protegido
-- impide la operacion para evitar cambiar cualquier dato protegido.
DELETE FROM usuarios
WHERE LOWER(TRIM(correo)) NOT IN ('brantemarco777@gmail.com', 'c.miranda1988@hotmail.com');

-- 8. Eliminar solo habitaciones sin ninguna asignacion conservada.
DELETE FROM habitaciones WHERE id NOT IN (
    SELECT habitacion_id FROM asignaciones_habitaciones
);

-- 9. Comprobacion de integridad.
PRAGMA foreign_key_check;
