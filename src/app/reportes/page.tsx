import Link from "next/link";
import { EstadoBadge } from "@/components/solicitudes/estado-badge";
import { TipoBadge } from "@/components/solicitudes/tipo-badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { formatDate, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reportes públicos" };

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<{ zona?: string; categoria?: string }>;
}) {
  const { zona, categoria } = await searchParams;

  const [zonas, categorias] = await Promise.all([
    prisma.zona.findMany({ orderBy: { nombre: "asc" } }),
    prisma.categoria.findMany({
      where: { tipoSolicitud: "REPORTE", activa: true },
      orderBy: { nombre: "asc" },
    }),
  ]);

  const reportes = await prisma.solicitud.findMany({
    where: {
      tipo: "REPORTE",
      esPublico: true,
      confidencial: false,
      reporte: { estadoModeracion: "APROBADO" },
      ...(zona ? { zona: { nombre: zona } } : {}),
      ...(categoria ? { categoria: { nombre: categoria } } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 60,
    include: {
      categoria: true,
      zona: true,
      reporte: true,
      _count: {
        select: {
          apoyos: true,
          adjuntos: { where: { estadoModeracion: "APROBADO" } },
        },
      },
    },
  });

  return (
    <div>
      <PageHeader
        eyebrow="Feed público"
        title="Reportes ciudadanos aprobados"
        description="Solo aparecen reportes que pasaron por moderación. Las evidencias se sirven mediante rutas autenticadas."
        action={
          <Link href="/mi-panel/nueva?tipo=REPORTE" className={buttonClasses()}>
            Crear reporte
          </Link>
        }
      />

      <Card className="mb-6 p-4">
        <form className="flex flex-wrap items-end gap-3">
          <div className="min-w-44 flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Zona
            </label>
            <select
              name="zona"
              defaultValue={zona ?? ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {zonas.map((item) => (
                <option key={item.id} value={item.nombre}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-44 flex-1">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Categoría
            </label>
            <select
              name="categoria"
              defaultValue={categoria ?? ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {categorias.map((item) => (
                <option key={item.id} value={item.nombre}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={buttonClasses("secondary", "md")}>
            Filtrar
          </button>
          <Link href="/reportes" className={buttonClasses("ghost", "md")}>
            Limpiar
          </Link>
        </form>
      </Card>

      {reportes.length === 0 ? (
        <EmptyState
          title="No hay reportes con esos filtros"
          description="Prueba con otra zona o categoría, o crea el primer reporte."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {reportes.map((reporte) => (
            <Card key={reporte.id} className="flex flex-col p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <TipoBadge tipo={reporte.tipo} />
                <EstadoBadge
                  estado={reporte.estado}
                  fechaLimite={reporte.fechaLimite}
                  fechaRespuesta={reporte.fechaRespuesta}
                />
              </div>
              <h2 className="mt-3 text-base font-semibold text-slate-900">
                {reporte.titulo}
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {truncate(reporte.descripcion, 180)}
              </p>
              {reporte.reporte?.ubicacion ? (
                <p className="mt-2 text-xs text-slate-500">
                  📍 {reporte.reporte.ubicacion}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                <span className="rounded bg-slate-100 px-2 py-0.5">
                  {reporte.categoria.nombre}
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5">
                  {reporte.zona.nombre}
                </span>
                <span className="rounded bg-slate-100 px-2 py-0.5">
                  {formatDate(reporte.createdAt)}
                </span>
              </div>
              <div className="mt-auto flex items-center justify-between pt-4 text-xs text-slate-400">
                <span>{reporte._count.apoyos} apoyos</span>
                <span>{reporte._count.adjuntos} evidencias</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
