import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

type AuditClient = Pick<Prisma.TransactionClient, "auditoria">;

export interface EventoAuditoria {
  actorId?: string | null;
  accion: string;
  entidad: string;
  entidadId: string;
  detalle?: Prisma.InputJsonValue | null;
}

export async function registrarAuditoria(
  evento: EventoAuditoria,
  db: AuditClient = prisma,
): Promise<void> {
  await db.auditoria.create({
    data: {
      actorId: evento.actorId ?? null,
      accion: evento.accion,
      entidad: evento.entidad,
      entidadId: evento.entidadId,
      detalle: evento.detalle ?? undefined,
    },
  });
}
