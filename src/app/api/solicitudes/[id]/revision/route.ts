import { NextResponse } from "next/server";
import { camposZod, errorJson, leerJson, usuarioActual } from "@/lib/api";
import { registrarAuditoria } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { cargarSolicitud } from "@/lib/solicitudes";
import { revisionSchema } from "@/lib/validations";

const ESTADOS_REVISABLES = ["CERRADA", "RESPONDIDA"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await usuarioActual();
  if (!user) return errorJson("No autenticado", 401);

  const solicitud = await cargarSolicitud(id);
  if (!solicitud) return errorJson("Solicitud no encontrada", 404);
  if (solicitud.ciudadanoId !== user.id) {
    return errorJson("Solo el ciudadano titular puede solicitar revisión", 403);
  }
  if (!ESTADOS_REVISABLES.includes(solicitud.estado)) {
    return errorJson(
      "Solo se puede solicitar revisión de una solicitud respondida o cerrada",
      422,
    );
  }
  if (solicitud.revisiones.some((rev) => rev.estado === "PENDIENTE")) {
    return errorJson("Ya existe una revisión pendiente para esta solicitud", 409);
  }

  const body = await leerJson(request);
  const parsed = revisionSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson("Datos inválidos", 422, {
      campos: camposZod(parsed.error),
    });
  }

  const revision = await prisma.$transaction(async (tx) => {
    const creada = await tx.revisionSolicitud.create({
      data: {
        solicitudId: id,
        motivo: parsed.data.motivo,
        estado: "PENDIENTE",
        solicitadoPorId: user.id,
      },
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
        comentario: "El ciudadano solicitó revisión o reapertura (RN6).",
      },
    });

    await registrarAuditoria(
      {
        actorId: user.id,
        accion: "SOLICITAR_REVISION",
        entidad: "Solicitud",
        entidadId: id,
        detalle: { revisionId: creada.id, motivo: parsed.data.motivo },
      },
      tx,
    );

    return creada;
  });

  return NextResponse.json({ id: revision.id, estado: "EN_REVISION" }, { status: 201 });
}
