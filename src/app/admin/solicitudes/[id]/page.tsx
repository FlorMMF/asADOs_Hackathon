import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AsignarForm } from "@/components/admin/asignar-form";
import { CambiarEstadoForm } from "@/components/admin/cambiar-estado-form";
import { ModeracionForm } from "@/components/admin/moderacion-form";
import { RespuestaForm } from "@/components/admin/respuesta-form";
import { RevisionResolverForm } from "@/components/admin/revision-resolver-form";
import { AdjuntoUploader } from "@/components/solicitudes/adjunto-uploader";
import { EstadoBadge } from "@/components/solicitudes/estado-badge";
import { TipoBadge } from "@/components/solicitudes/tipo-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  ESTADOS,
  ESTADOS_MODERACION,
  MODERACION_COLORS,
  ROLES,
  SUBTIPOS_QUEJA,
} from "@/lib/constants";
import { transicionesPermitidas } from "@/lib/estados";
import { prisma } from "@/lib/prisma";
import { puedeModerar } from "@/lib/rbac";
import {
  cargarSolicitud,
  esDeDependencia,
  puedeOperarSolicitud,
} from "@/lib/solicitudes";
import { requireAdmin } from "@/lib/session";
import { formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminSolicitudPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireAdmin();
  if (user.rol === "TRANSPARENCIA") redirect("/transparencia");

  const solicitud = await cargarSolicitud(id);
  if (!solicitud) notFound();

  const asignadaADependencia = solicitud.asignaciones.some(
    (asignacion) =>
      asignacion.activa && asignacion.dependenciaId === user.dependenciaId,
  );

  let acceso = user.rol === "ADMIN_INSTITUCIONAL";
  if (user.rol === "PERSONAL_DEPENDENCIA") {
    acceso = esDeDependencia(user, solicitud) || asignadaADependencia;
  }
  if (user.rol === "MODERADOR") {
    acceso = solicitud.tipo === "REPORTE" && !solicitud.confidencial;
  }
  if (!acceso) notFound();

  const dependencias = await prisma.dependencia.findMany({
    orderBy: { nombre: "asc" },
    select: { id: true, nombre: true },
  });

  const puedeOperar = puedeOperarSolicitud(user, solicitud);
  const moderador = puedeModerar(user.rol);
  const transiciones = transicionesPermitidas(solicitud.estado).filter(
    (estado) => estado !== "REABIERTA",
  );
  const revisionPendiente = solicitud.revisiones.find(
    (revision) => revision.estado === "PENDIENTE",
  );

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <Link
        href="/admin"
        className="text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        ← Volver a la bandeja
      </Link>

      <Card>
        <CardHeader
          title={solicitud.titulo}
          description={`Folio ${solicitud.folio} · ${ROLES[user.rol]}`}
          action={
            <div className="flex flex-wrap gap-2">
              {solicitud.confidencial ? (
                <Badge className="bg-slate-800 text-white">Confidencial</Badge>
              ) : null}
              <EstadoBadge
                estado={solicitud.estado}
                fechaLimite={solicitud.fechaLimite}
                fechaRespuesta={solicitud.fechaRespuesta}
              />
            </div>
          }
        />
        <CardBody className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <TipoBadge tipo={solicitud.tipo} />
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {solicitud.categoria.nombre}
            </span>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {solicitud.zona.nombre}
            </span>
            {solicitud.queja ? (
              <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs text-indigo-800">
                {SUBTIPOS_QUEJA[solicitud.queja.subtipo]}
              </span>
            ) : null}
          </div>
          <p className="text-sm text-slate-700">{solicitud.descripcion}</p>
          <dl className="grid gap-3 rounded-lg bg-slate-50 p-4 text-xs sm:grid-cols-3">
            <div>
              <dt className="font-semibold text-slate-600">Ciudadano</dt>
              <dd className="text-slate-800">{solicitud.ciudadano.nombre}</dd>
              <dd className="text-slate-500">{solicitud.ciudadano.email}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600">Dependencia actual</dt>
              <dd className="text-slate-800">
                {solicitud.dependenciaActual?.nombre ?? "Sin asignar"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600">Fechas</dt>
              <dd className="text-slate-800">
                Límite {formatDate(solicitud.fechaLimite)}
              </dd>
              <dd className="text-slate-500">
                Respuesta {formatDate(solicitud.fechaRespuesta)}
              </dd>
            </div>
            <div className="sm:col-span-3">
              <dt className="font-semibold text-slate-600">RN5</dt>
              <dd className="text-slate-800">
                Atendida por institución:{" "}
                {solicitud.atendidaPorInstitucion ? "sí" : "no"} · Resuelta
                confirmada por ciudadano:{" "}
                {solicitud.resueltaPorCiudadano ? "sí" : "no"}
              </dd>
            </div>
            {solicitud.reporte ? (
              <div className="sm:col-span-3">
                <dt className="font-semibold text-slate-600">
                  Reporte / moderación
                </dt>
                <dd className="text-slate-800">
                  {solicitud.reporte.ubicacion ?? "Sin ubicación"} ·{" "}
                  {ESTADOS_MODERACION[solicitud.reporte.estadoModeracion]}
                  {solicitud.reporte.motivoModeracion
                    ? ` · ${solicitud.reporte.motivoModeracion}`
                    : ""}
                </dd>
              </div>
            ) : null}
          </dl>
        </CardBody>
      </Card>

      {moderador &&
      solicitud.reporte &&
      solicitud.reporte.estadoModeracion === "PENDIENTE" ? (
        <Card>
          <CardHeader
            title="Moderación del reporte"
            description="La aprobación publica el reporte; el rechazo requiere motivo (RN7)."
          />
          <CardBody>
            <ModeracionForm
              endpoint={`/api/moderacion/reportes/${solicitud.reporte.id}`}
              titulo="Reporte ciudadano"
            />
          </CardBody>
        </Card>
      ) : null}

      {revisionPendiente && user.rol === "ADMIN_INSTITUCIONAL" ? (
        <Card>
          <CardHeader
            title="Revisión pendiente"
            description={`Motivo: ${revisionPendiente.motivo}`}
          />
          <CardBody>
            <RevisionResolverForm revisionId={revisionPendiente.id} />
          </CardBody>
        </Card>
      ) : null}

      {puedeOperar ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Canalizar / reasignar"
              description="Cada asignación queda en el historial."
            />
            <CardBody>
              <AsignarForm
                solicitudId={solicitud.id}
                dependencias={dependencias}
                dependenciaActualId={solicitud.dependenciaActualId}
              />
            </CardBody>
          </Card>
          <Card>
            <CardHeader
              title="Cambiar estado"
              description="No se puede concluir sin respuesta institucional (RN4)."
            />
            <CardBody>
              <CambiarEstadoForm
                solicitudId={solicitud.id}
                transiciones={transiciones}
              />
            </CardBody>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader
              title="Registrar respuesta"
              description="La respuesta conclusiva cambia el estado a RESPONDIDA."
            />
            <CardBody>
              <RespuestaForm solicitudId={solicitud.id} />
              <div className="mt-4 border-t border-slate-100 pt-4">
                <AdjuntoUploader
                  solicitudId={solicitud.id}
                  label="Adjuntar evidencia interna"
                />
              </div>
            </CardBody>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardHeader title="Historial de estados" />
        <CardBody>
          <ol className="space-y-3">
            {solicitud.historial.map((evento) => (
              <li key={evento.id} className="flex gap-3">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {ESTADOS[evento.estadoNuevo]}
                  </p>
                  {evento.comentario ? (
                    <p className="text-xs text-slate-600">{evento.comentario}</p>
                  ) : null}
                  <p className="text-[11px] text-slate-400">
                    {formatDateTime(evento.createdAt)}
                    {evento.usuario ? ` · ${evento.usuario.nombre}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Asignaciones"
          description="Historial completo de canalizaciones (RN3)."
        />
        <CardBody>
          <ul className="space-y-2 text-sm">
            {solicitud.asignaciones.map((asignacion) => (
              <li
                key={asignacion.id}
                className="rounded-lg border border-slate-100 px-3 py-2"
              >
                <p className="font-medium text-slate-800">
                  {asignacion.dependencia.nombre}{" "}
                  {asignacion.activa ? (
                    <Badge className="bg-emerald-100 text-emerald-800">
                      Activa
                    </Badge>
                  ) : null}
                </p>
                <p className="text-xs text-slate-600">{asignacion.motivo}</p>
                <p className="text-[11px] text-slate-400">
                  {formatDateTime(asignacion.createdAt)}
                  {asignacion.asignadoPor
                    ? ` · ${asignacion.asignadoPor.nombre}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {solicitud.respuestas.length > 0 ? (
        <Card>
          <CardHeader title="Respuestas institucionales" />
          <CardBody className="space-y-4">
            {solicitud.respuestas.map((respuesta) => (
              <div
                key={respuesta.id}
                className="rounded-lg border border-slate-100 bg-slate-50 p-4"
              >
                <p className="text-sm text-slate-700">{respuesta.contenido}</p>
                <p className="mt-2 text-xs text-slate-500">
                  {respuesta.esConclusiva ? "Conclusiva" : "Avance"} ·{" "}
                  {formatDateTime(respuesta.createdAt)}
                  {respuesta.usuario ? ` · ${respuesta.usuario.nombre}` : ""}
                </p>
                {respuesta.adjuntos.length > 0 ? (
                  <ul className="mt-2 space-y-1">
                    {respuesta.adjuntos.map((adjunto) => (
                      <li key={adjunto.id}>
                        <a
                          href={`/api/adjuntos/${adjunto.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-emerald-700 hover:underline"
                        >
                          📎 {adjunto.nombreOriginal}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      <Card>
        <CardHeader title="Evidencias y adjuntos" />
        <CardBody className="space-y-3">
          {solicitud.adjuntos.length === 0 ? (
            <p className="text-sm text-slate-500">Sin archivos adjuntos.</p>
          ) : (
            <ul className="space-y-2">
              {solicitud.adjuntos.map((adjunto) => (
                <li
                  key={adjunto.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2"
                >
                  <a
                    href={`/api/adjuntos/${adjunto.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-emerald-700 hover:underline"
                  >
                    📎 {adjunto.nombreOriginal}
                  </a>
                  <Badge className={MODERACION_COLORS[adjunto.estadoModeracion]}>
                    {ESTADOS_MODERACION[adjunto.estadoModeracion]}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {solicitud.evaluacion ? (
        <Card>
          <CardHeader title="Evaluación ciudadana" />
          <CardBody className="grid gap-2 text-sm sm:grid-cols-2">
            <p>
              Resultado: <strong>{solicitud.evaluacion.resuelto}</strong>
            </p>
            <p>
              Satisfacción:{" "}
              <strong>{solicitud.evaluacion.satisfaccion} / 5</strong>
            </p>
            <p>
              Claridad: <strong>{solicitud.evaluacion.claridad} / 5</strong>
            </p>
            <p>
              Tiempo: <strong>{solicitud.evaluacion.tiempo} / 5</strong>
            </p>
            {solicitud.evaluacion.comentario ? (
              <p className="sm:col-span-2 text-slate-600">
                {solicitud.evaluacion.comentario}
              </p>
            ) : null}
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
