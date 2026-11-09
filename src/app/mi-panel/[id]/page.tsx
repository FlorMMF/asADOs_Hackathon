import Link from "next/link";
import { notFound } from "next/navigation";
import { AdjuntoUploader } from "@/components/solicitudes/adjunto-uploader";
import { EstadoBadge } from "@/components/solicitudes/estado-badge";
import { EvaluacionForm } from "@/components/solicitudes/evaluacion-form";
import { RevisionForm } from "@/components/solicitudes/revision-form";
import { TipoBadge } from "@/components/solicitudes/tipo-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import {
  ESTADOS,
  ESTADOS_MODERACION,
  MODERACION_COLORS,
  SUBTIPOS_QUEJA,
} from "@/lib/constants";
import { cargarSolicitud } from "@/lib/solicitudes";
import { requireUser } from "@/lib/session";
import { formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function SolicitudDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();
  const solicitud = await cargarSolicitud(id);
  if (!solicitud) notFound();

  const esDueno = solicitud.ciudadanoId === user.id;
  if (!esDueno && user.rol !== "ADMIN_INSTITUCIONAL") notFound();

  const puedeEvaluar =
    esDueno &&
    solicitud.estado === "RESPONDIDA" &&
    !solicitud.evaluacion &&
    solicitud.respuestas.length > 0;
  const revisionPendiente = solicitud.revisiones.some(
    (revision) => revision.estado === "PENDIENTE",
  );
  const puedeRevisar =
    esDueno &&
    ["CERRADA", "RESPONDIDA"].includes(solicitud.estado) &&
    !revisionPendiente;
  const puedeAdjuntar = !["CERRADA", "RECHAZADA", "CANCELADA"].includes(
    solicitud.estado,
  );

  const progreso = solicitud.propuesta
    ? Math.min(
        100,
        Math.round(
          (solicitud.apoyos.length / solicitud.propuesta.umbralApoyos) * 100,
        ),
      )
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <Link
        href="/mi-panel"
        className="text-sm font-medium text-slate-500 hover:text-slate-800"
      >
        ← Volver a mi panel
      </Link>

      <Card>
        <CardHeader
          title={solicitud.titulo}
          description={`Folio ${solicitud.folio} · ${formatDate(solicitud.createdAt)}`}
          action={
            <EstadoBadge
              estado={solicitud.estado}
              fechaLimite={solicitud.fechaLimite}
              fechaRespuesta={solicitud.fechaRespuesta}
            />
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
            {solicitud.confidencial ? (
              <Badge className="bg-slate-800 text-white">Confidencial</Badge>
            ) : null}
          </div>

          <p className="text-sm text-slate-700">{solicitud.descripcion}</p>

          <dl className="grid gap-3 rounded-lg bg-slate-50 p-4 text-xs sm:grid-cols-2">
            <div>
              <dt className="font-semibold text-slate-600">Dependencia</dt>
              <dd className="text-slate-800">
                {solicitud.dependenciaActual?.nombre ?? "En clasificación"}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600">Fecha límite</dt>
              <dd className="text-slate-800">
                {formatDate(solicitud.fechaLimite)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600">
                Fecha de respuesta
              </dt>
              <dd className="text-slate-800">
                {formatDate(solicitud.fechaRespuesta)}
              </dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-600">Trazabilidad RN5</dt>
              <dd className="text-slate-800">
                {solicitud.atendidaPorInstitucion
                  ? "Atendida por institución"
                  : "Sin atención institucional"}{" "}
                ·{" "}
                {solicitud.resueltaPorCiudadano
                  ? "Resuelta confirmada por ciudadano"
                  : "Sin confirmación ciudadana"}
              </dd>
            </div>
            {solicitud.info ? (
              <div className="sm:col-span-2">
                <dt className="font-semibold text-slate-600">
                  Información solicitada
                </dt>
                <dd className="text-slate-800">{solicitud.info.detalle}</dd>
              </div>
            ) : null}
            {solicitud.confidencialDetalle ? (
              <div className="sm:col-span-2">
                <dt className="font-semibold text-slate-600">
                  Restricción de acceso
                </dt>
                <dd className="text-slate-800">
                  {solicitud.confidencialDetalle.restriccionAcceso}
                </dd>
              </div>
            ) : null}
          </dl>

          {solicitud.propuesta && progreso !== null ? (
            <div>
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Apoyos ciudadanos</span>
                <span>
                  {solicitud.apoyos.length} / {solicitud.propuesta.umbralApoyos}
                </span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${progreso}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Etapa: {solicitud.propuesta.etapa.replaceAll("_", " ")}
              </p>
            </div>
          ) : null}
        </CardBody>
      </Card>

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
        <CardHeader
          title="Evidencias"
          description="Archivos adjuntos y su estado de moderación."
        />
        <CardBody className="space-y-4">
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
          {puedeAdjuntar ? (
            <AdjuntoUploader solicitudId={solicitud.id} label="Agregar evidencia" />
          ) : null}
        </CardBody>
      </Card>

      {solicitud.evaluacion ? (
        <Card>
          <CardHeader
            title="Evaluación ciudadana"
            description="Atendida por institución y resuelta por ciudadano son dimensiones distintas (RN5)."
          />
          <CardBody>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <p>
                Resultado:{" "}
                <strong>{solicitud.evaluacion.resuelto}</strong>
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
            </div>
            {solicitud.evaluacion.comentario ? (
              <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                {solicitud.evaluacion.comentario}
              </p>
            ) : null}
          </CardBody>
        </Card>
      ) : null}

      {solicitud.revisiones.length > 0 ? (
        <Card>
          <CardHeader title="Revisiones y reaperturas" />
          <CardBody className="space-y-3">
            {solicitud.revisiones.map((revision) => (
              <div
                key={revision.id}
                className="rounded-lg border border-slate-100 p-3"
              >
                <p className="text-sm text-slate-700">{revision.motivo}</p>
                <p className="mt-1 text-xs text-slate-500">
                  Estado: <strong>{revision.estado}</strong> ·{" "}
                  {formatDateTime(revision.createdAt)}
                </p>
                {revision.respuesta ? (
                  <p className="mt-1 text-xs text-slate-600">
                    Respuesta institucional: {revision.respuesta}
                  </p>
                ) : null}
              </div>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {puedeEvaluar ? (
        <Card>
          <CardHeader
            title="Evaluar atención"
            description="Tu evaluación alimenta los indicadores de transparencia."
          />
          <CardBody>
            <EvaluacionForm solicitudId={solicitud.id} />
          </CardBody>
        </Card>
      ) : null}

      {puedeRevisar ? (
        <Card>
          <CardHeader
            title="Solicitar revisión o reapertura"
            description="Si la respuesta no resolvió el problema, puedes pedir una revisión."
          />
          <CardBody>
            <RevisionForm solicitudId={solicitud.id} />
          </CardBody>
        </Card>
      ) : null}
    </div>
  );
}
