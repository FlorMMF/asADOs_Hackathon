import { Prisma, type TipoSolicitud } from "@prisma/client";
import { prisma } from "./prisma";

export const PREFIJOS_FOLIO: Record<TipoSolicitud, string> = {
  REPORTE: "REP",
  SOLICITUD: "SOL",
  SOLICITUD_INFORMACION: "INF",
  PROPUESTA: "PRO",
  CONFIDENCIAL: "CON",
};

export function formatearFolio(
  anio: number,
  tipo: TipoSolicitud,
  consecutivo: number,
): string {
  return `HER-${anio}-${PREFIJOS_FOLIO[tipo]}-${String(consecutivo).padStart(6, "0")}`;
}

type CounterClient = Pick<Prisma.TransactionClient, "folioCounter">;

export async function generarFolio(
  tipo: TipoSolicitud,
  anio: number = new Date().getFullYear(),
  db: CounterClient = prisma,
): Promise<string> {
  const counter = await db.folioCounter.upsert({
    where: { anio_tipo: { anio, tipo } },
    create: { anio, tipo, ultimo: 1 },
    update: { ultimo: { increment: 1 } },
  });
  return formatearFolio(anio, tipo, counter.ultimo);
}
