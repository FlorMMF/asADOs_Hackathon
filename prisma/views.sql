-- Vistas de transparencia. Solo datos agregados, sin información personal.
-- Se recrean de forma idempotente al aplicar migraciones / ejecutar el seed.

CREATE OR REPLACE VIEW "vw_solicitudes_base" AS
SELECT
  s.id,
  s.folio,
  s.tipo,
  s.estado,
  s."createdAt",
  date_trunc('month', s."createdAt") AS periodo,
  c.nombre AS categoria,
  z.nombre AS zona,
  d.nombre AS dependencia,
  s."fechaLimite",
  s."fechaRespuesta",
  s."fechaCierre",
  s."atendidaPorInstitucion",
  s."resueltaPorCiudadano",
  e.resuelto,
  e.claridad,
  e.tiempo,
  e.satisfaccion,
  (s."fechaRespuesta" IS NOT NULL
    AND s."fechaLimite" IS NOT NULL
    AND s."fechaRespuesta" <= s."fechaLimite") AS a_tiempo,
  CASE
    WHEN s."fechaRespuesta" IS NOT NULL
    THEN EXTRACT(EPOCH FROM (s."fechaRespuesta" - s."createdAt")) / 86400.0
  END AS dias_respuesta,
  EXISTS (
    SELECT 1 FROM "HistorialEstado" h
    WHERE h."solicitudId" = s.id AND h."estadoNuevo" = 'REABIERTA'
  ) AS reabierta
FROM "Solicitud" s
JOIN "Categoria" c ON c.id = s."categoriaId"
JOIN "Zona" z ON z.id = s."zonaId"
LEFT JOIN "Dependencia" d ON d.id = s."dependenciaActualId"
LEFT JOIN "Evaluacion" e ON e."solicitudId" = s.id;

CREATE OR REPLACE VIEW "vw_indicadores" AS
SELECT
  dependencia,
  count(*) AS total,
  count(*) FILTER (WHERE "fechaRespuesta" IS NOT NULL) AS respondidas,
  count(*) FILTER (WHERE a_tiempo) AS a_tiempo,
  round(100.0 * count(*) FILTER (WHERE a_tiempo)
    / nullif(count(*) FILTER (WHERE "fechaRespuesta" IS NOT NULL), 0), 1) AS pct_a_tiempo,
  round(avg(dias_respuesta)::numeric, 1) AS promedio_dias,
  round(percentile_cont(0.5) WITHIN GROUP (ORDER BY dias_respuesta)::numeric, 1) AS mediana_dias,
  count(*) FILTER (WHERE resuelto IS NOT NULL) AS evaluadas,
  count(*) FILTER (WHERE resuelto = 'COMPLETA') AS resueltas_completas,
  round(100.0 * count(*) FILTER (WHERE resuelto = 'COMPLETA')
    / nullif(count(*) FILTER (WHERE resuelto IS NOT NULL), 0), 1) AS pct_resolucion,
  round(avg(satisfaccion)::numeric, 2) AS satisfaccion_promedio,
  count(*) FILTER (WHERE reabierta) AS reabiertas
FROM "vw_solicitudes_base"
GROUP BY dependencia;

CREATE OR REPLACE VIEW "vw_indicadores_categoria" AS
SELECT
  categoria,
  count(*) AS total,
  count(*) FILTER (WHERE a_tiempo) AS a_tiempo,
  round(100.0 * count(*) FILTER (WHERE a_tiempo)
    / nullif(count(*) FILTER (WHERE "fechaRespuesta" IS NOT NULL), 0), 1) AS pct_a_tiempo,
  round(avg(dias_respuesta)::numeric, 1) AS promedio_dias,
  round(percentile_cont(0.5) WITHIN GROUP (ORDER BY dias_respuesta)::numeric, 1) AS mediana_dias,
  round(100.0 * count(*) FILTER (WHERE resuelto = 'COMPLETA')
    / nullif(count(*) FILTER (WHERE resuelto IS NOT NULL), 0), 1) AS pct_resolucion,
  round(avg(satisfaccion)::numeric, 2) AS satisfaccion_promedio,
  count(*) FILTER (WHERE reabierta) AS reabiertas
FROM "vw_solicitudes_base"
GROUP BY categoria;

CREATE OR REPLACE VIEW "vw_indicadores_zona" AS
SELECT
  zona,
  count(*) AS total,
  count(*) FILTER (WHERE a_tiempo) AS a_tiempo,
  round(100.0 * count(*) FILTER (WHERE a_tiempo)
    / nullif(count(*) FILTER (WHERE "fechaRespuesta" IS NOT NULL), 0), 1) AS pct_a_tiempo,
  round(avg(dias_respuesta)::numeric, 1) AS promedio_dias,
  round(percentile_cont(0.5) WITHIN GROUP (ORDER BY dias_respuesta)::numeric, 1) AS mediana_dias,
  round(100.0 * count(*) FILTER (WHERE resuelto = 'COMPLETA')
    / nullif(count(*) FILTER (WHERE resuelto IS NOT NULL), 0), 1) AS pct_resolucion,
  round(avg(satisfaccion)::numeric, 2) AS satisfaccion_promedio,
  count(*) FILTER (WHERE reabierta) AS reabiertas
FROM "vw_solicitudes_base"
GROUP BY zona;

CREATE OR REPLACE VIEW "vw_indicadores_periodo" AS
SELECT
  periodo,
  count(*) AS total,
  count(*) FILTER (WHERE a_tiempo) AS a_tiempo,
  round(100.0 * count(*) FILTER (WHERE a_tiempo)
    / nullif(count(*) FILTER (WHERE "fechaRespuesta" IS NOT NULL), 0), 1) AS pct_a_tiempo,
  round(avg(dias_respuesta)::numeric, 1) AS promedio_dias,
  round(percentile_cont(0.5) WITHIN GROUP (ORDER BY dias_respuesta)::numeric, 1) AS mediana_dias,
  round(100.0 * count(*) FILTER (WHERE resuelto = 'COMPLETA')
    / nullif(count(*) FILTER (WHERE resuelto IS NOT NULL), 0), 1) AS pct_resolucion,
  round(avg(satisfaccion)::numeric, 2) AS satisfaccion_promedio,
  count(*) FILTER (WHERE reabierta) AS reabiertas
FROM "vw_solicitudes_base"
GROUP BY periodo;

CREATE OR REPLACE VIEW "vw_problemas_recurrentes" AS
SELECT
  categoria,
  dependencia,
  count(*) AS total,
  round(100.0 * count(*) / nullif((SELECT count(*) FROM "vw_solicitudes_base"), 0), 1) AS porcentaje
FROM "vw_solicitudes_base"
GROUP BY categoria, dependencia
HAVING count(*) >= 3
ORDER BY total DESC;
