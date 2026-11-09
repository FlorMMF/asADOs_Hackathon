import { NextResponse } from "next/server";
import { z } from "zod";
import { camposZod, errorJson, leerJson, usuarioActual } from "@/lib/api";
import { registrarAuditoria } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

const resolverSchema = z.object({
  estado: z.enum(["ACEPTADA", "RECHAZADA"]),
  respuesta: z
    .string()
    .trim()
    .min(10, "La respuesta debe tener al menos 10 caracteres")
    .max(2000),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await usuarioActual();
  if (!user) return errorJson("No autenticado", 401);
  if (user.rol !== "ADMIN_INSTITUCIONAL") {
    return errorJson("Solo administración institucional resuelve revisiones", 403);
  }

  const revision = await prisma.revisionSolicitud.findUnique({
    where: { id },
    include: { solicitud: true },
  });
  if (!revision) return errorJson("Revisión no encontrada", 404);
  if (revision.estado !== "PENDIENTE") {
    return errorJson("La revisión ya fue resuelta", 409);
  }

  const body = await leerJson(request);
  const parsed = resolverSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson("Datos inválidos", 422, {
      campos: camposZod(parsed.error),
    });
  }

  const nuevoEstadoSolicitud =
    parsed.data.estado === "ACEPTADA" ? "REABIERTA" : "CERRADA";

  await prisma.$transaction(async (tx) => {
    await tx.revisionSolicitud.update({
      where: { id },
      data: {
        estado: parsed.data.estado,
        respuesta: parsed.data.respuesta,
        resueltaAt: new Date(),
      },
    });

    await tx.solicitud.update({
      where: { id: revision.solicitudId },
      data: {
        estado: nuevoEstadoSolicitud,
        ...(parsed.data.estado === "ACEPTADA"
          ? { resueltaPorCiudadano: false }
          : { fechaCierre: new Date(), atendidaPorInstitucion: true }),
      },
    });

    await tx.historialEstado.create({
      data: {
        solicitudId: revision.solicitudId,
        estadoAnterior: revision.solicitud.estado,
        estadoNuevo: nuevoEstadoSolicitud,
        usuarioId: user.id,
        comentario: `Revisión ${parsed.data.estado.toLowerCase()}: ${parsed.data.respuesta}`,
      },
    });

    await registrarAuditoria(
      {
        actorId: user.id,
        accion: "RESOLVER_REVISION",
        entidad: "RevisionSolicitud",
        entidadId: id,
        detalle: {
          estado: parsed.data.estado,
          solicitudId: revision.solicitudId,
        },
      },
      tx,
    );
  });

  return NextResponse.json({
    ok: true,
    estado: parsed.data.estado,
    solicitudEstado: nuevoEstadoSolicitud,
  });
}
