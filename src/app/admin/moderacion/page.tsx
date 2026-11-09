import Link from "next/link";
import { redirect } from "next/navigation";
import { ModeracionForm } from "@/components/admin/moderacion-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { prisma } from "@/lib/prisma";
import { puedeModerar } from "@/lib/rbac";
import { requireAdmin } from "@/lib/session";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Moderación" };

export default async function AdminModeracionPage() {
  const user = await requireAdmin();
  if (!puedeModerar(user.rol)) redirect("/admin");

  const [reportes, adjuntos] = await Promise.all([
    prisma.reporte.findMany({
      where: {
        estadoModeracion: "PENDIENTE",
        solicitud: { confidencial: false },
      },
      orderBy: { createdAt: "asc" },
      include: {
        solicitud: {
          include: {
            categoria: true,
            zona: true,
            ciudadano: { select: { nombre: true } },
            adjuntos: true,
          },
        },
      },
    }),
    prisma.adjunto.findMany({
      where: { estadoModeracion: "PENDIENTE" },
      orderBy: { createdAt: "asc" },
      include: {
        solicitud: {
          select: { id: true, folio: true, titulo: true, tipo: true },
        },
        subidoPor: { select: { nombre: true } },
      },
    }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Moderación"
        title="Contenido pendiente"
        description="Los reportes ciudadanos y adjuntos no son públicos hasta ser aprobados (RN7)."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-2">
        <StatCard label="Reportes pendientes" value={reportes.length} />
        <StatCard label="Adjuntos pendientes" value={adjuntos.length} />
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader
            title="Reportes por moderar"
            description="Aprobar publica el reporte; rechazar exige motivo."
          />
          <CardBody className="space-y-4">
            {reportes.length === 0 ? (
              <EmptyState
                title="Sin reportes pendientes"
                description="Todos los reportes han sido revisados."
              />
            ) : (
              reportes.map((reporte) => (
                <div
                  key={reporte.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/solicitudes/${reporte.solicitudId}`}
                      className="font-mono text-[11px] text-emerald-700 hover:underline"
                    >
                      {reporte.solicitud.folio}
                    </Link>
                    <Badge>{reporte.solicitud.categoria.nombre}</Badge>
                    <Badge>{reporte.solicitud.zona.nombre}</Badge>
                  </div>
                  <p className="font-medium text-slate-800">
                    {reporte.solicitud.titulo}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {reporte.solicitud.descripcion}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    {reporte.solicitud.ciudadano.nombre} ·{" "}
                    {reporte.ubicacion ?? "Sin ubicación"} ·{" "}
                    {formatDateTime(reporte.createdAt)}
                  </p>
                  {reporte.solicitud.adjuntos.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {reporte.solicitud.adjuntos.map((adjunto) => (
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
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <ModeracionForm
                      endpoint={`/api/moderacion/reportes/${reporte.id}`}
                      titulo="Decisión del reporte"
                    />
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Adjuntos por moderar"
            description="Revisa el contenido antes de permitir su descarga pública."
          />
          <CardBody className="space-y-4">
            {adjuntos.length === 0 ? (
              <EmptyState
                title="Sin adjuntos pendientes"
                description="No hay archivos esperando moderación."
              />
            ) : (
              adjuntos.map((adjunto) => (
                <div
                  key={adjunto.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <a
                        href={`/api/adjuntos/${adjunto.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-emerald-700 hover:underline"
                      >
                        📎 {adjunto.nombreOriginal}
                      </a>
                      <p className="text-xs text-slate-500">
                        {adjunto.mime} ·{" "}
                        {(adjunto.tamano / 1024).toFixed(1)} KB ·{" "}
                        {adjunto.subidoPor?.nombre ?? "Sistema"}
                      </p>
                    </div>
                    {adjunto.solicitud ? (
                      <Link
                        href={`/admin/solicitudes/${adjunto.solicitud.id}`}
                        className="text-xs font-medium text-slate-600 hover:underline"
                      >
                        {adjunto.solicitud.folio} · {adjunto.solicitud.titulo}
                      </Link>
                    ) : (
                      <Badge>Sin solicitud</Badge>
                    )}
                  </div>
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <ModeracionForm
                      endpoint={`/api/moderacion/adjuntos/${adjunto.id}`}
                      titulo="Decisión del adjunto"
                    />
                  </div>
                </div>
              ))
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
