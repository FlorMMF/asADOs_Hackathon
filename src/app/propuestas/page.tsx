import Link from "next/link";
import { ApoyoButton } from "@/components/propuestas/apoyo-button";
import { EstadoBadge } from "@/components/solicitudes/estado-badge";
import { TipoBadge } from "@/components/solicitudes/tipo-badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { sesionActual } from "@/lib/session";
import { formatDate, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Propuestas ciudadanas" };

export default async function PropuestasPage() {
  const user = await sesionActual();

  const propuestas = await prisma.solicitud.findMany({
    where: {
      tipo: "PROPUESTA",
      esPublico: true,
      confidencial: false,
      estado: { in: ["PUBLICADA", "EN_REVISION"] },
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      categoria: true,
      zona: true,
      propuesta: true,
      apoyos: { select: { ciudadanoId: true } },
    },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Participación ciudadana"
        title="Propuestas que se vuelven prioridad"
        description="Apoya las propuestas que te importan. Al alcanzar el umbral configurado, la propuesta pasa automáticamente a revisión institucional."
        action={
          <Link
            href="/mi-panel/nueva?tipo=PROPUESTA"
            className={buttonClasses()}
          >
            Nueva propuesta
          </Link>
        }
      />

      {propuestas.length === 0 ? (
        <EmptyState
          title="Todavía no hay propuestas públicas"
          description="Sé la primera persona en proponer una mejora para Hermosillo."
          action={
            <Link
              href="/mi-panel/nueva?tipo=PROPUESTA"
              className={buttonClasses()}
            >
              Crear propuesta
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {propuestas.map((propuesta) => (
            <Card key={propuesta.id} className="flex flex-col p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <TipoBadge tipo={propuesta.tipo} />
                  <EstadoBadge estado={propuesta.estado} />
                </div>
                <span className="text-xs text-slate-400">
                  {formatDate(propuesta.createdAt)}
                </span>
              </div>
              <h2 className="mt-3 text-base font-semibold text-slate-900">
                {propuesta.titulo}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {truncate(propuesta.descripcion, 220)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded bg-slate-100 px-2 py-0.5">
                  {propuesta.categoria.nombre}
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5">
                  {propuesta.zona.nombre}
                </span>
              </div>
              {propuesta.propuesta ? (
                <div className="mt-4">
                  <ApoyoButton
                    solicitudId={propuesta.id}
                    inicial={propuesta.apoyos.length}
                    umbral={propuesta.propuesta.umbralApoyos}
                    yaApoyo={
                      !!user &&
                      propuesta.apoyos.some(
                        (apoyo) => apoyo.ciudadanoId === user.id,
                      )
                    }
                    autenticado={!!user}
                  />
                </div>
              ) : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
