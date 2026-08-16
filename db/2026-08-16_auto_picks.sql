/* ============================================================================
   PRONÓSTICOS AUTOMÁTICOS AL TERMINAR UN PARTIDO
   Aplicado en Supabase (frclhxrafeadebmuikjr) el 2026-08-16.

   Regla: cuando un partido termina, todo usuario que no lo haya pronosticado
   recibe un pronóstico aleatorio uniforme (1/X/2) con la cuota reducida a la
   mitad de su ganancia neta:

       cuota_asignada = ((cuota_real - 1) / 2) + 1

       1.30 -> 1.15     3.00 -> 2.00     10.00 -> 5.50

   Decisiones tomadas:
     · Alcance: los 30 usuarios registrados, incluidos los que nunca han jugado.
     · Momento: en el instante en que el sync escribe el resultado (trigger).
     · Azar: uniforme, 1/3 para cada signo.
     · Marcado: columna `auto`, visible en la UI y reversible.
     · ClaudIA ('claude') excluida: es el bot, con su propia lógica (favorito a
       cuota íntegra). Mezclarlas desvirtuaría la comparación IA / peña.
     · Sin cuotas no se asigna: no hay base honesta para calcular la reducción.

   Para revertir por completo la asignación:
       DELETE FROM predictions WHERE auto;
   ============================================================================ */

-- 1) Marca de pronóstico automático -----------------------------------------
ALTER TABLE public.predictions
  ADD COLUMN IF NOT EXISTS auto boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.predictions.auto IS
  'true = pronostico aleatorio asignado por assign_random_predictions() al terminar el partido, con cuota reducida ((c-1)/2)+1';


-- 2) La asignación ------------------------------------------------------------
-- Idempotente: el UNIQUE(username, id_partido) + ON CONFLICT DO NOTHING permite
-- ejecutarla tantas veces como haga falta sin duplicar ni pisar apuestas reales.
-- Por eso convive con una quiniela enviada a medias: solo rellena huecos de
-- partidos YA TERMINADOS, nunca sobrescribe ni toca los que están por jugar.
CREATE OR REPLACE FUNCTION public.assign_random_predictions(p_id_partido bigint DEFAULT NULL)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_ins int := 0;
BEGIN
  WITH candidatos AS (
    SELECT u.username, m.competition, m.id_partido, m.jornada,
           m.cuota_local, m.cuota_empate, m.cuota_visitante,
           (ARRAY['1','X','2'])[(floor(random() * 3) + 1)::int] AS pick
    FROM all_matches m
    CROSS JOIN users u
    WHERE m.resultado IS NOT NULL
      AND m.cuota_local IS NOT NULL AND m.cuota_empate IS NOT NULL AND m.cuota_visitante IS NOT NULL
      AND u.username <> 'claude'
      AND (p_id_partido IS NULL OR m.id_partido = p_id_partido)
      AND NOT EXISTS (
        SELECT 1 FROM predictions p
        WHERE p.username = u.username AND p.id_partido = m.id_partido
      )
  )
  INSERT INTO predictions (username, competition, id_partido, jornada, pronostico, cuota, auto)
  SELECT c.username, c.competition, c.id_partido, c.jornada, c.pick::bpchar,
         round((((CASE c.pick
                    WHEN '1' THEN c.cuota_local
                    WHEN 'X' THEN c.cuota_empate
                    ELSE          c.cuota_visitante
                  END) - 1) / 2) + 1, 2),
         true
  FROM candidatos c
  ON CONFLICT (username, id_partido) DO NOTHING;

  GET DIAGNOSTICS v_ins = ROW_COUNT;
  RETURN v_ins;
END; $function$;


-- 3) Disparo al terminar el partido -------------------------------------------
-- NO se engancha en trigger_sync(): esa función es asíncrona (net.http_post a las
-- Edge Functions), así que cuando retorna el resultado todavía no está escrito.
-- El trigger sobre `resultado` sí es el instante exacto.
--
-- El bloque EXCEPTION es deliberado: si la asignación fallara NO debe tumbar la
-- sincronización de resultados, que es lo crítico. Queda registrado en
-- scheduler_log y la pasada nocturna lo recoge.
CREATE OR REPLACE FUNCTION public.trg_assign_random_on_result()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE v_n int;
BEGIN
  BEGIN
    v_n := assign_random_predictions(NEW.id_partido);
    IF v_n > 0 THEN
      INSERT INTO scheduler_log (message)
      VALUES (format('auto-picks: %s pronosticos asignados en el partido %s', v_n, NEW.id_partido));
    END IF;
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO scheduler_log (message)
    VALUES (format('auto-picks ERROR en partido %s: %s', NEW.id_partido, SQLERRM));
  END;
  RETURN NULL;
END; $function$;

DROP TRIGGER IF EXISTS assign_random_after_result ON public.all_matches;
CREATE TRIGGER assign_random_after_result
  AFTER INSERT OR UPDATE OF resultado ON public.all_matches
  FOR EACH ROW
  WHEN (NEW.resultado IS NOT NULL)
  EXECUTE FUNCTION public.trg_assign_random_on_result();


-- 4) Red de seguridad nocturna -------------------------------------------------
CREATE OR REPLACE FUNCTION public.daily_maintenance_cron()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_auto int;
BEGIN
  IF extract(hour FROM (now() AT TIME ZONE 'Europe/Madrid'))::int = 2 THEN
    PERFORM daily_maintenance();
    PERFORM auto_predict_bot();              -- el bot apuesta cada jornada
    v_auto := assign_random_predictions();   -- rescate de pronosticos automaticos
    IF v_auto > 0 THEN
      INSERT INTO scheduler_log (message)
      VALUES (format('auto-picks (rescate nocturno): %s asignados', v_auto));
    END IF;
    PERFORM publicar_anuncios_top3();
  END IF;
END; $function$;


-- 5) Exponer el flag en el historial ------------------------------------------
CREATE OR REPLACE VIEW public.predictions_history AS
 SELECT p.id, p.username, p.competition, p.id_partido, p.jornada,
    m.equipo_local, m.equipo_visitante, p.pronostico, p.cuota,
        CASE WHEN ((m.fecha + m.hora) AT TIME ZONE 'UTC'::text) <= app_now() THEN m.resultado
             ELSE NULL::character(1) END AS resultado_real,
        CASE WHEN ((m.fecha + m.hora) AT TIME ZONE 'UTC'::text) <= app_now() THEN p.pronostico = m.resultado
             ELSE NULL::boolean END AS acierto,
        CASE WHEN ((m.fecha + m.hora) AT TIME ZONE 'UTC'::text) <= app_now() AND p.pronostico = m.resultado THEN p.cuota
             ELSE 0::numeric END AS puntos_ganados,
    p.created_at AS fecha_apuesta,
    p.created_at,
    ((m.fecha + m.hora) AT TIME ZONE 'UTC'::text) <= app_now() AS jugado,
    m.fecha,
    m.hora,
    p.auto
   FROM predictions p
     JOIN all_matches m ON m.id_partido = p.id_partido;


-- 6) Relleno retroactivo (ya ejecutado: 48 pronósticos sobre los 3 partidos de la J1)
-- SELECT assign_random_predictions();
