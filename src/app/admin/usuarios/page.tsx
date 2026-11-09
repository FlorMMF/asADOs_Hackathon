import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ROLES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Usuarios" };

export default async function AdminUsuariosPage() {
  const user = await requireAdmin();
  if (user.rol !== "ADMIN_INSTITUCIONAL") redirect("/admin");

  const usuarios = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      dependencia: true,
      _count: { select: { solicitudes: true, respuestas: true } },
    },
  });

  const activos = usuarios.filter((usuario) => usuario.activo).length;
  const institucionales = usuarios.filter((usuario) =>
    ["PERSONAL_DEPENDENCIA", "ADMIN_INSTITUCIONAL", "MODERADOR"].includes(
      usuario.rol,
    ),
  ).length;

  return (
    <div>
      <PageHeader
        eyebrow="Administración"
        title="Usuarios y roles"
        description="Consulta de cuentas, roles y adscripción a dependencias."
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Usuarios" value={usuarios.length} />
        <StatCard
          label="Activos"
          value={activos}
          accent="text-emerald-700"
        />
        <StatCard label="Institucionales" value={institucionales} />
      </div>

      <Card>
        <CardHeader
          title={`${usuarios.length} cuentas`}
          description="El alta de cuentas se realiza desde el registro ciudadano; los roles institucionales se asignan en base de datos."
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-y border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Correo</th>
                <th className="px-4 py-2">Rol</th>
                <th className="px-4 py-2">Dependencia</th>
                <th className="px-4 py-2">Solicitudes</th>
                <th className="px-4 py-2">Respuestas</th>
                <th className="px-4 py-2">Alta</th>
                <th className="px-4 py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td className="px-4 py-2 font-medium text-slate-800">
                    {usuario.nombre}
                  </td>
                  <td className="px-4 py-2 text-slate-600">{usuario.email}</td>
                  <td className="px-4 py-2">
                    <Badge>{ROLES[usuario.rol]}</Badge>
                  </td>
                  <td className="px-4 py-2 text-slate-600">
                    {usuario.dependencia?.nombre ?? "—"}
                  </td>
                  <td className="px-4 py-2">{usuario._count.solicitudes}</td>
                  <td className="px-4 py-2">{usuario._count.respuestas}</td>
                  <td className="px-4 py-2 text-xs text-slate-500">
                    {formatDate(usuario.createdAt)}
                  </td>
                  <td className="px-4 py-2">
                    {usuario.activo ? (
                      <Badge className="bg-emerald-100 text-emerald-800">
                        Activo
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-100 text-rose-800">
                        Inactivo
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
