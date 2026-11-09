import { NextResponse } from "next/server";
import { camposZod, errorJson } from "@/lib/api";
import { obtenerIndicadores } from "@/lib/indicadores";
import { transparenciaFiltrosSchema } from "@/lib/validations";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const raw = Object.fromEntries(searchParams.entries());
  const parsed = transparenciaFiltrosSchema.safeParse(raw);
  if (!parsed.success) {
    return errorJson("Filtros inválidos", 422, {
      campos: camposZod(parsed.error),
    });
  }

  const indicadores = await obtenerIndicadores(parsed.data);
  return NextResponse.json(indicadores);
}
