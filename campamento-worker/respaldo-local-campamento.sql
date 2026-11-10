PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE usuarios (     id INTEGER PRIMARY KEY AUTOINCREMENT,     correo TEXT NOT NULL UNIQUE,     contrasena_hash TEXT NOT NULL,     rol TEXT NOT NULL DEFAULT 'PARTICIPANTE'         CHECK (rol IN ('PARTICIPANTE', 'ADMINISTRADOR')),     genero TEXT NOT NULL         CHECK (genero IN ('MASCULINO', 'FEMENINO')),     activo INTEGER NOT NULL DEFAULT 1         CHECK (activo IN (0, 1)),     fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP );
INSERT INTO "usuarios" ("id","correo","contrasena_hash","rol","genero","activo","fecha_creacion") VALUES(3,'admin.qa.local@icec.test','pbkdf2_sha256$100000$91ef1b171df60a9eed848c7c469189fe$9a6fddbad6eff6a2783f32d203ec33db34d73a939d7a886290548b6dddfb34ec','ADMINISTRADOR','MASCULINO',1,'2026-11-03 00:58:23');
INSERT INTO "usuarios" ("id","correo","contrasena_hash","rol","genero","activo","fecha_creacion") VALUES(11,'prueba.persona@icec.cl','pbkdf2_sha256$100000$779e8c9ad3cf88f968178983fbefa30a$2f746bb010ad6ed65023b3c5be22702ffdc8d1a48be258277a89276e94469776','PARTICIPANTE','MASCULINO',1,'2026-11-10 02:11:00');
INSERT INTO "usuarios" ("id","correo","contrasena_hash","rol","genero","activo","fecha_creacion") VALUES(12,'test.beneficio@icec.cl','pbkdf2_sha256$100000$31e53d6b9639b4d71c964c6dab6b5ddc$dc03db0461af4753f6184d64f7a2a2705ae6042b373291ef5c8bb9ac235da7eb','PARTICIPANTE','MASCULINO',1,'2026-11-10 02:39:51');
INSERT INTO "usuarios" ("id","correo","contrasena_hash","rol","genero","activo","fecha_creacion") VALUES(13,'test.beneficio2@gmail.com','pbkdf2_sha256$100000$8bf613be2fdb5fa864dcbfdd48b80fe5$8f98e94a11778426da91f0bc207a41afe49907b8446e520a630b1fba5e19df37','PARTICIPANTE','MASCULINO',1,'2026-11-10 02:48:27');
INSERT INTO "usuarios" ("id","correo","contrasena_hash","rol","genero","activo","fecha_creacion") VALUES(14,'test3.beneficio@icec.cl','pbkdf2_sha256$100000$4fe43aa654e6c99e5dd23abfc12ab775$9625bd4779ab75571692ee9781f73a3cd6981ae0a2e4d1a095b3457bad98b999','PARTICIPANTE','MASCULINO',1,'2026-11-10 02:57:00');
INSERT INTO "usuarios" ("id","correo","contrasena_hash","rol","genero","activo","fecha_creacion") VALUES(15,'test.4@icec.cl','pbkdf2_sha256$100000$ec02fa3339ece4c7a0c23e441608a9f9$dac7d2a598cd631b73b4c9ae2a6468449a80db756bfc417e38897fec4899e554','PARTICIPANTE','FEMENINO',1,'2026-11-10 03:20:07');
CREATE TABLE participantes (     id INTEGER PRIMARY KEY AUTOINCREMENT,     usuario_id INTEGER NOT NULL UNIQUE,     nombre_completo TEXT NOT NULL,     rut TEXT NOT NULL UNIQUE,     fecha_nacimiento TEXT NOT NULL,     genero TEXT NOT NULL         CHECK (genero IN ('MASCULINO', 'FEMENINO')),     telefono TEXT NOT NULL,     valor_acreditacion INTEGER NOT NULL DEFAULT 0,     fecha_inscripcion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, alias TEXT, cancelada INTEGER NOT NULL DEFAULT 0 CHECK (cancelada IN (0, 1)), fecha_cancelacion TEXT, estado_devolucion TEXT NOT NULL DEFAULT 'NO_CORRESPONDE' CHECK (estado_devolucion IN ('NO_CORRESPONDE', 'PENDIENTE', 'DEVUELTO')), motivo_cancelacion TEXT, beneficio_lider INTEGER NOT NULL DEFAULT 0 CHECK (beneficio_lider IN (0, 1)),     FOREIGN KEY (usuario_id) REFERENCES usuarios(id) );
INSERT INTO "participantes" ("id","usuario_id","nombre_completo","rut","fecha_nacimiento","genero","telefono","valor_acreditacion","fecha_inscripcion","alias","cancelada","fecha_cancelacion","estado_devolucion","motivo_cancelacion","beneficio_lider") VALUES(10,11,'Persona principal','111111111','2001-01-01','MASCULINO','+56998765432',20000,'2026-11-10 02:11:00','PP',0,NULL,'NO_CORRESPONDE',NULL,0);
INSERT INTO "participantes" ("id","usuario_id","nombre_completo","rut","fecha_nacimiento","genero","telefono","valor_acreditacion","fecha_inscripcion","alias","cancelada","fecha_cancelacion","estado_devolucion","motivo_cancelacion","beneficio_lider") VALUES(11,12,'Test Beneficio','333333333','1996-02-01','MASCULINO','+56998765432',0,'2026-11-10 02:39:51','TB',0,NULL,'NO_CORRESPONDE',NULL,1);
INSERT INTO "participantes" ("id","usuario_id","nombre_completo","rut","fecha_nacimiento","genero","telefono","valor_acreditacion","fecha_inscripcion","alias","cancelada","fecha_cancelacion","estado_devolucion","motivo_cancelacion","beneficio_lider") VALUES(12,13,'Test Beneficio Segundo','555555555','1993-05-01','MASCULINO','+56998765432',0,'2026-11-10 02:48:27','TB2',0,NULL,'NO_CORRESPONDE',NULL,1);
INSERT INTO "participantes" ("id","usuario_id","nombre_completo","rut","fecha_nacimiento","genero","telefono","valor_acreditacion","fecha_inscripcion","alias","cancelada","fecha_cancelacion","estado_devolucion","motivo_cancelacion","beneficio_lider") VALUES(13,14,'test 3','666666666','2001-01-01','MASCULINO','+56998765432',0,'2026-11-10 02:57:00',NULL,0,NULL,'NO_CORRESPONDE',NULL,1);
INSERT INTO "participantes" ("id","usuario_id","nombre_completo","rut","fecha_nacimiento","genero","telefono","valor_acreditacion","fecha_inscripcion","alias","cancelada","fecha_cancelacion","estado_devolucion","motivo_cancelacion","beneficio_lider") VALUES(14,15,'Test four','192687403','1999-08-03','FEMENINO','+56998765432',20000,'2026-11-10 03:20:07','T4',0,NULL,'NO_CORRESPONDE',NULL,0);
CREATE TABLE acompanantes (     id INTEGER PRIMARY KEY AUTOINCREMENT,     participante_id INTEGER NOT NULL,     nombre_completo TEXT NOT NULL,     rut TEXT NOT NULL UNIQUE,     fecha_nacimiento TEXT NOT NULL,     genero TEXT NOT NULL         CHECK (genero IN ('MASCULINO', 'FEMENINO')),     telefono TEXT,     correo TEXT,     valor_acreditacion INTEGER NOT NULL DEFAULT 0,     fecha_inscripcion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,     FOREIGN KEY (participante_id)         REFERENCES participantes(id) );
INSERT INTO "acompanantes" ("id","participante_id","nombre_completo","rut","fecha_nacimiento","genero","telefono","correo","valor_acreditacion","fecha_inscripcion") VALUES(8,10,'testeo acompañante','222222222','2013-01-02','FEMENINO','+56998765432',NULL,20000,'2026-11-10 02:31:59');
INSERT INTO "acompanantes" ("id","participante_id","nombre_completo","rut","fecha_nacimiento","genero","telefono","correo","valor_acreditacion","fecha_inscripcion") VALUES(9,11,'acompañante sin beneficio','444444444','2003-02-01','MASCULINO','+56998765432',NULL,20000,'2026-11-10 02:40:31');
CREATE TABLE informacion_medica (     id INTEGER PRIMARY KEY AUTOINCREMENT,      participante_id INTEGER,     acompanante_id INTEGER,      tiene_alergias INTEGER NOT NULL DEFAULT 0         CHECK (tiene_alergias IN (0, 1)),     detalle_alergias TEXT,      tiene_enfermedad INTEGER NOT NULL DEFAULT 0         CHECK (tiene_enfermedad IN (0, 1)),     detalle_enfermedad TEXT,      toma_medicamentos INTEGER NOT NULL DEFAULT 0         CHECK (toma_medicamentos IN (0, 1)),     detalle_medicamentos TEXT,      restriccion_alimentaria INTEGER NOT NULL DEFAULT 0         CHECK (restriccion_alimentaria IN (0, 1)),     detalle_alimentacion TEXT,      FOREIGN KEY (participante_id)         REFERENCES participantes(id),      FOREIGN KEY (acompanante_id)         REFERENCES acompanantes(id),      CHECK (         (participante_id IS NOT NULL          AND acompanante_id IS NULL)         OR         (participante_id IS NULL          AND acompanante_id IS NOT NULL)     ) );
INSERT INTO "informacion_medica" ("id","participante_id","acompanante_id","tiene_alergias","detalle_alergias","tiene_enfermedad","detalle_enfermedad","toma_medicamentos","detalle_medicamentos","restriccion_alimentaria","detalle_alimentacion") VALUES(12,10,NULL,0,NULL,0,NULL,0,NULL,0,NULL);
INSERT INTO "informacion_medica" ("id","participante_id","acompanante_id","tiene_alergias","detalle_alergias","tiene_enfermedad","detalle_enfermedad","toma_medicamentos","detalle_medicamentos","restriccion_alimentaria","detalle_alimentacion") VALUES(17,NULL,8,0,NULL,0,NULL,0,NULL,0,NULL);
INSERT INTO "informacion_medica" ("id","participante_id","acompanante_id","tiene_alergias","detalle_alergias","tiene_enfermedad","detalle_enfermedad","toma_medicamentos","detalle_medicamentos","restriccion_alimentaria","detalle_alimentacion") VALUES(18,11,NULL,0,NULL,0,NULL,0,NULL,0,NULL);
INSERT INTO "informacion_medica" ("id","participante_id","acompanante_id","tiene_alergias","detalle_alergias","tiene_enfermedad","detalle_enfermedad","toma_medicamentos","detalle_medicamentos","restriccion_alimentaria","detalle_alimentacion") VALUES(19,NULL,9,0,NULL,0,NULL,0,NULL,0,NULL);
INSERT INTO "informacion_medica" ("id","participante_id","acompanante_id","tiene_alergias","detalle_alergias","tiene_enfermedad","detalle_enfermedad","toma_medicamentos","detalle_medicamentos","restriccion_alimentaria","detalle_alimentacion") VALUES(20,12,NULL,0,NULL,0,NULL,0,NULL,0,NULL);
INSERT INTO "informacion_medica" ("id","participante_id","acompanante_id","tiene_alergias","detalle_alergias","tiene_enfermedad","detalle_enfermedad","toma_medicamentos","detalle_medicamentos","restriccion_alimentaria","detalle_alimentacion") VALUES(21,13,NULL,0,NULL,0,NULL,0,NULL,0,NULL);
INSERT INTO "informacion_medica" ("id","participante_id","acompanante_id","tiene_alergias","detalle_alergias","tiene_enfermedad","detalle_enfermedad","toma_medicamentos","detalle_medicamentos","restriccion_alimentaria","detalle_alimentacion") VALUES(22,14,NULL,0,NULL,1,'asma',1,'paracetamol cada 8 hrs',0,NULL);
CREATE TABLE contactos_emergencia (     id INTEGER PRIMARY KEY AUTOINCREMENT,      participante_id INTEGER,     acompanante_id INTEGER,      nombre_completo TEXT NOT NULL,     parentesco TEXT NOT NULL,     telefono_principal TEXT NOT NULL,     telefono_alternativo TEXT,      FOREIGN KEY (participante_id)         REFERENCES participantes(id),      FOREIGN KEY (acompanante_id)         REFERENCES acompanantes(id),      CHECK (         (participante_id IS NOT NULL          AND acompanante_id IS NULL)         OR         (participante_id IS NULL          AND acompanante_id IS NOT NULL)     ) );
INSERT INTO "contactos_emergencia" ("id","participante_id","acompanante_id","nombre_completo","parentesco","telefono_principal","telefono_alternativo") VALUES(12,10,NULL,'asldkjfha','madre-padre','+569123456789',NULL);
INSERT INTO "contactos_emergencia" ("id","participante_id","acompanante_id","nombre_completo","parentesco","telefono_principal","telefono_alternativo") VALUES(17,NULL,8,'contacto prueba','madre-padre','+569123456789',NULL);
INSERT INTO "contactos_emergencia" ("id","participante_id","acompanante_id","nombre_completo","parentesco","telefono_principal","telefono_alternativo") VALUES(18,11,NULL,'contacto prueba','madre-padre','+569123456789',NULL);
INSERT INTO "contactos_emergencia" ("id","participante_id","acompanante_id","nombre_completo","parentesco","telefono_principal","telefono_alternativo") VALUES(19,NULL,9,'contacto prueba','hermano-hermana','+569123456789',NULL);
INSERT INTO "contactos_emergencia" ("id","participante_id","acompanante_id","nombre_completo","parentesco","telefono_principal","telefono_alternativo") VALUES(20,12,NULL,'contacto prueba','madre-padre','+569123456789',NULL);
INSERT INTO "contactos_emergencia" ("id","participante_id","acompanante_id","nombre_completo","parentesco","telefono_principal","telefono_alternativo") VALUES(21,13,NULL,'contacto prueba','madre-padre','+569123456789',NULL);
INSERT INTO "contactos_emergencia" ("id","participante_id","acompanante_id","nombre_completo","parentesco","telefono_principal","telefono_alternativo") VALUES(22,14,NULL,'contacto prueba','madre-padre','+569123456789',NULL);
CREATE TABLE pagos (     id INTEGER PRIMARY KEY AUTOINCREMENT,      participante_id INTEGER NOT NULL,      monto_total INTEGER NOT NULL         CHECK (monto_total >= 0),      monto_pagado INTEGER NOT NULL DEFAULT 0         CHECK (monto_pagado >= 0),      titular_transferencia TEXT,     fecha_transferencia TEXT,     comprobante_key TEXT,      estado TEXT NOT NULL DEFAULT 'PENDIENTE'         CHECK (estado IN (             'PENDIENTE',             'EN_REVISION',             'APROBADO',             'RECHAZADO'         )),      revisado_por INTEGER,     fecha_revision TEXT,     observaciones TEXT,      fecha_registro TEXT NOT NULL         DEFAULT CURRENT_TIMESTAMP, metodo_pago TEXT CHECK (metodo_pago IN ('TRANSFERENCIA', 'EFECTIVO')), comprobante_efectivo_key TEXT,      FOREIGN KEY (participante_id)         REFERENCES participantes(id),      FOREIGN KEY (revisado_por)         REFERENCES usuarios(id) );
INSERT INTO "pagos" ("id","participante_id","monto_total","monto_pagado","titular_transferencia","fecha_transferencia","comprobante_key","estado","revisado_por","fecha_revision","observaciones","fecha_registro","metodo_pago","comprobante_efectivo_key") VALUES(10,10,40000,40000,'Titular pago','2026-11-09','comprobantes/participante-10/c92f9b50-427c-425b-b525-60b205eec116.png','APROBADO',3,'2026-11-10 02:38:21',NULL,'2026-11-10 02:11:00','TRANSFERENCIA',NULL);
INSERT INTO "pagos" ("id","participante_id","monto_total","monto_pagado","titular_transferencia","fecha_transferencia","comprobante_key","estado","revisado_por","fecha_revision","observaciones","fecha_registro","metodo_pago","comprobante_efectivo_key") VALUES(11,11,20000,20000,NULL,NULL,NULL,'APROBADO',3,'2026-11-10 02:43:47',NULL,'2026-11-10 02:39:51','EFECTIVO','comprobantes/participante-11/a21675c3-7817-47b5-968b-9256e08e7c47.png');
INSERT INTO "pagos" ("id","participante_id","monto_total","monto_pagado","titular_transferencia","fecha_transferencia","comprobante_key","estado","revisado_por","fecha_revision","observaciones","fecha_registro","metodo_pago","comprobante_efectivo_key") VALUES(12,12,0,0,NULL,NULL,NULL,'APROBADO',NULL,'2026-11-10 02:48:40',NULL,'2026-11-10 02:48:27',NULL,NULL);
INSERT INTO "pagos" ("id","participante_id","monto_total","monto_pagado","titular_transferencia","fecha_transferencia","comprobante_key","estado","revisado_por","fecha_revision","observaciones","fecha_registro","metodo_pago","comprobante_efectivo_key") VALUES(13,13,0,0,NULL,NULL,NULL,'APROBADO',NULL,'2026-11-10 02:57:50',NULL,'2026-11-10 02:57:00',NULL,NULL);
INSERT INTO "pagos" ("id","participante_id","monto_total","monto_pagado","titular_transferencia","fecha_transferencia","comprobante_key","estado","revisado_por","fecha_revision","observaciones","fecha_registro","metodo_pago","comprobante_efectivo_key") VALUES(14,14,20000,20000,'transferencia 4','2026-11-10','comprobantes/participante-14/30180331-288d-4951-b956-d65cf2e173fc.png','APROBADO',3,'2026-11-10 03:21:48',NULL,'2026-11-10 03:20:07','TRANSFERENCIA',NULL);
CREATE TABLE habitaciones (     id INTEGER PRIMARY KEY AUTOINCREMENT,      nombre TEXT NOT NULL UNIQUE,      genero TEXT NOT NULL         CHECK (genero IN ('MASCULINO', 'FEMENINO')),      capacidad INTEGER NOT NULL         CHECK (capacidad > 0),      activa INTEGER NOT NULL DEFAULT 1         CHECK (activa IN (0, 1)),      observaciones TEXT,      fecha_creacion TEXT NOT NULL         DEFAULT CURRENT_TIMESTAMP );
INSERT INTO "habitaciones" ("id","nombre","genero","capacidad","activa","observaciones","fecha_creacion") VALUES(1,'M5 - Gracia','FEMENINO',3,1,NULL,'2026-11-05 17:00:57');
INSERT INTO "habitaciones" ("id","nombre","genero","capacidad","activa","observaciones","fecha_creacion") VALUES(2,'M4 - Sangre de Cristo','FEMENINO',3,1,NULL,'2026-11-05 17:00:57');
INSERT INTO "habitaciones" ("id","nombre","genero","capacidad","activa","observaciones","fecha_creacion") VALUES(3,'M3 - Sacrificio','FEMENINO',4,1,NULL,'2026-11-05 17:00:57');
INSERT INTO "habitaciones" ("id","nombre","genero","capacidad","activa","observaciones","fecha_creacion") VALUES(4,'M2 - Expiación','FEMENINO',4,1,NULL,'2026-11-05 17:00:57');
INSERT INTO "habitaciones" ("id","nombre","genero","capacidad","activa","observaciones","fecha_creacion") VALUES(5,'M1 - Redención','FEMENINO',4,1,NULL,'2026-11-05 17:00:57');
INSERT INTO "habitaciones" ("id","nombre","genero","capacidad","activa","observaciones","fecha_creacion") VALUES(6,'M6 - Perdón','FEMENINO',4,1,NULL,'2026-11-05 17:00:57');
INSERT INTO "habitaciones" ("id","nombre","genero","capacidad","activa","observaciones","fecha_creacion") VALUES(7,'M7 - Reconciliación','FEMENINO',4,1,NULL,'2026-11-05 17:00:57');
INSERT INTO "habitaciones" ("id","nombre","genero","capacidad","activa","observaciones","fecha_creacion") VALUES(8,'M8 - Justificación','FEMENINO',4,1,NULL,'2026-11-05 17:00:57');
INSERT INTO "habitaciones" ("id","nombre","genero","capacidad","activa","observaciones","fecha_creacion") VALUES(9,'M9 - Amor de Dios','FEMENINO',4,1,NULL,'2026-11-05 17:00:57');
INSERT INTO "habitaciones" ("id","nombre","genero","capacidad","activa","observaciones","fecha_creacion") VALUES(10,'M10 - Sustitución','FEMENINO',2,1,NULL,'2026-11-05 17:00:57');
INSERT INTO "habitaciones" ("id","nombre","genero","capacidad","activa","observaciones","fecha_creacion") VALUES(11,'H1 - Muerte y resurrección','MASCULINO',2,1,NULL,'2026-11-05 17:00:57');
INSERT INTO "habitaciones" ("id","nombre","genero","capacidad","activa","observaciones","fecha_creacion") VALUES(12,'H2 - Victoria','MASCULINO',4,1,NULL,'2026-11-05 17:00:57');
INSERT INTO "habitaciones" ("id","nombre","genero","capacidad","activa","observaciones","fecha_creacion") VALUES(13,'H3 - Salvación','MASCULINO',3,1,NULL,'2026-11-05 17:00:57');
INSERT INTO "habitaciones" ("id","nombre","genero","capacidad","activa","observaciones","fecha_creacion") VALUES(14,'H4 - Fe','MASCULINO',3,1,NULL,'2026-11-05 17:00:57');
INSERT INTO "habitaciones" ("id","nombre","genero","capacidad","activa","observaciones","fecha_creacion") VALUES(15,'H5 - Humildad y obediencia','MASCULINO',3,1,NULL,'2026-11-05 17:00:57');
INSERT INTO "habitaciones" ("id","nombre","genero","capacidad","activa","observaciones","fecha_creacion") VALUES(16,'H7 - Nuevo pacto','MASCULINO',6,1,NULL,'2026-11-05 17:00:57');
INSERT INTO "habitaciones" ("id","nombre","genero","capacidad","activa","observaciones","fecha_creacion") VALUES(17,'H6 - Cruz diaria','MASCULINO',3,1,NULL,'2026-11-05 17:00:57');
CREATE TABLE asignaciones_habitaciones (     id INTEGER PRIMARY KEY AUTOINCREMENT,      habitacion_id INTEGER NOT NULL,      participante_id INTEGER,     acompanante_id INTEGER,      asignado_por INTEGER,      fecha_asignacion TEXT NOT NULL         DEFAULT CURRENT_TIMESTAMP,      FOREIGN KEY (habitacion_id)         REFERENCES habitaciones(id),      FOREIGN KEY (participante_id)         REFERENCES participantes(id),      FOREIGN KEY (acompanante_id)         REFERENCES acompanantes(id),      FOREIGN KEY (asignado_por)         REFERENCES usuarios(id),      CHECK (         (participante_id IS NOT NULL          AND acompanante_id IS NULL)         OR         (participante_id IS NULL          AND acompanante_id IS NOT NULL)     ) );
INSERT INTO "asignaciones_habitaciones" ("id","habitacion_id","participante_id","acompanante_id","asignado_por","fecha_asignacion") VALUES(8,11,10,NULL,11,'2026-11-10 02:38:37');
INSERT INTO "asignaciones_habitaciones" ("id","habitacion_id","participante_id","acompanante_id","asignado_por","fecha_asignacion") VALUES(9,5,NULL,8,11,'2026-11-10 02:38:47');
INSERT INTO "asignaciones_habitaciones" ("id","habitacion_id","participante_id","acompanante_id","asignado_por","fecha_asignacion") VALUES(10,12,NULL,9,12,'2026-11-10 02:45:18');
INSERT INTO "asignaciones_habitaciones" ("id","habitacion_id","participante_id","acompanante_id","asignado_por","fecha_asignacion") VALUES(11,10,14,NULL,15,'2026-11-10 03:24:25');
CREATE TABLE login_intentos (clave TEXT PRIMARY KEY NOT NULL, intentos INTEGER NOT NULL DEFAULT 0, vence INTEGER NOT NULL);
INSERT INTO "login_intentos" ("clave","intentos","vence") VALUES('c77d33e9fc6d16c48be72159b25d7c09f258d4899dd8e21c49c722a3398702ea',1,1794324785);
CREATE TABLE recuperaciones_contrasena (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER NOT NULL, token_hash TEXT NOT NULL UNIQUE, expira_en INTEGER NOT NULL, utilizado_en INTEGER, creado_en INTEGER NOT NULL DEFAULT (unixepoch()), FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE);
CREATE TABLE intentos_clave_lider (usuario_id INTEGER PRIMARY KEY, intentos INTEGER NOT NULL DEFAULT 0, inicio_ventana INTEGER NOT NULL, bloqueado_hasta INTEGER NOT NULL DEFAULT 0, FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('usuarios',15);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('participantes',14);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('pagos',14);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('acompanantes',9);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('informacion_medica',22);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('contactos_emergencia',22);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('habitaciones',17);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('asignaciones_habitaciones',11);
CREATE UNIQUE INDEX idx_medica_participante ON informacion_medica(participante_id);
CREATE UNIQUE INDEX idx_medica_acompanante ON informacion_medica(acompanante_id);
CREATE UNIQUE INDEX idx_contacto_participante ON contactos_emergencia(participante_id);
CREATE UNIQUE INDEX idx_contacto_acompanante ON contactos_emergencia(acompanante_id);
CREATE UNIQUE INDEX idx_asignacion_participante ON asignaciones_habitaciones(participante_id);
CREATE UNIQUE INDEX idx_asignacion_acompanante ON asignaciones_habitaciones(acompanante_id);
CREATE INDEX idx_login_intentos_vence ON login_intentos (vence);
CREATE TRIGGER aplicar_beneficio_lider
BEFORE UPDATE OF beneficio_lider ON participantes

WHEN NEW.beneficio_lider = 1
 AND OLD.beneficio_lider = 0

BEGIN

  -- Impedir aplicar la gratuidad cuando
  -- la inscripción no cumple las condiciones.

  SELECT RAISE(ABORT, 'BENEFICIO_NO_PERMITIDO')
  WHERE OLD.cancelada <> 0
     OR NEW.valor_acreditacion <> 0

     OR EXISTS (
       SELECT 1
       FROM asignaciones_habitaciones
       WHERE participante_id = OLD.id
     )

     OR NOT EXISTS (
       SELECT 1
       FROM pagos
       WHERE participante_id = OLD.id
         AND estado = 'PENDIENTE'
         AND monto_pagado = 0
         AND comprobante_key IS NULL
         AND comprobante_efectivo_key IS NULL
     );

  -- Recalcular el total únicamente
  -- con los acompañantes registrados.

  UPDATE pagos

  SET monto_total = (
        SELECT COALESCE(
          SUM(valor_acreditacion), 0
        )
        FROM acompanantes
        WHERE participante_id = OLD.id
      ),

      estado = CASE
        WHEN NOT EXISTS (
          SELECT 1
          FROM acompanantes
          WHERE participante_id = OLD.id
        )
        THEN 'APROBADO'
        ELSE 'PENDIENTE'
      END,

      fecha_revision = CASE
        WHEN NOT EXISTS (
          SELECT 1
          FROM acompanantes
          WHERE participante_id = OLD.id
        )
        THEN CURRENT_TIMESTAMP
        ELSE NULL
      END

  WHERE participante_id = OLD.id
    AND estado = 'PENDIENTE'
    AND monto_pagado = 0
    AND comprobante_key IS NULL
    AND comprobante_efectivo_key IS NULL;

END;