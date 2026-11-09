import { NextResponse } from "next/server";
import { camposZod, errorJson, leerJson, usuarioActual } from "@/lib/api";
import { registrarAuditoria } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { puedeModerar } from "@/lib/rbac";
import { moderacionSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await usuarioActual();
  if (!user) return errorJson("No autenticado", 401);
  if (!puedeModerar(user.rol)) {
    return errorJson("Tu rol no puede moderar contenido", 403);
  }

  const adjunto = await prisma.adjunto.findUnique({ where: { id } });
  if (!adjunto) return errorJson("Adjunto no encontrado", 404);

  const body = await leerJson(request);
  const parsed = moderacionSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson("Datos inválidos", 422, {
      campos: camposZod(parsed.error),
    });
  }

  await prisma.adjunto.update({
    where: { id },
    data: {
      estadoModeracion: parsed.data.estado,
      motivoModeracion: parsed.data.motivo ?? null,
    },
  });

  await registrarAuditoria({
    actorId: user.id,
    accion: "MODERAR_ADJUNTO",
    entidad: "Adjunto",
    entidadId: id,
    detalle: {
      estado: parsed.data.estado,
      motivo: parsed.data.motivo ?? null,
    },
  });

  return NextResponse.json({ ok: true, estado: parsed.data.estado });
}
