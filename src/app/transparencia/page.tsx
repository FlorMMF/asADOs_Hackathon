import { TransparenciaDashboard } from "@/components/transparencia/dashboard";
import { buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { TIPOS_SOLICITUD } from "@/lib/constants";
import {
  obtenerIndicadores,
  obtenerOpcionesTransparencia,
} from "@/lib/indicadores";
import { transparenciaFiltrosSchema } from "@/lib/validations";

export const dynamic = "force-dynamic";
export const metadata = { title: "Transparencia" };

export default async function TransparenciaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = Object.fromEntries(
    Object.entries(params).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
  const parsed = transparenciaFiltrosSchema.safeParse(raw);
  const filtros = parsed.success ? parsed.data : {};

  const [data, opciones] = await Promise.all([
    obtenerIndicadores(filtros),
    obtenerOpcionesTransparencia(),
  ]);

  return (
    <div>
      <PageHeader
        eyebrow="Datos abiertos"
        title="Panel de transparencia municipal"
        description="Ocho indicadores construidos exclusivamente con datos agregados. No se expone información personal (RN9)."
      />

      <Card className="mb-6 p-4">
        <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Dependencia
            </label>
            <select
              name="dependencia"
              defaultValue={filtros.dependencia ?? ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {opciones.dependencias.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Categoría
            </label>
            <select
              name="categoria"
              defaultValue={filtros.categoria ?? ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {opciones.categorias.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Zona
            </label>
            <select
              name="zona"
              defaultValue={filtros.zona ?? ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todas</option>
              {opciones.zonas.map((nombre) => (
                <option key={nombre} value={nombre}>
                  {nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Tipo
            </label>
            <select
              name="tipo"
              defaultValue={filtros.tipo ?? ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              {Object.entries(TIPOS_SOLICITUD).map(([tipo, label]) => (
                <option key={tipo} value={tipo}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Desde
            </label>
            <input
              type="date"
              name="desde"
              defaultValue={filtros.desde ?? ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Hasta
            </label>
            <input
              type="date"
              name="hasta"
              defaultValue={filtros.hasta ?? ""}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-6">
            <button type="submit" className={buttonClasses("primary", "md")}>
              Aplicar filtros
            </button>
            <a href="/transparencia" className={buttonClasses("ghost", "md")}>
              Limpiar
            </a>
            <p className="ml-auto text-xs text-slate-500">
              Los filtros se aplican sobre datos agregados.
            </p>
          </div>
        </form>
      </Card>

      <TransparenciaDashboard data={data} />
    </div>
  );
}
