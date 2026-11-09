-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('CIUDADANO', 'CONSULTANTE', 'MODERADOR', 'PERSONAL_DEPENDENCIA', 'ADMIN_INSTITUCIONAL', 'TRANSPARENCIA');

-- CreateEnum
CREATE TYPE "TipoSolicitud" AS ENUM ('REPORTE', 'SOLICITUD', 'SOLICITUD_INFORMACION', 'PROPUESTA', 'CONFIDENCIAL');

-- CreateEnum
CREATE TYPE "SubtipoQueja" AS ENUM ('QUEJA', 'RECONOCIMIENTO', 'SUGERENCIA');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('RECIBIDA', 'EN_CLASIFICACION', 'EN_MODERACION', 'PUBLICADA', 'CANALIZADA', 'RECIBIDA_DEPENDENCIA', 'EN_ATENCION', 'RESPONDIDA', 'CERRADA', 'EN_REVISION', 'REABIERTA', 'RECHAZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoModeracion" AS ENUM ('PENDIENTE', 'APROBADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "ResultadoEvaluacion" AS ENUM ('COMPLETA', 'PARCIAL', 'NO_RESUELTA');

-- CreateEnum
CREATE TYPE "EstadoRevision" AS ENUM ('PENDIENTE', 'ACEPTADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "EtapaPropuesta" AS ENUM ('RECOLECTANDO_APOYOS', 'EN_REVISION', 'CON_RESPUESTA_INSTITUCIONAL');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'CIUDADANO',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "dependenciaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dependencia" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "competencias" TEXT,
    "contacto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dependencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categoria" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoSolicitud" "TipoSolicitud" NOT NULL,
    "dependenciaSugeridaId" TEXT,
    "plazoDias" INTEGER NOT NULL DEFAULT 15,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zona" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "colonias" TEXT[],
    "centroLat" DOUBLE PRECISION,
    "centroLng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Zona_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solicitud" (
    "id" TEXT NOT NULL,
    "folio" TEXT NOT NULL,
    "tipo" "TipoSolicitud" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'RECIBIDA',
    "esPublico" BOOLEAN NOT NULL DEFAULT false,
    "confidencial" BOOLEAN NOT NULL DEFAULT false,
    "fechaLimite" TIMESTAMP(3),
    "fechaRespuesta" TIMESTAMP(3),
    "fechaCierre" TIMESTAMP(3),
    "atendidaPorInstitucion" BOOLEAN NOT NULL DEFAULT false,
    "resueltaPorCiudadano" BOOLEAN NOT NULL DEFAULT false,
    "categoriaId" TEXT NOT NULL,
    "zonaId" TEXT NOT NULL,
    "ciudadanoId" TEXT NOT NULL,
    "dependenciaActualId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reporte" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "ubicacion" TEXT,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "estadoModeracion" "EstadoModeracion" NOT NULL DEFAULT 'PENDIENTE',
    "moderadoPorId" TEXT,
    "motivoModeracion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitudInformacion" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "detalle" TEXT NOT NULL,
    "fechaLimiteRespuesta" TIMESTAMP(3),
    "prorroga" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SolicitudInformacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Queja" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "subtipo" "SubtipoQueja" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Queja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Propuesta" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "umbralApoyos" INTEGER NOT NULL DEFAULT 50,
    "etapa" "EtapaPropuesta" NOT NULL DEFAULT 'RECOLECTANDO_APOYOS',
    "justificacionInstitucional" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Propuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Confidencial" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "restriccionAcceso" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Confidencial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Adjunto" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT,
    "respuestaId" TEXT,
    "subidoPorId" TEXT,
    "path" TEXT NOT NULL,
    "nombreOriginal" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "estadoModeracion" "EstadoModeracion" NOT NULL DEFAULT 'PENDIENTE',
    "motivoModeracion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Adjunto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asignacion" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "dependenciaId" TEXT NOT NULL,
    "asignadoPorId" TEXT,
    "motivo" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asignacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RespuestaInstitucional" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "contenido" TEXT NOT NULL,
    "esConclusiva" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RespuestaInstitucional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialEstado" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "estadoAnterior" "EstadoSolicitud",
    "estadoNuevo" "EstadoSolicitud" NOT NULL,
    "usuarioId" TEXT,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HistorialEstado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Apoyo" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "ciudadanoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Apoyo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evaluacion" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "resuelto" "ResultadoEvaluacion" NOT NULL,
    "claridad" INTEGER NOT NULL,
    "tiempo" INTEGER NOT NULL,
    "satisfaccion" INTEGER NOT NULL,
    "comentario" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevisionSolicitud" (
    "id" TEXT NOT NULL,
    "solicitudId" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "estado" "EstadoRevision" NOT NULL DEFAULT 'PENDIENTE',
    "respuesta" TEXT,
    "solicitadoPorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resueltaAt" TIMESTAMP(3),

    CONSTRAINT "RevisionSolicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Auditoria" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "detalle" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FolioCounter" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "tipo" "TipoSolicitud" NOT NULL,
    "ultimo" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "FolioCounter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_dependenciaId_idx" ON "User"("dependenciaId");

-- CreateIndex
CREATE INDEX "User_rol_idx" ON "User"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "Dependencia_nombre_key" ON "Dependencia"("nombre");

-- CreateIndex
CREATE INDEX "Categoria_dependenciaSugeridaId_idx" ON "Categoria"("dependenciaSugeridaId");

-- CreateIndex
CREATE UNIQUE INDEX "Categoria_nombre_tipoSolicitud_key" ON "Categoria"("nombre", "tipoSolicitud");

-- CreateIndex
CREATE UNIQUE INDEX "Zona_nombre_key" ON "Zona"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Solicitud_folio_key" ON "Solicitud"("folio");

-- CreateIndex
CREATE INDEX "Solicitud_ciudadanoId_idx" ON "Solicitud"("ciudadanoId");

-- CreateIndex
CREATE INDEX "Solicitud_categoriaId_idx" ON "Solicitud"("categoriaId");

-- CreateIndex
CREATE INDEX "Solicitud_zonaId_idx" ON "Solicitud"("zonaId");

-- CreateIndex
CREATE INDEX "Solicitud_dependenciaActualId_idx" ON "Solicitud"("dependenciaActualId");

-- CreateIndex
CREATE INDEX "Solicitud_estado_idx" ON "Solicitud"("estado");

-- CreateIndex
CREATE INDEX "Solicitud_fechaLimite_idx" ON "Solicitud"("fechaLimite");

-- CreateIndex
CREATE INDEX "Solicitud_createdAt_idx" ON "Solicitud"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Reporte_solicitudId_key" ON "Reporte"("solicitudId");

-- CreateIndex
CREATE INDEX "Reporte_estadoModeracion_idx" ON "Reporte"("estadoModeracion");

-- CreateIndex
CREATE UNIQUE INDEX "SolicitudInformacion_solicitudId_key" ON "SolicitudInformacion"("solicitudId");

-- CreateIndex
CREATE UNIQUE INDEX "Queja_solicitudId_key" ON "Queja"("solicitudId");

-- CreateIndex
CREATE UNIQUE INDEX "Propuesta_solicitudId_key" ON "Propuesta"("solicitudId");

-- CreateIndex
CREATE UNIQUE INDEX "Confidencial_solicitudId_key" ON "Confidencial"("solicitudId");

-- CreateIndex
CREATE INDEX "Adjunto_solicitudId_idx" ON "Adjunto"("solicitudId");

-- CreateIndex
CREATE INDEX "Adjunto_respuestaId_idx" ON "Adjunto"("respuestaId");

-- CreateIndex
CREATE INDEX "Adjunto_estadoModeracion_idx" ON "Adjunto"("estadoModeracion");

-- CreateIndex
CREATE INDEX "Asignacion_solicitudId_idx" ON "Asignacion"("solicitudId");

-- CreateIndex
CREATE INDEX "Asignacion_dependenciaId_idx" ON "Asignacion"("dependenciaId");

-- CreateIndex
CREATE INDEX "Asignacion_activa_idx" ON "Asignacion"("activa");

-- CreateIndex
CREATE INDEX "RespuestaInstitucional_solicitudId_idx" ON "RespuestaInstitucional"("solicitudId");

-- CreateIndex
CREATE INDEX "HistorialEstado_solicitudId_idx" ON "HistorialEstado"("solicitudId");

-- CreateIndex
CREATE INDEX "Apoyo_solicitudId_idx" ON "Apoyo"("solicitudId");

-- CreateIndex
CREATE UNIQUE INDEX "Apoyo_solicitudId_ciudadanoId_key" ON "Apoyo"("solicitudId", "ciudadanoId");

-- CreateIndex
CREATE UNIQUE INDEX "Evaluacion_solicitudId_key" ON "Evaluacion"("solicitudId");

-- CreateIndex
CREATE INDEX "RevisionSolicitud_solicitudId_idx" ON "RevisionSolicitud"("solicitudId");

-- CreateIndex
CREATE INDEX "RevisionSolicitud_estado_idx" ON "RevisionSolicitud"("estado");

-- CreateIndex
CREATE INDEX "Auditoria_entidad_entidadId_idx" ON "Auditoria"("entidad", "entidadId");

-- CreateIndex
CREATE INDEX "Auditoria_createdAt_idx" ON "Auditoria"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "FolioCounter_anio_tipo_key" ON "FolioCounter"("anio", "tipo");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_dependenciaId_fkey" FOREIGN KEY ("dependenciaId") REFERENCES "Dependencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Categoria" ADD CONSTRAINT "Categoria_dependenciaSugeridaId_fkey" FOREIGN KEY ("dependenciaSugeridaId") REFERENCES "Dependencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "Categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "Zona"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_ciudadanoId_fkey" FOREIGN KEY ("ciudadanoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Solicitud" ADD CONSTRAINT "Solicitud_dependenciaActualId_fkey" FOREIGN KEY ("dependenciaActualId") REFERENCES "Dependencia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reporte" ADD CONSTRAINT "Reporte_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudInformacion" ADD CONSTRAINT "SolicitudInformacion_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Queja" ADD CONSTRAINT "Queja_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Propuesta" ADD CONSTRAINT "Propuesta_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Confidencial" ADD CONSTRAINT "Confidencial_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjunto" ADD CONSTRAINT "Adjunto_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjunto" ADD CONSTRAINT "Adjunto_respuestaId_fkey" FOREIGN KEY ("respuestaId") REFERENCES "RespuestaInstitucional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Adjunto" ADD CONSTRAINT "Adjunto_subidoPorId_fkey" FOREIGN KEY ("subidoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignacion" ADD CONSTRAINT "Asignacion_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignacion" ADD CONSTRAINT "Asignacion_dependenciaId_fkey" FOREIGN KEY ("dependenciaId") REFERENCES "Dependencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asignacion" ADD CONSTRAINT "Asignacion_asignadoPorId_fkey" FOREIGN KEY ("asignadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaInstitucional" ADD CONSTRAINT "RespuestaInstitucional_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RespuestaInstitucional" ADD CONSTRAINT "RespuestaInstitucional_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialEstado" ADD CONSTRAINT "HistorialEstado_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialEstado" ADD CONSTRAINT "HistorialEstado_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Apoyo" ADD CONSTRAINT "Apoyo_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Apoyo" ADD CONSTRAINT "Apoyo_ciudadanoId_fkey" FOREIGN KEY ("ciudadanoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluacion" ADD CONSTRAINT "Evaluacion_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionSolicitud" ADD CONSTRAINT "RevisionSolicitud_solicitudId_fkey" FOREIGN KEY ("solicitudId") REFERENCES "Solicitud"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevisionSolicitud" ADD CONSTRAINT "RevisionSolicitud_solicitadoPorId_fkey" FOREIGN KEY ("solicitadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Auditoria" ADD CONSTRAINT "Auditoria_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
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
