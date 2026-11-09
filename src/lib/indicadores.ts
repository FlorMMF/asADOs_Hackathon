import { Prisma, type TipoSolicitud } from "@prisma/client";
import { prisma } from "./prisma";

export interface IndicadoresFiltros {
  dependencia?: string;
  categoria?: string;
  zona?: string;
  tipo?: TipoSolicitud;
  desde?: string;
  hasta?: string;
}

export interface ResumenIndicadores {
  total: number;
  respondidas: number;
  aTiempo: number;
  pctATiempo: number;
  promedioDias: number | null;
  medianaDias: number | null;
  evaluadas: number;
  resueltasCompletas: number;
  pctResolucion: number;
  satisfaccionPromedio: number | null;
  reabiertas: number;
}

export interface FilaDimension extends ResumenIndicadores {
  nombre: string;
}

export interface ProblemaRecurrente {
  categoria: string;
  dependencia: string | null;
  total: number;
  porcentaje: number;
}

export interface IndicadoresResultado {
  resumen: ResumenIndicadores;
  porDependencia: FilaDimension[];
  porCategoria: FilaDimension[];
  porZona: FilaDimension[];
  porPeriodo: FilaDimension[];
  problemas: ProblemaRecurrente[];
}

const DIMENSIONES = {
  dependencia: '"dependencia"',
  categoria: '"categoria"',
  zona: '"zona"',
  periodo: '"periodo"',
} as const;

function construirWhere(filtros: IndicadoresFiltros): Prisma.Sql {
  const conditions: Prisma.Sql[] = [];
  if (filtros.dependencia) {
    conditions.push(Prisma.sql`"dependencia" = ${filtros.dependencia}`);
  }
  if (filtros.categoria) {
    conditions.push(Prisma.sql`"categoria" = ${filtros.categoria}`);
  }
  if (filtros.zona) {
    conditions.push(Prisma.sql`"zona" = ${filtros.zona}`);
  }
  if (filtros.tipo) {
    conditions.push(Prisma.sql`"tipo" = ${filtros.tipo}::"TipoSolicitud"`);
  }
  if (filtros.desde) {
    conditions.push(Prisma.sql`"createdAt" >= ${new Date(filtros.desde)}`);
  }
  if (filtros.hasta) {
    conditions.push(Prisma.sql`"createdAt" <= ${new Date(filtros.hasta)}`);
  }
  if (conditions.length === 0) return Prisma.empty;
  return Prisma.sql`WHERE ${Prisma.join(conditions, " AND ")}`;
}

interface RawResumen {
  total: number;
  respondidas: number;
  a_tiempo: number;
  pct_a_tiempo: number | null;
  promedio_dias: number | null;
  mediana_dias: number | null;
  evaluadas: number;
  resueltas_completas: number;
  pct_resolucion: number | null;
  satisfaccion_promedio: number | null;
  reabiertas: number;
}

function mapearResumen(row: RawResumen): ResumenIndicadores {
  return {
    total: row.total,
    respondidas: row.respondidas,
    aTiempo: row.a_tiempo,
    pctATiempo: row.pct_a_tiempo ?? 0,
    promedioDias: row.promedio_dias,
    medianaDias: row.mediana_dias,
    evaluadas: row.evaluadas,
    resueltasCompletas: row.resueltas_completas,
    pctResolucion: row.pct_resolucion ?? 0,
    satisfaccionPromedio: row.satisfaccion_promedio,
    reabiertas: row.reabiertas,
  };
}

const SELECT_AGREGADOS = Prisma.sql`
  count(*)::int AS total,
  count(*) FILTER (WHERE "fechaRespuesta" IS NOT NULL)::int AS respondidas,
  count(*) FILTER (WHERE a_tiempo)::int AS a_tiempo,
  COALESCE(round(100.0 * count(*) FILTER (WHERE a_tiempo)
    / nullif(count(*) FILTER (WHERE "fechaRespuesta" IS NOT NULL), 0), 1), 0)::float8 AS pct_a_tiempo,
  round(avg(dias_respuesta)::numeric, 1)::float8 AS promedio_dias,
  round(percentile_cont(0.5) WITHIN GROUP (ORDER BY dias_respuesta)::numeric, 1)::float8 AS mediana_dias,
  count(*) FILTER (WHERE resuelto IS NOT NULL)::int AS evaluadas,
  count(*) FILTER (WHERE resuelto = 'COMPLETA')::int AS resueltas_completas,
  COALESCE(round(100.0 * count(*) FILTER (WHERE resuelto = 'COMPLETA')
    / nullif(count(*) FILTER (WHERE resuelto IS NOT NULL), 0), 1), 0)::float8 AS pct_resolucion,
  round(avg(satisfaccion)::numeric, 2)::float8 AS satisfaccion_promedio,
  count(*) FILTER (WHERE reabierta)::int AS reabiertas
`;

async function obtenerResumen(
  filtros: IndicadoresFiltros,
): Promise<ResumenIndicadores> {
  const where = construirWhere(filtros);
  const rows = await prisma.$queryRaw<RawResumen[]>(Prisma.sql`
    SELECT ${SELECT_AGREGADOS}
    FROM "vw_solicitudes_base"
    ${where}
  `);
  return mapearResumen(rows[0]);
}

async function obtenerPorDimension(
  dimension: keyof typeof DIMENSIONES,
  filtros: IndicadoresFiltros,
): Promise<FilaDimension[]> {
  const columna = Prisma.raw(DIMENSIONES[dimension]);
  const where = construirWhere(filtros);
  const orden =
    dimension === "periodo"
      ? Prisma.sql`ORDER BY ${columna} ASC`
      : Prisma.sql`ORDER BY total DESC, ${columna} ASC`;

  const rows = await prisma.$queryRaw<
    Array<RawResumen & { nombre: string | Date | null }>
  >(
    Prisma.sql`
      SELECT ${columna} AS nombre, ${SELECT_AGREGADOS}
      FROM "vw_solicitudes_base"
      ${where}
      GROUP BY ${columna}
      ${orden}
    `,
  );

  return rows
    .filter((row) => row.nombre !== null)
    .map((row) => ({
      nombre:
        row.nombre instanceof Date
          ? row.nombre.toISOString().slice(0, 7)
          : String(row.nombre),
      ...mapearResumen(row),
    }));
}

async function obtenerProblemas(
  filtros: IndicadoresFiltros,
): Promise<ProblemaRecurrente[]> {
  const where = construirWhere(filtros);
  const rows = await prisma.$queryRaw<
    Array<{
      categoria: string;
      dependencia: string | null;
      total: number;
      porcentaje: number;
    }>
  >(Prisma.sql`
    SELECT
      "categoria",
      "dependencia",
      count(*)::int AS total,
      COALESCE(round(100.0 * count(*) / nullif((SELECT count(*) FROM "vw_solicitudes_base" ${where}), 0), 1), 0)::float8 AS porcentaje
    FROM "vw_solicitudes_base"
    ${where}
    GROUP BY "categoria", "dependencia"
    HAVING count(*) >= 3
    ORDER BY total DESC
    LIMIT 10
  `);
  return rows;
}

export async function obtenerIndicadores(
  filtros: IndicadoresFiltros = {},
): Promise<IndicadoresResultado> {
  const [resumen, porDependencia, porCategoria, porZona, porPeriodo, problemas] =
    await Promise.all([
      obtenerResumen(filtros),
      obtenerPorDimension("dependencia", filtros),
      obtenerPorDimension("categoria", filtros),
      obtenerPorDimension("zona", filtros),
      obtenerPorDimension("periodo", filtros),
      obtenerProblemas(filtros),
    ]);

  return {
    resumen,
    porDependencia,
    porCategoria,
    porZona,
    porPeriodo,
    problemas,
  };
}

export async function obtenerOpcionesTransparencia() {
  const [dependencias, categorias, zonas] = await Promise.all([
    prisma.$queryRaw<Array<{ nombre: string }>>(
      Prisma.sql`SELECT DISTINCT "dependencia" AS nombre FROM "vw_solicitudes_base" WHERE "dependencia" IS NOT NULL ORDER BY 1`,
    ),
    prisma.$queryRaw<Array<{ nombre: string }>>(
      Prisma.sql`SELECT DISTINCT "categoria" AS nombre FROM "vw_solicitudes_base" ORDER BY 1`,
    ),
    prisma.$queryRaw<Array<{ nombre: string }>>(
      Prisma.sql`SELECT DISTINCT "zona" AS nombre FROM "vw_solicitudes_base" ORDER BY 1`,
    ),
  ]);
  return {
    dependencias: dependencias.map((d) => d.nombre),
    categorias: categorias.map((c) => c.nombre),
    zonas: zonas.map((z) => z.nombre),
  };
}
