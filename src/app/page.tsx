import type { TipoSolicitud } from "@prisma/client";
import Link from "next/link";
import { EstadoBadge } from "@/components/solicitudes/estado-badge";
import { TipoBadge } from "@/components/solicitudes/tipo-badge";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { TIPOS_SOLICITUD } from "@/lib/constants";
import { obtenerIndicadores } from "@/lib/indicadores";
import { prisma } from "@/lib/prisma";
import { formatDate, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [indicadores, porTipo, reportes] = await Promise.all([
    obtenerIndicadores(),
    prisma.solicitud.groupBy({ by: ["tipo"], _count: { _all: true } }),
    prisma.solicitud.findMany({
      where: {
        tipo: "REPORTE",
        esPublico: true,
        confidencial: false,
        reporte: { estadoModeracion: "APROBADO" },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        categoria: true,
        zona: true,
        reporte: true,
        _count: { select: { apoyos: true } },
      },
    }),
  ]);

  const totalPorTipo = new Map(
    porTipo.map((row) => [row.tipo, row._count._all]),
  );
  const resumen = indicadores.resumen;

  return (
    <div className="space-y-16">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 px-6 py-14 text-white shadow-xl sm:px-12">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 right-24 h-72 w-72 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative max-w-3xl">
          <Badge className="bg-white/15 text-white">
            Gobierno abierto · Hermosillo
          </Badge>
          <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">
            Tu ciudad, tu voz.
            <br />
            Reporta, da seguimiento y evalúa.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-emerald-50">
            Centraliza reportes urbanos, solicitudes, quejas, propuestas y
            denuncias confidenciales. Consulta el avance de cada caso y revisa
            indicadores de transparencia construidos únicamente con datos
            agregados.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/mi-panel/nueva"
              className={buttonClasses(
                "secondary",
                "lg",
                "bg-white text-emerald-800 hover:bg-emerald-50",
              )}
            >
              Crear una solicitud
            </Link>
            <Link
              href="/consulta"
              className={buttonClasses(
                "outline",
                "lg",
                "border-white/40 bg-transparent text-white hover:bg-white/10",
              )}
            >
              Consultar folio
            </Link>
            <Link
              href="/transparencia"
              className={buttonClasses(
                "ghost",
                "lg",
                "text-white hover:bg-white/10",
              )}
            >
              Ver transparencia →
            </Link>
          </div>
        </div>
      </section>

      <section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Solicitudes registradas"
            value={resumen.total}
            hint="Todos los tipos de atención"
          />
          <StatCard
            label="Respondidas"
            value={resumen.respondidas}
            hint={`${resumen.pctATiempo}% dentro del plazo`}
            accent="text-emerald-700"
          />
          <StatCard
            label="Mediana de respuesta"
            value={
              resumen.medianaDias !== null
                ? `${resumen.medianaDias} días`
                : "—"
            }
            hint={`Promedio ${resumen.promedioDias ?? "—"} días`}
          />
          <StatCard
            label="Satisfacción ciudadana"
            value={
              resumen.satisfaccionPromedio !== null
                ? `${resumen.satisfaccionPromedio} / 5`
                : "—"
            }
            hint={`${resumen.evaluadas} evaluaciones`}
            accent="text-amber-600"
          />
        </div>
      </section>

      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Cinco formas de participar
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              ¿Qué puedes reportar?
            </h2>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(TIPOS_SOLICITUD).map(([tipo, label]) => (
            <Card key={tipo} className="p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  {label}
                </h3>
                <Badge className="bg-slate-100 text-slate-600">
                  {totalPorTipo.get(tipo as TipoSolicitud) ?? 0}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {tipo === "REPORTE" &&
                  "Problemas urbanos con ubicación, evidencia y moderación previa a su publicación."}
                {tipo === "SOLICITUD" &&
                  "Quejas, reconocimientos y sugerencias dirigidas a una dependencia municipal."}
                {tipo === "SOLICITUD_INFORMACION" &&
                  "Peticiones de información pública con plazo y seguimiento."}
                {tipo === "PROPUESTA" &&
                  "Ideas ciudadanas que se vuelven prioridad al alcanzar apoyos."}
                {tipo === "CONFIDENCIAL" &&
                  "Denuncias con acceso restringido y trazabilidad de auditoría."}
              </p>
              <Link
                href={`/mi-panel/nueva?tipo=${tipo}`}
                className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Iniciar →
              </Link>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Feed público moderado
            </p>
            <h2 className="mt-1 text-2xl font-bold text-slate-900">
              Reportes recientes aprobados
            </h2>
          </div>
          <Link
            href="/reportes"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Ver todos →
          </Link>
        </div>
        {reportes.length === 0 ? (
          <Card className="p-8 text-center text-sm text-slate-500">
            Aún no hay reportes públicos aprobados.
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {reportes.map((reporte) => (
              <Card key={reporte.id} className="flex flex-col p-5">
                <div className="flex items-center justify-between gap-2">
                  <TipoBadge tipo={reporte.tipo} />
                  <EstadoBadge
                    estado={reporte.estado}
                    fechaLimite={reporte.fechaLimite}
                    fechaRespuesta={reporte.fechaRespuesta}
                  />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-slate-900">
                  {reporte.titulo}
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {truncate(reporte.descripcion, 130)}
                </p>
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
                <div className="mt-auto pt-4 text-xs text-slate-400">
                  {reporte._count.apoyos} apoyos ciudadanos
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
              Transparencia por diseño
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Indicadores abiertos, sin datos personales
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Consulta volumen, cumplimiento de plazos, medianas de respuesta,
              resolución confirmada, satisfacción y reaperturas por dependencia,
              categoría, zona y periodo. Todos los cálculos usan vistas SQL
              agregadas.
            </p>
            <Link
              href="/transparencia"
              className={buttonClasses("primary", "md", "mt-5")}
            >
              Abrir panel de transparencia
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Resolución confirmada"
              value={`${resumen.pctResolucion}%`}
            />
            <StatCard label="Reabiertas" value={resumen.reabiertas} />
            <StatCard label="Evaluadas" value={resumen.evaluadas} />
            <StatCard
              label="Cumplimiento"
              value={`${resumen.pctATiempo}%`}
              accent="text-emerald-700"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
