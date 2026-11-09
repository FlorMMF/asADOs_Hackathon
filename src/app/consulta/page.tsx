import { EstadoBadge } from "@/components/solicitudes/estado-badge";
import { TipoBadge } from "@/components/solicitudes/tipo-badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { ESTADOS } from "@/lib/constants";
import {
  cargarSolicitudPorFolio,
  puedeVerSolicitud,
} from "@/lib/solicitudes";
import { sesionActual } from "@/lib/session";
import { formatDate, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Consultar folio" };

export default async function ConsultaPage({
  searchParams,
}: {
  searchParams: Promise<{ folio?: string }>;
}) {
  const { folio } = await searchParams;
  const user = await sesionActual();
  const consultado = folio?.trim().toUpperCase() ?? "";
  const solicitud = consultado
    ? await cargarSolicitudPorFolio(consultado)
    : null;
  const accesible = solicitud ? puedeVerSolicitud(user, solicitud) : false;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Seguimiento"
        title="Consulta pública por folio"
        description="Ingresa el folio que recibiste al registrar tu solicitud. Los casos confidenciales solo son visibles para sus titulares y personal autorizado."
      />

      <Card className="mb-6 p-5">
        <form className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Folio
            </label>
            <input
              name="folio"
              defaultValue={consultado}
              placeholder="HER-2026-REP-000001"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm uppercase"
            />
          </div>
          <button type="submit" className={buttonClasses("primary", "md")}>
            Consultar
          </button>
        </form>
        <p className="mt-3 text-xs text-slate-500">
          Ejemplo de folio demo:{" "}
          <button
            type="button"
            className="font-mono text-emerald-700"
          >
            HER-{new Date().getFullYear()}-REP-000001
          </button>
        </p>
      </Card>

      {consultado && !accesible ? (
        <Card className="p-6 text-sm text-slate-600">
          No encontramos una solicitud consultable con el folio{" "}
          <strong>{consultado}</strong>. Verifica el folio o inicia sesión si se
          trata de un caso confidencial propio.
        </Card>
      ) : null}

      {solicitud && accesible ? (
        <div className="space-y-4">
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
            <CardBody className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <TipoBadge tipo={solicitud.tipo} />
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {solicitud.categoria.nombre}
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {solicitud.zona.nombre}
                </span>
                {solicitud.dependenciaActual ? (
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                    {solicitud.dependenciaActual.nombre}
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-slate-700">{solicitud.descripcion}</p>
              <dl className="grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-slate-600">Fecha límite</dt>
                  <dd>{formatDate(solicitud.fechaLimite)}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-600">
                    Fecha de respuesta
                  </dt>
                  <dd>{formatDate(solicitud.fechaRespuesta)}</dd>
                </div>
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Historial de estados"
              description="Cada transición queda registrada para auditoría."
            />
            <CardBody>
              <ol className="space-y-3">
                {solicitud.historial.map((evento) => (
                  <li key={evento.id} className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {ESTADOS[evento.estadoNuevo]}
                        {evento.estadoAnterior
                          ? ` · antes ${ESTADOS[evento.estadoAnterior]}`
                          : ""}
                      </p>
                      {evento.comentario ? (
                        <p className="text-xs text-slate-600">
                          {evento.comentario}
                        </p>
                      ) : null}
                      <p className="text-[11px] text-slate-400">
                        {formatDateTime(evento.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </CardBody>
          </Card>

          {solicitud.respuestas.length > 0 ? (
            <Card>
              <CardHeader
                title="Respuestas institucionales"
                description="Respuestas públicas del caso."
              />
              <CardBody className="space-y-4">
                {solicitud.respuestas.map((respuesta) => (
                  <div
                    key={respuesta.id}
                    className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                  >
                    <p className="text-sm text-slate-700">
                      {respuesta.contenido}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {respuesta.esConclusiva ? "Respuesta conclusiva" : "Avance"} ·{" "}
                      {formatDateTime(respuesta.createdAt)}
                    </p>
                  </div>
                ))}
              </CardBody>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
