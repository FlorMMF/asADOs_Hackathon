import Link from "next/link";
import { redirect } from "next/navigation";
import { RevisionResolverForm } from "@/components/admin/revision-resolver-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Revisiones" };

export default async function AdminRevisionesPage() {
  const user = await requireAdmin();
  if (user.rol !== "ADMIN_INSTITUCIONAL") redirect("/admin");

  const revisiones = await prisma.revisionSolicitud.findMany({
    where: { estado: "PENDIENTE" },
    orderBy: { createdAt: "asc" },
    include: {
      solicitadoPor: { select: { nombre: true } },
      solicitud: {
        select: {
          id: true,
          folio: true,
          titulo: true,
          estado: true,
          tipo: true,
        },
      },
    },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Control de calidad"
        title="Revisiones ciudadanas"
        description="El ciudadano solicita revisar una respuesta. Aceptar reabre; rechazar cierra (RN6)."
      />

      {revisiones.length === 0 ? (
        <EmptyState
          title="Sin revisiones pendientes"
          description="No hay solicitudes de revisión esperando resolución."
        />
      ) : (
        <div className="space-y-4">
          {revisiones.map((revision) => (
            <Card key={revision.id}>
              <CardHeader
                title={revision.solicitud.titulo}
                description={`${revision.solicitud.folio} · solicitada ${formatDateTime(revision.createdAt)}`}
                action={<Badge>{revision.solicitud.estado}</Badge>}
              />
              <CardBody className="space-y-3">
                <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                  <p className="font-semibold">Motivo del ciudadano</p>
                  <p>{revision.motivo}</p>
                  <p className="mt-1 text-xs">
                    Solicitada por {revision.solicitadoPor?.nombre ?? "ciudadano"}
                  </p>
                </div>
                <RevisionResolverForm revisionId={revision.id} />
                <Link
                  href={`/admin/solicitudes/${revision.solicitud.id}`}
                  className="text-xs font-medium text-slate-600 hover:underline"
                >
                  Ver solicitud completa →
                </Link>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
