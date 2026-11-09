import { NextResponse } from "next/server";
import { camposZod, errorJson, leerJson, usuarioActual } from "@/lib/api";
import { registrarAuditoria } from "@/lib/audit";
import { puedeTransicionar } from "@/lib/estados";
import { prisma } from "@/lib/prisma";
import { cargarSolicitud, puedeOperarSolicitud } from "@/lib/solicitudes";
import { cambioEstadoSchema } from "@/lib/validations";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await usuarioActual();
  if (!user) return errorJson("No autenticado", 401);

  const solicitud = await cargarSolicitud(id);
  if (!solicitud) return errorJson("Solicitud no encontrada", 404);
  if (!puedeOperarSolicitud(user, solicitud)) {
    return errorJson("No puedes operar esta solicitud", 403);
  }

  const body = await leerJson(request);
  const parsed = cambioEstadoSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson("Datos inválidos", 422, {
      campos: camposZod(parsed.error),
    });
  }

  const nuevoEstado = parsed.data.estado;

  if (nuevoEstado === "REABIERTA") {
    return errorJson(
      "La reapertura se gestiona desde una solicitud de revisión aprobada",
      422,
    );
  }

  if (!puedeTransicionar(solicitud.estado, nuevoEstado)) {
    return errorJson(
      `Transición no permitida: ${solicitud.estado} → ${nuevoEstado}`,
      422,
    );
  }

  if (nuevoEstado === "RESPONDIDA" || nuevoEstado === "CERRADA") {
    const respuestas = await prisma.respuestaInstitucional.count({
      where: { solicitudId: id },
    });
    if (respuestas === 0) {
      return errorJson(
        "No se puede concluir una solicitud sin respuesta institucional (RN4)",
        422,
      );
    }
  }

  const ahora = new Date();
  await prisma.$transaction(async (tx) => {
    await tx.solicitud.update({
      where: { id },
      data: {
        estado: nuevoEstado,
        ...(nuevoEstado === "RESPONDIDA" && !solicitud.fechaRespuesta
          ? { fechaRespuesta: ahora }
          : {}),
        ...(nuevoEstado === "CERRADA"
          ? {
              fechaCierre: ahora,
              atendidaPorInstitucion: true,
            }
          : {}),
      },
    });

    await tx.historialEstado.create({
      data: {
        solicitudId: id,
        estadoAnterior: solicitud.estado,
        estadoNuevo: nuevoEstado,
        usuarioId: user.id,
        comentario: parsed.data.comentario ?? "Cambio de estado manual.",
      },
    });

    await registrarAuditoria(
      {
        actorId: user.id,
        accion: "CAMBIAR_ESTADO",
        entidad: "Solicitud",
        entidadId: id,
        detalle: {
          estadoAnterior: solicitud.estado,
          estadoNuevo: nuevoEstado,
          comentario: parsed.data.comentario ?? null,
        },
      },
      tx,
    );
  });

  return NextResponse.json({ ok: true, estado: nuevoEstado });
}
