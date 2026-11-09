import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { TIPOS_SOLICITUD } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Catálogos" };

export default async function AdminCatalogosPage() {
  const user = await requireAdmin();
  if (user.rol !== "ADMIN_INSTITUCIONAL") redirect("/admin");

  const [dependencias, categorias, zonas] = await Promise.all([
    prisma.dependencia.findMany({
      orderBy: { nombre: "asc" },
      include: { _count: { select: { categorias: true, solicitudesActuales: true } } },
    }),
    prisma.categoria.findMany({
      orderBy: [{ tipoSolicitud: "asc" }, { nombre: "asc" }],
      include: {
        dependenciaSugerida: true,
        _count: { select: { solicitudes: true } },
      },
    }),
    prisma.zona.findMany({
      orderBy: { nombre: "asc" },
      include: { _count: { select: { solicitudes: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Configuración"
        title="Catálogos institucionales"
        description="Dependencias, categorías, zonas y plazos usados para clasificar y canalizar solicitudes."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Dependencias" value={dependencias.length} />
        <StatCard label="Categorías" value={categorias.length} />
        <StatCard label="Zonas" value={zonas.length} />
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader
            title="Dependencias"
            description="Cada dependencia atiende las solicitudes canalizadas a su cargo."
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Nombre</th>
                  <th className="px-4 py-2">Contacto</th>
                  <th className="px-4 py-2">Categorías</th>
                  <th className="px-4 py-2">Casos actuales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dependencias.map((dependencia) => (
                  <tr key={dependencia.id}>
                    <td className="px-4 py-2 font-medium text-slate-800">
                      {dependencia.nombre}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {dependencia.contacto ?? "—"}
                    </td>
                    <td className="px-4 py-2">{dependencia._count.categorias}</td>
                    <td className="px-4 py-2">
                      {dependencia._count.solicitudesActuales}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Categorías y plazos"
            description="El plazo se usa para calcular la fecha límite de respuesta."
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Categoría</th>
                  <th className="px-4 py-2">Tipo</th>
                  <th className="px-4 py-2">Dependencia sugerida</th>
                  <th className="px-4 py-2">Plazo</th>
                  <th className="px-4 py-2">Casos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categorias.map((categoria) => (
                  <tr key={categoria.id}>
                    <td className="px-4 py-2 font-medium text-slate-800">
                      {categoria.nombre}{" "}
                      {!categoria.activa ? <Badge>Inactiva</Badge> : null}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {TIPOS_SOLICITUD[categoria.tipoSolicitud]}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {categoria.dependenciaSugerida?.nombre ?? "—"}
                    </td>
                    <td className="px-4 py-2">{categoria.plazoDias} días</td>
                    <td className="px-4 py-2">{categoria._count.solicitudes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Zonas"
            description="Agrupación geográfica usada en indicadores y filtros."
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Zona</th>
                  <th className="px-4 py-2">Colonias</th>
                  <th className="px-4 py-2">Casos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {zonas.map((zona) => (
                  <tr key={zona.id}>
                    <td className="px-4 py-2 font-medium text-slate-800">
                      {zona.nombre}
                    </td>
                    <td className="max-w-md px-4 py-2 text-xs text-slate-600">
                      {zona.colonias.join(", ")}
                    </td>
                    <td className="px-4 py-2">{zona._count.solicitudes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
