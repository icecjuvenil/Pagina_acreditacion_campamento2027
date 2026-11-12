
-- CAMPAMENTO ICEC 2027
-- Control de intentos de recuperación de contraseña

ALTER TABLE recuperaciones_contrasena
ADD COLUMN intentos_fallidos INTEGER NOT NULL DEFAULT 0;
