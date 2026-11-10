
-- ICEC 2027
-- Aplicación segura del beneficio para líderes

CREATE TRIGGER IF NOT EXISTS aplicar_beneficio_lider
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
