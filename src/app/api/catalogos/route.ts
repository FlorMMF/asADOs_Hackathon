import type { TipoSolicitud } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TIPOS = new Set([
  "REPORTE",
  "SOLICITUD",
  "SOLICITUD_INFORMACION",
  "PROPUESTA",
  "CONFIDENCIAL",
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tipoParam = searchParams.get("tipo");
  const tipo = tipoParam && TIPOS.has(tipoParam) ? tipoParam : null;

  const [categorias, zonas, dependencias] = await Promise.all([
    prisma.categoria.findMany({
      where: {
        activa: true,
        ...(tipo ? { tipoSolicitud: tipo as TipoSolicitud } : {}),
      },
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        tipoSolicitud: true,
        plazoDias: true,
        dependenciaSugeridaId: true,
        dependenciaSugerida: { select: { id: true, nombre: true } },
      },
    }),
    prisma.zona.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, colonias: true },
    }),
    prisma.dependencia.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, contacto: true },
    }),
  ]);

  return NextResponse.json({ categorias, zonas, dependencias });
}
