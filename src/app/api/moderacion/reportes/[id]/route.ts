import { NextResponse } from "next/server";
import type { EstadoSolicitud } from "@prisma/client";
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
    return errorJson("Tu rol no puede moderar reportes", 403);
  }

  const reporte = await prisma.reporte.findUnique({
    where: { id },
    include: { solicitud: true },
  });
  if (!reporte) return errorJson("Reporte no encontrado", 404);

  const body = await leerJson(request);
  const parsed = moderacionSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson("Datos inválidos", 422, {
      campos: camposZod(parsed.error),
    });
  }

  const aprobado = parsed.data.estado === "APROBADO";
  const nuevoEstado: EstadoSolicitud = aprobado ? "PUBLICADA" : "RECHAZADA";

  await prisma.$transaction(async (tx) => {
    await tx.reporte.update({
      where: { id },
      data: {
        estadoModeracion: parsed.data.estado,
        motivoModeracion: parsed.data.motivo ?? null,
        moderadoPorId: user.id,
      },
    });

    await tx.solicitud.update({
      where: { id: reporte.solicitudId },
      data: {
        estado: nuevoEstado,
        esPublico: aprobado,
      },
    });

    await tx.historialEstado.create({
      data: {
        solicitudId: reporte.solicitudId,
        estadoAnterior: reporte.solicitud.estado,
        estadoNuevo: nuevoEstado,
        usuarioId: user.id,
        comentario: aprobado
          ? "Reporte aprobado por moderación y publicado."
          : `Reporte rechazado por moderación: ${parsed.data.motivo ?? "sin motivo"}`,
      },
    });

    await registrarAuditoria(
      {
        actorId: user.id,
        accion: "MODERAR_REPORTE",
        entidad: "Reporte",
        entidadId: id,
        detalle: {
          estado: parsed.data.estado,
          motivo: parsed.data.motivo ?? null,
          solicitudId: reporte.solicitudId,
        },
      },
      tx,
    );
  });

  return NextResponse.json({ ok: true, estado: parsed.data.estado });
}
