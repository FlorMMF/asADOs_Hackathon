import Link from "next/link";
import { EstadoBadge } from "@/components/solicitudes/estado-badge";
import { TipoBadge } from "@/components/solicitudes/tipo-badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ESTADOS_TERMINALES } from "@/lib/constants";
import { estaVencida } from "@/lib/estados";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { formatDate, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi panel" };

export default async function MiPanelPage() {
  const user = await requireUser();

  const solicitudes = await prisma.solicitud.findMany({
    where: { ciudadanoId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      categoria: true,
      zona: true,
      dependenciaActual: true,
      evaluacion: true,
      _count: { select: { respuestas: true, adjuntos: true } },
    },
  });

  const total = solicitudes.length;
  const abiertas = solicitudes.filter(
    (solicitud) => !ESTADOS_TERMINALES.includes(solicitud.estado),
  ).length;
  const respondidas = solicitudes.filter((solicitud) =>
    ["RESPONDIDA", "CERRADA", "REABIERTA", "EN_REVISION"].includes(
      solicitud.estado,
    ),
  ).length;
  const vencidas = solicitudes.filter((solicitud) =>
    estaVencida(solicitud),
  ).length;

  return (
    <div>
      <PageHeader
        eyebrow="Centro ciudadano"
        title={`Hola, ${user.name ?? "ciudadano"}`}
        description="Da seguimiento a tus reportes, solicitudes, propuestas y denuncias confidenciales."
        action={
          <Link href="/mi-panel/nueva" className={buttonClasses()}>
            Nueva solicitud
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={total} />
        <StatCard label="Abiertas" value={abiertas} accent="text-sky-700" />
        <StatCard
          label="Respondidas"
          value={respondidas}
          accent="text-emerald-700"
        />
        <StatCard label="Vencidas" value={vencidas} accent="text-rose-600" />
      </div>

      {solicitudes.length === 0 ? (
        <EmptyState
          title="Aún no tienes solicitudes"
          description="Crea tu primer reporte, solicitud, propuesta o denuncia confidencial."
          action={
            <Link href="/mi-panel/nueva" className={buttonClasses()}>
              Crear solicitud
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {solicitudes.map((solicitud) => (
            <Card
              key={solicitud.id}
              className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <TipoBadge tipo={solicitud.tipo} />
                  <EstadoBadge
                    estado={solicitud.estado}
                    fechaLimite={solicitud.fechaLimite}
                    fechaRespuesta={solicitud.fechaRespuesta}
                  />
                  <span className="font-mono text-[11px] text-slate-500">
                    {solicitud.folio}
                  </span>
                </div>
                <h2 className="mt-1 truncate text-sm font-semibold text-slate-900">
                  {solicitud.titulo}
                </h2>
                <p className="text-xs text-slate-500">
                  {truncate(solicitud.descripcion, 110)}
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-slate-400">
                  <span>{solicitud.categoria.nombre}</span>
                  <span>·</span>
                  <span>{solicitud.zona.nombre}</span>
                  <span>·</span>
                  <span>{formatDate(solicitud.createdAt)}</span>
                  {solicitud.dependenciaActual ? (
                    <>
                      <span>·</span>
                      <span>{solicitud.dependenciaActual.nombre}</span>
                    </>
                  ) : null}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <div className="text-right text-[11px] text-slate-400">
                  <p>{solicitud._count.respuestas} respuestas</p>
                  <p>{solicitud._count.adjuntos} archivos</p>
                </div>
                <Link
                  href={`/mi-panel/${solicitud.id}`}
                  className={buttonClasses("outline", "sm")}
                >
                  Ver detalle
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
