PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE usuarios (     id INTEGER PRIMARY KEY AUTOINCREMENT,     correo TEXT NOT NULL UNIQUE,     contrasena_hash TEXT NOT NULL,     rol TEXT NOT NULL DEFAULT 'PARTICIPANTE'         CHECK (rol IN ('PARTICIPANTE', 'ADMINISTRADOR')),     genero TEXT NOT NULL         CHECK (genero IN ('MASCULINO', 'FEMENINO')),     activo INTEGER NOT NULL DEFAULT 1         CHECK (activo IN (0, 1)),     fecha_creacion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP );
INSERT INTO "usuarios" ("id","correo","contrasena_hash","rol","genero","activo","fecha_creacion") VALUES(1,'prueba.local@icec.test','pbkdf2_sha256$100000$91ef1b171df60a9eed848c7c469189fe$9a6fddbad6eff6a2783f32d203ec33db34d73a939d7a886290548b6dddfb34ec','PARTICIPANTE','MASCULINO',1,'2026-10-30 23:00:35');
INSERT INTO "usuarios" ("id","correo","contrasena_hash","rol","genero","activo","fecha_creacion") VALUES(2,'registro.qa.local@icec.test','pbkdf2_sha256$100000$4b199d417dd7b582576f6ebc23d242a5$c0ce8578dcaced7bae424b5c463bd69c8650c185c341a8624edaa02c32012aa2','PARTICIPANTE','MASCULINO',1,'2026-11-02 20:15:59');
INSERT INTO "usuarios" ("id","correo","contrasena_hash","rol","genero","activo","fecha_creacion") VALUES(3,'admin.qa.local@icec.test','pbkdf2_sha256$100000$91ef1b171df60a9eed848c7c469189fe$9a6fddbad6eff6a2783f32d203ec33db34d73a939d7a886290548b6dddfb34ec','ADMINISTRADOR','MASCULINO',1,'2026-11-03 00:58:23');
INSERT INTO "usuarios" ("id","correo","contrasena_hash","rol","genero","activo","fecha_creacion") VALUES(5,'qa.hombre.icec@example.com','pbkdf2_sha256$100000$a1aacf9a3568f783933c98de2af96821$8dbdc23b340bbe8c85134452dd818fdc0c08849965698ad09bbccfd88e5090e3','PARTICIPANTE','MASCULINO',1,'2026-11-05 15:32:42');
INSERT INTO "usuarios" ("id","correo","contrasena_hash","rol","genero","activo","fecha_creacion") VALUES(6,'pruebaflujo@ejemplo.com','pbkdf2_sha256$100000$2fcc68340fb19b5486c7b0ffc24dde34$199d765b64cebebfd26a10a0fe57ada3b5ddde6d984fde815d9e82f278da2c78','PARTICIPANTE','MASCULINO',1,'2026-11-05 15:48:59');
INSERT INTO "usuarios" ("id","correo","contrasena_hash","rol","genero","activo","fecha_creacion") VALUES(7,'testeo.pagos@gmail.com','pbkdf2_sha256$100000$5b690a1418cb16800fa5978d53463611$ad1a3dc03f4da1bd1f34f61ee8797203d95c54d5b55f4286b7f9de5a48d9414c','PARTICIPANTE','FEMENINO',1,'2026-11-09 20:24:12');
INSERT INTO "usuarios" ("id","correo","contrasena_hash","rol","genero","activo","fecha_creacion") VALUES(8,'testeo.prueba.general@gmail.com','pbkdf2_sha256$100000$a9b1d2a6c20040f762378ed6dcac0601$4450a6da205642a9cb8a381792a48bfd96ba6290e7631b2ab0422d37a70ee44d','PARTICIPANTE','FEMENINO',1,'2026-11-09 22:07:06');
INSERT INTO "usuarios" ("id","correo","contrasena_hash","rol","genero","activo","fecha_creacion") VALUES(9,'test.beneficio@gmail.com','pbkdf2_sha256$100000$c431494d70e9172fdcf2bfbff9c692e6$6cc27fc5143ec28ee5a78dbebc64a752c8dc88fee9311f7660e4cfdf5567c502','PARTICIPANTE','FEMENINO',1,'2026-11-09 23:23:56');
INSERT INTO "usuarios" ("id","correo","contrasena_hash","rol","genero","activo","fecha_creacion") VALUES(10,'lider@gmail.com','pbkdf2_sha256$100000$4b3bd885ec02a5cbb683366db70ebe00$5f0cf74834d883cec761ec29721b84252248b1b537cba9bdd2d4c0b0b8869bc4','PARTICIPANTE','MASCULINO',1,'2026-11-10 01:52:42');
CREATE TABLE participantes (     id INTEGER PRIMARY KEY AUTOINCREMENT,     usuario_id INTEGER NOT NULL UNIQUE,     nombre_completo TEXT NOT NULL,     rut TEXT NOT NULL UNIQUE,     fecha_nacimiento TEXT NOT NULL,     genero TEXT NOT NULL         CHECK (genero IN ('MASCULINO', 'FEMENINO')),     telefono TEXT NOT NULL,     valor_acreditacion INTEGER NOT NULL DEFAULT 0,     fecha_inscripcion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, alias TEXT, cancelada INTEGER NOT NULL DEFAULT 0 CHECK (cancelada IN (0, 1)), fecha_cancelacion TEXT, estado_devolucion TEXT NOT NULL DEFAULT 'NO_CORRESPONDE' CHECK (estado_devolucion IN ('NO_CORRESPONDE', 'PENDIENTE', 'DEVUELTO')), motivo_cancelacion TEXT, beneficio_lider INTEGER NOT NULL DEFAULT 0 CHECK (beneficio_lider IN (0, 1)),     FOREIGN KEY (usuario_id) REFERENCES usuarios(id) );
INSERT INTO "participantes" ("id","usuario_id","nombre_completo","rut","fecha_nacimiento","genero","telefono","valor_acreditacion","fecha_inscripcion","alias","cancelada","fecha_cancelacion","estado_devolucion","motivo_cancelacion","beneficio_lider") VALUES(1,1,'Participante Local QA','12345678-5','2000-01-01','MASCULINO','+56911111111',20000,'2026-10-30 23:00:40',NULL,0,NULL,'NO_CORRESPONDE',NULL,0);
INSERT INTO "participantes" ("id","usuario_id","nombre_completo","rut","fecha_nacimiento","genero","telefono","valor_acreditacion","fecha_inscripcion","alias","cancelada","fecha_cancelacion","estado_devolucion","motivo_cancelacion","beneficio_lider") VALUES(2,2,'Participante Registro QA','999999999','2000-06-15','MASCULINO','+56911111111',20000,'2026-11-02 20:15:59','PruebaQA',1,'2026-11-06 20:23:49','PENDIENTE','prueba de cancelacion',0);
INSERT INTO "participantes" ("id","usuario_id","nombre_completo","rut","fecha_nacimiento","genero","telefono","valor_acreditacion","fecha_inscripcion","alias","cancelada","fecha_cancelacion","estado_devolucion","motivo_cancelacion","beneficio_lider") VALUES(4,5,'Qa prueba','111111111','2005-05-15','MASCULINO','+56911111111',20000,'2026-11-05 15:32:42','QA',0,NULL,'NO_CORRESPONDE',NULL,0);
INSERT INTO "participantes" ("id","usuario_id","nombre_completo","rut","fecha_nacimiento","genero","telefono","valor_acreditacion","fecha_inscripcion","alias","cancelada","fecha_cancelacion","estado_devolucion","motivo_cancelacion","beneficio_lider") VALUES(5,6,'prueba flujo','222222222','2003-08-02','MASCULINO','+56933333333',20000,'2026-11-05 15:48:59','PF',0,NULL,'NO_CORRESPONDE',NULL,0);
INSERT INTO "participantes" ("id","usuario_id","nombre_completo","rut","fecha_nacimiento","genero","telefono","valor_acreditacion","fecha_inscripcion","alias","cancelada","fecha_cancelacion","estado_devolucion","motivo_cancelacion","beneficio_lider") VALUES(6,7,'Testeo Pago','555555555','1996-08-15','FEMENINO','+56998765432',20000,'2026-11-09 20:24:12','TestP',1,'2026-11-09 21:57:54','PENDIENTE','comprobante no enviado',0);
INSERT INTO "participantes" ("id","usuario_id","nombre_completo","rut","fecha_nacimiento","genero","telefono","valor_acreditacion","fecha_inscripcion","alias","cancelada","fecha_cancelacion","estado_devolucion","motivo_cancelacion","beneficio_lider") VALUES(7,8,'testeo general','777777777','2010-01-12','FEMENINO','+56998765432',20000,'2026-11-09 22:07:06','gral',0,NULL,'NO_CORRESPONDE',NULL,0);
INSERT INTO "participantes" ("id","usuario_id","nombre_completo","rut","fecha_nacimiento","genero","telefono","valor_acreditacion","fecha_inscripcion","alias","cancelada","fecha_cancelacion","estado_devolucion","motivo_cancelacion","beneficio_lider") VALUES(8,9,'Beneficio','666666666','2010-04-11','FEMENINO','+56998765432',0,'2026-11-09 23:23:56',NULL,0,NULL,'NO_CORRESPONDE',NULL,1);
INSERT INTO "participantes" ("id","usuario_id","nombre_completo","rut","fecha_nacimiento","genero","telefono","valor_acreditacion","fecha_inscripcion","alias","cancelada","fecha_cancelacion","estado_devolucion","motivo_cancelacion","beneficio_lider") VALUES(9,10,'lider','444444444','1994-05-11','MASCULINO','+56998765432',0,'2026-11-10 01:52:42','lider',0,NULL,'NO_CORRESPONDE',NULL,1);
CREATE TABLE acompanantes (     id INTEGER PRIMARY KEY AUTOINCREMENT,     participante_id INTEGER NOT NULL,     nombre_completo TEXT NOT NULL,     rut TEXT NOT NULL UNIQUE,     fecha_nacimiento TEXT NOT NULL,     genero TEXT NOT NULL         CHECK (genero IN ('MASCULINO', 'FEMENINO')),     telefono TEXT,     correo TEXT,     valor_acreditacion INTEGER NOT NULL DEFAULT 0,     fecha_inscripcion TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,     FOREIGN KEY (participante_id)         REFERENCES participantes(id) );
INSERT INTO "acompanantes" ("id","participante_id","nombre_completo","rut","fecha_nacimiento","genero","telefono","correo","valor_acreditacion","fecha_inscripcion") VALUES(2,2,'Acompañante QA Usuario 2','888888888','2018-06-15','MASCULINO','+56912345678',NULL,10000,'2026-11-02 20:27:08');
INSERT INTO "acompanantes" ("id","participante_id","nombre_completo","rut","fecha_nacimiento","genero","telefono","correo","valor_acreditacion","fecha_inscripcion") VALUES(3,5,'Acompañante Flujo','333333333','2010-07-03','MASCULINO','+56933366699',NULL,20000,'2026-11-05 15:49:51');
CREATE TABLE informacion_medica (     id INTEGER PRIMARY KEY AUTOINCREMENT,      participante_id INTEGER,     acompanante_id INTEGER,      tiene_alergias INTEGER NOT NULL DEFAULT 0         CHECK (tiene_alergias IN (0, 1)),     detalle_alergias TEXT,      tiene_enfermedad INTEGER NOT NULL DEFAULT 0         CHECK (tiene_enfermedad IN (0, 1)),     detalle_enfermedad TEXT,      toma_medicamentos INTEGER NOT NULL DEFAULT 0         CHECK (toma_medicamentos IN (0, 1)),     detalle_medicamentos TEXT,      restriccion_alimentaria INTEGER NOT NULL DEFAULT 0         CHECK (restriccion_alimentaria IN (0, 1)),     detalle_alimentacion TEXT,      FOREIGN KEY (participante_id)         REFERENCES participantes(id),      FOREIGN KEY (acompanante_id)         REFERENCES acompanantes(id),      CHECK (         (participante_id IS NOT NULL          AND acompanante_id IS NULL)         OR         (participante_id IS NULL          AND acompanante_id IS NOT NULL)     ) );
INSERT INTO "informacion_medica" ("id","participante_id","acompanante_id","tiene_alergias","detalle_alergias","tiene_enfermedad","detalle_enfermedad","toma_medicamentos","detalle_medicamentos","restriccion_alimentaria","detalle_alimentacion") VALUES(2,2,NULL,1,'mani',0,NULL,1,'paracetamol',0,NULL);
INSERT INTO "informacion_medica" ("id","participante_id","acompanante_id","tiene_alergias","detalle_alergias","tiene_enfermedad","detalle_enfermedad","toma_medicamentos","detalle_medicamentos","restriccion_alimentaria","detalle_alimentacion") VALUES(3,NULL,2,0,NULL,0,NULL,0,NULL,0,NULL);
INSERT INTO "informacion_medica" ("id","participante_id","acompanante_id","tiene_alergias","detalle_alergias","tiene_enfermedad","detalle_enfermedad","toma_medicamentos","detalle_medicamentos","restriccion_alimentaria","detalle_alimentacion") VALUES(5,4,NULL,1,'mani',0,NULL,0,NULL,0,NULL);
INSERT INTO "informacion_medica" ("id","participante_id","acompanante_id","tiene_alergias","detalle_alergias","tiene_enfermedad","detalle_enfermedad","toma_medicamentos","detalle_medicamentos","restriccion_alimentaria","detalle_alimentacion") VALUES(6,5,NULL,0,NULL,0,NULL,0,NULL,0,NULL);
INSERT INTO "informacion_medica" ("id","participante_id","acompanante_id","tiene_alergias","detalle_alergias","tiene_enfermedad","detalle_enfermedad","toma_medicamentos","detalle_medicamentos","restriccion_alimentaria","detalle_alimentacion") VALUES(7,NULL,3,0,NULL,0,NULL,0,NULL,0,NULL);
INSERT INTO "informacion_medica" ("id","participante_id","acompanante_id","tiene_alergias","detalle_alergias","tiene_enfermedad","detalle_enfermedad","toma_medicamentos","detalle_medicamentos","restriccion_alimentaria","detalle_alimentacion") VALUES(8,6,NULL,0,NULL,0,NULL,0,NULL,0,NULL);
INSERT INTO "informacion_medica" ("id","participante_id","acompanante_id","tiene_alergias","detalle_alergias","tiene_enfermedad","detalle_enfermedad","toma_medicamentos","detalle_medicamentos","restriccion_alimentaria","detalle_alimentacion") VALUES(9,7,NULL,0,NULL,0,NULL,0,NULL,0,NULL);
INSERT INTO "informacion_medica" ("id","participante_id","acompanante_id","tiene_alergias","detalle_alergias","tiene_enfermedad","detalle_enfermedad","toma_medicamentos","detalle_medicamentos","restriccion_alimentaria","detalle_alimentacion") VALUES(10,8,NULL,0,NULL,0,NULL,0,NULL,0,NULL);
INSERT INTO "informacion_medica" ("id","participante_id","acompanante_id","tiene_alergias","detalle_alergias","tiene_enfermedad","detalle_enfermedad","toma_medicamentos","detalle_medicamentos","restriccion_alimentaria","detalle_alimentacion") VALUES(11,9,NULL,0,NULL,0,NULL,0,NULL,0,NULL);
CREATE TABLE contactos_emergencia (     id INTEGER PRIMARY KEY AUTOINCREMENT,      participante_id INTEGER,     acompanante_id INTEGER,      nombre_completo TEXT NOT NULL,     parentesco TEXT NOT NULL,     telefono_principal TEXT NOT NULL,     telefono_alternativo TEXT,      FOREIGN KEY (participante_id)         REFERENCES participantes(id),      FOREIGN KEY (acompanante_id)         REFERENCES acompanantes(id),      CHECK (         (participante_id IS NOT NULL          AND acompanante_id IS NULL)         OR         (participante_id IS NULL          AND acompanante_id IS NOT NULL)     ) );
INSERT INTO "contactos_emergencia" ("id","participante_id","acompanante_id","nombre_completo","parentesco","telefono_principal","telefono_alternativo") VALUES(2,2,NULL,'Contacto Registro QA','madre-padre','+56922222222',NULL);
INSERT INTO "contactos_emergencia" ("id","participante_id","acompanante_id","nombre_completo","parentesco","telefono_principal","telefono_alternativo") VALUES(3,NULL,2,'Contacto QA Usuario 2','madre-padre','+56987654321',NULL);
INSERT INTO "contactos_emergencia" ("id","participante_id","acompanante_id","nombre_completo","parentesco","telefono_principal","telefono_alternativo") VALUES(5,4,NULL,'Carolina Isabel Prueba QA','hermano','+56 9 2222 2222',NULL);
INSERT INTO "contactos_emergencia" ("id","participante_id","acompanante_id","nombre_completo","parentesco","telefono_principal","telefono_alternativo") VALUES(6,5,NULL,'Contacto Flujo','tutor','+56988877794',NULL);
INSERT INTO "contactos_emergencia" ("id","participante_id","acompanante_id","nombre_completo","parentesco","telefono_principal","telefono_alternativo") VALUES(7,NULL,3,'Contacto Flujo','tutor-tutora','+56987654321',NULL);
INSERT INTO "contactos_emergencia" ("id","participante_id","acompanante_id","nombre_completo","parentesco","telefono_principal","telefono_alternativo") VALUES(8,6,NULL,'contacto prueba','madre-padre','+569123456789',NULL);
INSERT INTO "contactos_emergencia" ("id","participante_id","acompanante_id","nombre_completo","parentesco","telefono_principal","telefono_alternativo") VALUES(9,7,NULL,'asldkjfha','tutor','+569123456789',NULL);
INSERT INTO "contactos_emergencia" ("id","participante_id","acompanante_id","nombre_completo","parentesco","telefono_principal","telefono_alternativo") VALUES(10,8,NULL,'asldkjfha','madre-padre','+569123456789',NULL);
INSERT INTO "contactos_emergencia" ("id","participante_id","acompanante_id","nombre_completo","parentesco","telefono_principal","telefono_alternativo") VALUES(11,9,NULL,'asldkjfha','madre-padre','+569123456789',NULL);
CREATE TABLE pagos (     id INTEGER PRIMARY KEY AUTOINCREMENT,      participante_id INTEGER NOT NULL,      monto_total INTEGER NOT NULL         CHECK (monto_total >= 0),      monto_pagado INTEGER NOT NULL DEFAULT 0         CHECK (monto_pagado >= 0),      titular_transferencia TEXT,     fecha_transferencia TEXT,     comprobante_key TEXT,      estado TEXT NOT NULL DEFAULT 'PENDIENTE'         CHECK (estado IN (             'PENDIENTE',             'EN_REVISION',             'APROBADO',             'RECHAZADO'         )),      revisado_por INTEGER,     fecha_revision TEXT,     observaciones TEXT,      fecha_registro TEXT NOT NULL         DEFAULT CURRENT_TIMESTAMP, metodo_pago TEXT CHECK (metodo_pago IN ('TRANSFERENCIA', 'EFECTIVO')), comprobante_efectivo_key TEXT,      FOREIGN KEY (participante_id)         REFERENCES participantes(id),      FOREIGN KEY (revisado_por)         REFERENCES usuarios(id) );
INSERT INTO "pagos" ("id","participante_id","monto_total","monto_pagado","titular_transferencia","fecha_transferencia","comprobante_key","estado","revisado_por","fecha_revision","observaciones","fecha_registro","metodo_pago","comprobante_efectivo_key") VALUES(1,1,20000,20000,'audilio avello soto','2026-11-03','comprobantes/participante-1/5b5baa41-dec7-4954-be9c-97893875f3f8.png','APROBADO',NULL,'2026-11-03 23:58:14',NULL,'2026-10-30 23:00:44',NULL,NULL);
INSERT INTO "pagos" ("id","participante_id","monto_total","monto_pagado","titular_transferencia","fecha_transferencia","comprobante_key","estado","revisado_por","fecha_revision","observaciones","fecha_registro","metodo_pago","comprobante_efectivo_key") VALUES(2,2,30000,30000,'Titular Prueba ICEC','2026-11-02','comprobantes/participante-2/4fedc5a6-4ec5-4d02-a9e8-6af98e3577ef.png','APROBADO',NULL,'2026-11-03 18:09:33',NULL,'2026-11-02 20:15:59',NULL,NULL);
INSERT INTO "pagos" ("id","participante_id","monto_total","monto_pagado","titular_transferencia","fecha_transferencia","comprobante_key","estado","revisado_por","fecha_revision","observaciones","fecha_registro","metodo_pago","comprobante_efectivo_key") VALUES(4,4,20000,20000,'hombre ICeC','2026-11-05','comprobantes/participante-4/e23622c2-033b-4765-9b55-e006523e44c6.png','APROBADO',NULL,'2026-11-05 18:56:34',NULL,'2026-11-05 15:32:42',NULL,NULL);
INSERT INTO "pagos" ("id","participante_id","monto_total","monto_pagado","titular_transferencia","fecha_transferencia","comprobante_key","estado","revisado_por","fecha_revision","observaciones","fecha_registro","metodo_pago","comprobante_efectivo_key") VALUES(5,5,40000,40000,'Flujo','2026-11-05','comprobantes/participante-5/5278e2c3-b872-493b-968c-378c424a3eea.jpg','APROBADO',NULL,'2026-11-05 16:28:22',NULL,'2026-11-05 15:48:59',NULL,NULL);
INSERT INTO "pagos" ("id","participante_id","monto_total","monto_pagado","titular_transferencia","fecha_transferencia","comprobante_key","estado","revisado_por","fecha_revision","observaciones","fecha_registro","metodo_pago","comprobante_efectivo_key") VALUES(6,6,20000,20000,NULL,NULL,NULL,'APROBADO',3,'2026-11-09 21:56:08',NULL,'2026-11-09 20:24:12','EFECTIVO','comprobantes/participante-6/c6e1e222-bf76-4cb6-ae8c-ae0c95a1dcef.png');
INSERT INTO "pagos" ("id","participante_id","monto_total","monto_pagado","titular_transferencia","fecha_transferencia","comprobante_key","estado","revisado_por","fecha_revision","observaciones","fecha_registro","metodo_pago","comprobante_efectivo_key") VALUES(7,7,20000,20000,NULL,NULL,NULL,'APROBADO',3,'2026-11-09 22:48:27',NULL,'2026-11-09 22:07:06','EFECTIVO','comprobantes/participante-7/3ef8fa48-8855-47bf-a020-a7183660566f.png');
INSERT INTO "pagos" ("id","participante_id","monto_total","monto_pagado","titular_transferencia","fecha_transferencia","comprobante_key","estado","revisado_por","fecha_revision","observaciones","fecha_registro","metodo_pago","comprobante_efectivo_key") VALUES(8,8,0,0,NULL,NULL,NULL,'APROBADO',NULL,'2026-11-10 01:44:53',NULL,'2026-11-09 23:23:56',NULL,NULL);
INSERT INTO "pagos" ("id","participante_id","monto_total","monto_pagado","titular_transferencia","fecha_transferencia","comprobante_key","estado","revisado_por","fecha_revision","observaciones","fecha_registro","metodo_pago","comprobante_efectivo_key") VALUES(9,9,0,0,NULL,NULL,NULL,'APROBADO',NULL,'2026-11-10 01:53:06',NULL,'2026-11-10 01:52:42',NULL,NULL);
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
INSERT INTO "asignaciones_habitaciones" ("id","habitacion_id","participante_id","acompanante_id","asignado_por","fecha_asignacion") VALUES(1,14,5,NULL,6,'2026-11-05 18:34:24');
INSERT INTO "asignaciones_habitaciones" ("id","habitacion_id","participante_id","acompanante_id","asignado_por","fecha_asignacion") VALUES(2,11,NULL,3,6,'2026-11-05 18:48:32');
INSERT INTO "asignaciones_habitaciones" ("id","habitacion_id","participante_id","acompanante_id","asignado_por","fecha_asignacion") VALUES(3,11,4,NULL,5,'2026-11-05 18:57:08');
INSERT INTO "asignaciones_habitaciones" ("id","habitacion_id","participante_id","acompanante_id","asignado_por","fecha_asignacion") VALUES(7,6,7,NULL,8,'2026-11-09 22:49:15');
CREATE TABLE login_intentos (clave TEXT PRIMARY KEY NOT NULL, intentos INTEGER NOT NULL DEFAULT 0, vence INTEGER NOT NULL);
INSERT INTO "login_intentos" ("clave","intentos","vence") VALUES('c77d33e9fc6d16c48be72159b25d7c09f258d4899dd8e21c49c722a3398702ea',1,1794267470);
CREATE TABLE recuperaciones_contrasena (id INTEGER PRIMARY KEY AUTOINCREMENT, usuario_id INTEGER NOT NULL, token_hash TEXT NOT NULL UNIQUE, expira_en INTEGER NOT NULL, utilizado_en INTEGER, creado_en INTEGER NOT NULL DEFAULT (unixepoch()), FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE);
CREATE TABLE intentos_clave_lider (usuario_id INTEGER PRIMARY KEY, intentos INTEGER NOT NULL DEFAULT 0, inicio_ventana INTEGER NOT NULL, bloqueado_hasta INTEGER NOT NULL DEFAULT 0, FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('usuarios',10);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('participantes',9);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('pagos',9);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('acompanantes',3);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('informacion_medica',11);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('contactos_emergencia',11);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('habitaciones',17);
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('asignaciones_habitaciones',7);
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