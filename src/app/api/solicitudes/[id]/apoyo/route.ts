import { NextResponse } from "next/server";
import { errorJson, usuarioActual } from "@/lib/api";
import { registrarAuditoria } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { cargarSolicitud, esVisiblePublicamente } from "@/lib/solicitudes";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await usuarioActual();
  if (!user) return errorJson("Inicia sesión para apoyar una propuesta", 401);

  const solicitud = await cargarSolicitud(id);
  if (!solicitud) return errorJson("Propuesta no encontrada", 404);
  if (solicitud.tipo !== "PROPUESTA" || !solicitud.propuesta) {
    return errorJson("La solicitud no es una propuesta", 422);
  }
  if (!esVisiblePublicamente(solicitud)) {
    return errorJson("La propuesta no está abierta para apoyos", 422);
  }

  try {
    await prisma.apoyo.create({
      data: { solicitudId: id, ciudadanoId: user.id },
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return errorJson("Ya apoyaste esta propuesta", 409);
    }
    throw error;
  }

  const total = await prisma.apoyo.count({ where: { solicitudId: id } });
  const umbral = solicitud.propuesta.umbralApoyos;
  const alcanzado = total >= umbral;

  if (alcanzado && solicitud.propuesta.etapa === "RECOLECTANDO_APOYOS") {
    await prisma.$transaction(async (tx) => {
      await tx.propuesta.update({
        where: { solicitudId: id },
        data: { etapa: "EN_REVISION" },
      });
      await tx.solicitud.update({
        where: { id },
        data: { estado: "EN_REVISION" },
      });
      await tx.historialEstado.create({
        data: {
          solicitudId: id,
          estadoAnterior: solicitud.estado,
          estadoNuevo: "EN_REVISION",
          usuarioId: user.id,
          comentario: `Se alcanzó el umbral de ${umbral} apoyos; la propuesta pasa a revisión institucional.`,
        },
      });
      await registrarAuditoria(
        {
          actorId: user.id,
          accion: "UMBRAL_PROPUESTA",
          entidad: "Solicitud",
          entidadId: id,
          detalle: { total, umbral },
        },
        tx,
      );
    });
  }

  await registrarAuditoria({
    actorId: user.id,
    accion: "APOYAR_PROPUESTA",
    entidad: "Solicitud",
    entidadId: id,
    detalle: { total, umbral },
  });

  return NextResponse.json({ ok: true, total, umbral, alcanzado });
}
