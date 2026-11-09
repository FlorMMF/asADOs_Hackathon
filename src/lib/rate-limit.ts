import { NextResponse } from "next/server";

interface Entrada {
  count: number;
  reset: number;
}

const buckets = new Map<string, Entrada>();
const MAX_ENTRADAS = 5_000;

function claveIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local";
  return ip;
}

export function limitarPorIp(
  request: Request,
  nombre: string,
  limite = 30,
  ventanaMs = 60_000,
): NextResponse | null {
  const ahora = Date.now();

  if (buckets.size > MAX_ENTRADAS) {
    for (const [clave, entrada] of buckets) {
      if (entrada.reset <= ahora) buckets.delete(clave);
    }
  }

  const clave = `${nombre}:${claveIp(request)}`;
  const actual = buckets.get(clave);

  if (!actual || actual.reset <= ahora) {
    buckets.set(clave, { count: 1, reset: ahora + ventanaMs });
    return null;
  }

  actual.count += 1;
  if (actual.count <= limite) return null;

  const segundos = Math.max(1, Math.ceil((actual.reset - ahora) / 1000));
  return NextResponse.json(
    { error: "Demasiadas solicitudes. Intenta de nuevo en unos segundos." },
    {
      status: 429,
      headers: { "Retry-After": String(segundos) },
    },
  );
}
