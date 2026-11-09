"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import type { IndicadoresResultado } from "@/lib/indicadores";

const COLORES = ["#059669", "#0ea5e9", "#6366f1", "#f59e0b", "#ec4899", "#14b8a6"];

function formatearDias(value: number | null) {
  return value === null ? "—" : `${value} d`;
}

export function TransparenciaDashboard({
  data,
}: {
  data: IndicadoresResultado;
}) {
  const resumen = data.resumen;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Volumen total"
          value={resumen.total}
          hint={`${resumen.respondidas} respondidas`}
        />
        <StatCard
          label="% a tiempo"
          value={`${resumen.pctATiempo}%`}
          hint={`${resumen.aTiempo} respuestas dentro del plazo`}
          accent="text-emerald-700"
        />
        <StatCard
          label="Mediana de respuesta"
          value={formatearDias(resumen.medianaDias)}
          hint={`Promedio ${formatearDias(resumen.promedioDias)}`}
        />
        <StatCard
          label="Satisfacción"
          value={
            resumen.satisfaccionPromedio !== null
              ? `${resumen.satisfaccionPromedio} / 5`
              : "—"
          }
          hint={`${resumen.evaluadas} evaluaciones`}
          accent="text-amber-600"
        />
        <StatCard
          label="Tasa de resolución"
          value={`${resumen.pctResolucion}%`}
          hint={`${resumen.resueltasCompletas} resueltas completas`}
        />
        <StatCard
          label="Resolución confirmada"
          value={`${resumen.pctResolucion}%`}
          hint="Solo evaluaciones ciudadanas COMPLETA"
        />
        <StatCard
          label="Reabiertas"
          value={resumen.reabiertas}
          hint="Casos con solicitud de revisión aprobada"
        />
        <StatCard
          label="Problemas recurrentes"
          value={data.problemas.length}
          hint="Categorías con 3 o más casos"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Volumen por dependencia"
            description="Casos asociados a cada dependencia municipal."
          />
          <CardBody>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.porDependencia.map((row) => ({
                    nombre: row.nombre ?? "Sin asignar",
                    total: row.total,
                    aTiempo: row.pctATiempo,
                  }))}
                  margin={{ left: 8, right: 8, top: 8, bottom: 64 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="nombre"
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                    height={80}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" name="Solicitudes" fill="#059669" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Tendencia por periodo"
            description="Volumen mensual y cumplimiento de plazos."
          />
          <CardBody>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.porPeriodo.map((row) => ({
                    nombre: row.nombre,
                    total: row.total,
                    aTiempo: row.pctATiempo,
                  }))}
                  margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    name="Solicitudes"
                    stroke="#059669"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="aTiempo"
                    name="% a tiempo"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Cumplimiento por categoría"
            description="Porcentaje de respuestas dentro del plazo."
          />
          <CardBody>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.porCategoria.map((row) => ({
                    nombre: row.nombre,
                    aTiempo: row.pctATiempo,
                    total: row.total,
                  }))}
                  margin={{ left: 8, right: 8, top: 8, bottom: 64 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis
                    dataKey="nombre"
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                    height={80}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="aTiempo" name="% a tiempo" radius={[4, 4, 0, 0]}>
                    {data.porCategoria.map((row, index) => (
                      <Cell key={row.nombre} fill={COLORES[index % COLORES.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            title="Problemas recurrentes"
            description="Categorías con mayor concentración de casos."
          />
          <CardBody>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.porZona.map((row) => ({
                    nombre: row.nombre,
                    total: row.total,
                  }))}
                  margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="nombre" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="total" name="Solicitudes" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Tabla comparativa por dependencia"
          description="Indicadores agregados; no se incluyen datos personales."
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Dependencia</th>
                <th className="px-4 py-2 text-right">Total</th>
                <th className="px-4 py-2 text-right">Respondidas</th>
                <th className="px-4 py-2 text-right">% a tiempo</th>
                <th className="px-4 py-2 text-right">Promedio</th>
                <th className="px-4 py-2 text-right">Mediana</th>
                <th className="px-4 py-2 text-right">% resolución</th>
                <th className="px-4 py-2 text-right">Satisfacción</th>
                <th className="px-4 py-2 text-right">Reabiertas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.porDependencia.map((row) => (
                <tr key={row.nombre} className="hover:bg-slate-50">
                  <td className="px-4 py-2 font-medium text-slate-800">
                    {row.nombre ?? "Sin asignar"}
                  </td>
                  <td className="px-4 py-2 text-right">{row.total}</td>
                  <td className="px-4 py-2 text-right">{row.respondidas}</td>
                  <td className="px-4 py-2 text-right">{row.pctATiempo}%</td>
                  <td className="px-4 py-2 text-right">
                    {formatearDias(row.promedioDias)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {formatearDias(row.medianaDias)}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {row.pctResolucion}%
                  </td>
                  <td className="px-4 py-2 text-right">
                    {row.satisfaccionPromedio ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-right">{row.reabiertas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Problemas recurrentes"
          description="Categorías con 3 o más casos en el periodo filtrado."
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2">Categoría</th>
                <th className="px-4 py-2">Dependencia</th>
                <th className="px-4 py-2 text-right">Casos</th>
                <th className="px-4 py-2 text-right">% del total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.problemas.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={4}>
                    Sin problemas recurrentes para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                data.problemas.map((row) => (
                  <tr key={`${row.categoria}-${row.dependencia}`}>
                    <td className="px-4 py-2 font-medium text-slate-800">
                      {row.categoria}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {row.dependencia ?? "Sin asignar"}
                    </td>
                    <td className="px-4 py-2 text-right">{row.total}</td>
                    <td className="px-4 py-2 text-right">{row.porcentaje}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
