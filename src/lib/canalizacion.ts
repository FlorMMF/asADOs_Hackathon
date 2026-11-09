export interface CategoriaCanalizable {
  id: string;
  nombre: string;
  dependenciaSugeridaId?: string | null;
}

export interface DependenciaCanalizable {
  id: string;
  nombre: string;
  competencias?: string | null;
  contacto?: string | null;
}

export interface SugerenciaCanalizacion {
  dependenciaId: string | null;
  dependenciaNombre: string | null;
  motivo: string;
}

const PALABRAS_IGNORADAS = new Set([
  "de",
  "del",
  "la",
  "las",
  "el",
  "los",
  "y",
  "en",
  "por",
  "para",
  "con",
  "un",
  "una",
]);

function normalizar(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function tokens(value: string): string[] {
  return normalizar(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2 && !PALABRAS_IGNORADAS.has(token));
}

export function sugerirDependencia(
  categoria: CategoriaCanalizable,
  zona: string | null,
  dependencias: DependenciaCanalizable[],
): SugerenciaCanalizacion {
  if (categoria.dependenciaSugeridaId) {
    const directa = dependencias.find(
      (dep) => dep.id === categoria.dependenciaSugeridaId,
    );
    return {
      dependenciaId: categoria.dependenciaSugeridaId,
      dependenciaNombre: directa?.nombre ?? null,
      motivo: `Categoría "${categoria.nombre}" tiene dependencia sugerida configurada.`,
    };
  }

  const needle = new Set([
    ...tokens(categoria.nombre),
    ...tokens(zona ?? ""),
  ]);

  let mejor: { dependencia: DependenciaCanalizable; score: number } | null = null;

  for (const dependencia of dependencias) {
    const haystack = new Set([
      ...tokens(dependencia.nombre),
      ...tokens(dependencia.competencias ?? ""),
    ]);
    let score = 0;
    for (const token of needle) {
      if (haystack.has(token)) score += 1;
    }
    if (!mejor || score > mejor.score) {
      mejor = { dependencia, score };
    }
  }

  if (mejor && mejor.score > 0) {
    return {
      dependenciaId: mejor.dependencia.id,
      dependenciaNombre: mejor.dependencia.nombre,
      motivo: `Coincidencia de competencias con la categoría "${categoria.nombre}"${zona ? ` y la zona ${zona}` : ""}.`,
    };
  }

  return {
    dependenciaId: null,
    dependenciaNombre: null,
    motivo: "Sin coincidencia automática; requiere clasificación manual.",
  };
}
