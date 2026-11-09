import type {
  EstadoSolicitud,
  Prisma,
  TipoSolicitud,
} from "@prisma/client";
import Link from "next/link";
import { redirect } from "next/navigation";
import { EstadoBadge } from "@/components/solicitudes/estado-badge";
import { TipoBadge } from "@/components/solicitudes/tipo-badge";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { ESTADOS_TERMINALES, TIPOS_SOLICITUD } from "@/lib/constants";
import { estaVencida } from "@/lib/estados";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { formatDate, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel institucional" };

export default async function AdminBandejaPage({
  searchParams,
}: {
  searchParams: Promise<{
    estado?: string;
    tipo?: string;
    vencidas?: string;
    confidencial?: string;
  }>;
}) {
  const user = await requireAdmin();
  if (user.rol === "TRANSPARENCIA") redirect("/transparencia");

  const { estado, tipo, vencidas, confidencial } = await searchParams;

  const where: Prisma.SolicitudWhereInput = {};

  if (user.rol === "PERSONAL_DEPENDENCIA") {
    where.OR = [
      { dependenciaActualId: user.dependenciaId ?? "__none__" },
      {
        asignaciones: {
          some: {
            dependenciaId: user.dependenciaId ?? "__none__",
            activa: true,
          },
        },
      },
    ];
  }

  if (estado) where.estado = estado as EstadoSolicitud;
  if (tipo) where.tipo = tipo as TipoSolicitud;
  if (user.rol === "MODERADOR") {
    where.tipo = "REPORTE";
    where.confidencial = false;
  }
  if (confidencial === "1" && user.rol !== "MODERADOR") {
    where.confidencial = true;
  }
  if (vencidas === "1") {
    where.fechaLimite = { lt: new Date() };
    where.fechaRespuesta = null;
    where.estado = { notIn: ESTADOS_TERMINALES };
  }

  const [solicitudes, dependencias] = await Promise.all([
    prisma.solicitud.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
      include: {
        categoria: true,
        zona: true,
        dependenciaActual: true,
      },
    }),
    prisma.dependencia.findMany({ orderBy: { nombre: "asc" } }),
  ]);

  const total = solicitudes.length;
  const vencidasCount = solicitudes.filter((solicitud) =>
    estaVencida(solicitud),
  ).length;
  const enAtencion = solicitudes.filter((solicitud) =>
    ["EN_ATENCION", "RECIBIDA_DEPENDENCIA", "CANALIZADA"].includes(
      solicitud.estado,
    ),
  ).length;
  const respondidas = solicitudes.filter((solicitud) =>
    ["RESPONDIDA", "CERRADA", "EN_REVISION", "REABIERTA"].includes(
      solicitud.estado,
    ),
  ).length;

  return (
    <div>
      <PageHeader
        eyebrow="Institucional"
        title="Bandeja de atención"
        description={
          user.rol === "PERSONAL_DEPENDENCIA"
            ? "Solicitudes canalizadas a tu dependencia o asignadas activamente."
            : "Todas las solicitudes del municipio, con filtros por estado, tipo y vencimiento."
        }
      />

      {user.rol !== "MODERADOR" ? (
        <div className="mb-4 flex flex-wrap gap-2">
          <Link
            href="/admin"
            className={buttonClasses(
              !tipo && confidencial !== "1" ? "secondary" : "outline",
              "sm",
            )}
          >
            Todas
          </Link>
          <Link
            href="/admin?tipo=REPORTE"
            className={buttonClasses(
              tipo === "REPORTE" ? "secondary" : "outline",
              "sm",
            )}
          >
            Reportes
          </Link>
          <Link
            href="/admin?tipo=SOLICITUD_INFORMACION"
            className={buttonClasses(
              tipo === "SOLICITUD_INFORMACION" ? "secondary" : "outline",
              "sm",
            )}
          >
            Información
          </Link>
          <Link
            href="/admin?confidencial=1"
            className={buttonClasses(
              confidencial === "1" ? "secondary" : "outline",
              "sm",
            )}
          >
            Confidenciales
          </Link>
        </div>
      ) : null}

      <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="En bandeja" value={total} />
        <StatCard
          label="Vencidas"
          value={vencidasCount}
          accent="text-rose-600"
        />
        <StatCard label="En atención" value={enAtencion} accent="text-sky-700" />
        <StatCard
          label="Respondidas"
          value={respondidas}
          accent="text-emerald-700"
        />
      </div>

      <Card className="mb-5 p-4">
        <form className="flex flex-wrap items-end gap-3">
          <div className="min-w-40">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Estado
            </label>
            <select
              name="estado"
              defaultValue={estado ?? ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {Object.entries({
                RECIBIDA: "Recibida",
                EN_CLASIFICACION: "En clasificación",
                EN_MODERACION: "En moderación",
                PUBLICADA: "Publicada",
                CANALIZADA: "Canalizada",
                RECIBIDA_DEPENDENCIA: "Recibida por dependencia",
                EN_ATENCION: "En atención",
                RESPONDIDA: "Respondida",
                CERRADA: "Cerrada",
                EN_REVISION: "En revisión",
                REABIERTA: "Reabierta",
                RECHAZADA: "Rechazada",
                CANCELADA: "Cancelada",
              }).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-40">
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Tipo
            </label>
            <select
              name="tipo"
              defaultValue={tipo ?? ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {Object.entries(TIPOS_SOLICITUD).map(([valor, label]) => (
                <option key={valor} value={valor}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
            <input
              type="checkbox"
              name="vencidas"
              value="1"
              defaultChecked={vencidas === "1"}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            Solo vencidas
          </label>
          <button type="submit" className={buttonClasses("secondary", "md")}>
            Filtrar
          </button>
          <Link href="/admin" className={buttonClasses("ghost", "md")}>
            Limpiar
          </Link>
        </form>
      </Card>

      {solicitudes.length === 0 ? (
        <EmptyState
          title="Sin solicitudes en la bandeja"
          description="No hay casos que coincidan con los filtros seleccionados."
        />
      ) : (
        <Card>
          <CardHeader
            title={`${solicitudes.length} solicitudes`}
            description="Ordenadas por fecha de registro descendente."
            action={<Badge>{dependencias.length} dependencias</Badge>}
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-2">Folio</th>
                  <th className="px-4 py-2">Tipo</th>
                  <th className="px-4 py-2">Solicitud</th>
                  <th className="px-4 py-2">Dependencia</th>
                  <th className="px-4 py-2">Estado</th>
                  <th className="px-4 py-2">Límite</th>
                  <th className="px-4 py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {solicitudes.map((solicitud) => (
                  <tr key={solicitud.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600">
                      {solicitud.folio}
                    </td>
                    <td className="px-4 py-3">
                      <TipoBadge tipo={solicitud.tipo} />
                    </td>
                    <td className="max-w-xs px-4 py-3">
                      <p className="truncate font-medium text-slate-800">
                        {solicitud.titulo}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {truncate(solicitud.descripcion, 70)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {solicitud.dependenciaActual?.nombre ?? "Sin asignar"}
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge
                        estado={solicitud.estado}
                        fechaLimite={solicitud.fechaLimite}
                        fechaRespuesta={solicitud.fechaRespuesta}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(solicitud.fechaLimite)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/solicitudes/${solicitud.id}`}
                        className={buttonClasses("outline", "sm")}
                      >
                        Abrir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
