-- ICEC 2027: eliminar exclusivamente las cinco cuentas de prueba solicitadas.
-- Ejecutar en Cloudflare D1: wrangler d1 execute icec-campamento-2027 --remote --file=eliminar_5_participantes_icec.sql
-- Las cuentas restantes, sus inscripciones, pagos y el catalogo de habitaciones se conservan.
-- No borra los archivos fisicos de comprobantes guardados en Cloudflare R2.

-- 1. Asignaciones de habitaciones de los cinco participantes y sus acompanantes.
DELETE FROM asignaciones_habitaciones
WHERE participante_id IN (
  SELECT p.id FROM participantes p JOIN usuarios u ON u.id = p.usuario_id
  WHERE LOWER(TRIM(u.correo)) IN (
    'ejemplo@icec.cl',
    'ejemploacreditacion27@gmail.com',
    'ejemploacreditacion@gmail.com',
    'brantemarcoantonio@gmail.com',
    'ejemplo2@icec.cl'
  )
)
OR acompanante_id IN (
  SELECT a.id FROM acompanantes a
  JOIN participantes p ON p.id = a.participante_id
  JOIN usuarios u ON u.id = p.usuario_id
  WHERE LOWER(TRIM(u.correo)) IN (
    'ejemplo@icec.cl',
    'ejemploacreditacion27@gmail.com',
    'ejemploacreditacion@gmail.com',
    'brantemarcoantonio@gmail.com',
    'ejemplo2@icec.cl'
  )
);

-- 2. Informacion medica de participantes y acompanantes solicitados.
DELETE FROM informacion_medica
WHERE participante_id IN (
  SELECT p.id FROM participantes p JOIN usuarios u ON u.id = p.usuario_id
  WHERE LOWER(TRIM(u.correo)) IN (
    'ejemplo@icec.cl', 'ejemploacreditacion27@gmail.com',
    'ejemploacreditacion@gmail.com', 'brantemarcoantonio@gmail.com', 'ejemplo2@icec.cl'
  )
)
OR acompanante_id IN (
  SELECT a.id FROM acompanantes a
  JOIN participantes p ON p.id = a.participante_id
  JOIN usuarios u ON u.id = p.usuario_id
  WHERE LOWER(TRIM(u.correo)) IN (
    'ejemplo@icec.cl', 'ejemploacreditacion27@gmail.com',
    'ejemploacreditacion@gmail.com', 'brantemarcoantonio@gmail.com', 'ejemplo2@icec.cl'
  )
);

-- 3. Contactos de emergencia de participantes y acompanantes solicitados.
DELETE FROM contactos_emergencia
WHERE participante_id IN (
  SELECT p.id FROM participantes p JOIN usuarios u ON u.id = p.usuario_id
  WHERE LOWER(TRIM(u.correo)) IN (
    'ejemplo@icec.cl', 'ejemploacreditacion27@gmail.com',
    'ejemploacreditacion@gmail.com', 'brantemarcoantonio@gmail.com', 'ejemplo2@icec.cl'
  )
)
OR acompanante_id IN (
  SELECT a.id FROM acompanantes a
  JOIN participantes p ON p.id = a.participante_id
  JOIN usuarios u ON u.id = p.usuario_id
  WHERE LOWER(TRIM(u.correo)) IN (
    'ejemplo@icec.cl', 'ejemploacreditacion27@gmail.com',
    'ejemploacreditacion@gmail.com', 'brantemarcoantonio@gmail.com', 'ejemplo2@icec.cl'
  )
);

-- 4. Pagos y referencias D1 a los vouchers de esas cuentas.
DELETE FROM pagos
WHERE participante_id IN (
  SELECT p.id FROM participantes p JOIN usuarios u ON u.id = p.usuario_id
  WHERE LOWER(TRIM(u.correo)) IN (
    'ejemplo@icec.cl', 'ejemploacreditacion27@gmail.com',
    'ejemploacreditacion@gmail.com', 'brantemarcoantonio@gmail.com', 'ejemplo2@icec.cl'
  )
);

-- 5. Acompanantes vinculados exclusivamente a esas inscripciones.
DELETE FROM acompanantes
WHERE participante_id IN (
  SELECT p.id FROM participantes p JOIN usuarios u ON u.id = p.usuario_id
  WHERE LOWER(TRIM(u.correo)) IN (
    'ejemplo@icec.cl', 'ejemploacreditacion27@gmail.com',
    'ejemploacreditacion@gmail.com', 'brantemarcoantonio@gmail.com', 'ejemplo2@icec.cl'
  )
);

-- 6. Recuperaciones y bloqueos de clave de lider de esas cuentas.
DELETE FROM recuperaciones_contrasena
WHERE usuario_id IN (
  SELECT id FROM usuarios WHERE LOWER(TRIM(correo)) IN (
    'ejemplo@icec.cl', 'ejemploacreditacion27@gmail.com',
    'ejemploacreditacion@gmail.com', 'brantemarcoantonio@gmail.com', 'ejemplo2@icec.cl'
  )
);

DELETE FROM intentos_clave_lider
WHERE usuario_id IN (
  SELECT id FROM usuarios WHERE LOWER(TRIM(correo)) IN (
    'ejemplo@icec.cl', 'ejemploacreditacion27@gmail.com',
    'ejemploacreditacion@gmail.com', 'brantemarcoantonio@gmail.com', 'ejemplo2@icec.cl'
  )
);

-- 7. Inscripciones de las cinco cuentas.
DELETE FROM participantes
WHERE usuario_id IN (
  SELECT id FROM usuarios WHERE LOWER(TRIM(correo)) IN (
    'ejemplo@icec.cl', 'ejemploacreditacion27@gmail.com',
    'ejemploacreditacion@gmail.com', 'brantemarcoantonio@gmail.com', 'ejemplo2@icec.cl'
  )
);

-- 8. Cuentas solicitadas; las demas quedan intactas.
DELETE FROM usuarios
WHERE LOWER(TRIM(correo)) IN (
  'ejemplo@icec.cl',
  'ejemploacreditacion27@gmail.com',
  'ejemploacreditacion@gmail.com',
  'brantemarcoantonio@gmail.com',
  'ejemplo2@icec.cl'
);
