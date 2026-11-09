import { NextResponse } from "next/server";
import { camposZod, errorJson, leerJson, usuarioActual } from "@/lib/api";
import { registrarAuditoria } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { cargarSolicitud } from "@/lib/solicitudes";
import { evaluacionSchema } from "@/lib/validations";
import type { EstadoSolicitud } from "@prisma/client";

const ESTADOS_EVALUABLES: EstadoSolicitud[] = [
  "RESPONDIDA",
  "CERRADA",
  "REABIERTA",
  "EN_REVISION",
];

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
    return errorJson("Solo el ciudadano titular puede evaluar", 403);
  }
  if (solicitud.respuestas.length === 0) {
    return errorJson("Aún no hay respuesta institucional para evaluar", 422);
  }
  if (!ESTADOS_EVALUABLES.includes(solicitud.estado)) {
    return errorJson("La solicitud no está en un estado evaluable", 422);
  }

  const body = await leerJson(request);
  const parsed = evaluacionSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson("Datos inválidos", 422, {
      campos: camposZod(parsed.error),
    });
  }

  const resuelto = parsed.data.resuelto;
  const ahora = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      await tx.evaluacion.create({
        data: {
          solicitudId: id,
          resuelto,
          claridad: parsed.data.claridad,
          tiempo: parsed.data.tiempo,
          satisfaccion: parsed.data.satisfaccion,
          comentario: parsed.data.comentario,
        },
      });

      await tx.solicitud.update({
        where: { id },
        data: {
          resueltaPorCiudadano: resuelto === "COMPLETA",
          atendidaPorInstitucion: true,
          ...(solicitud.estado === "RESPONDIDA"
            ? { estado: "CERRADA", fechaCierre: ahora }
            : {}),
        },
      });

      if (solicitud.estado === "RESPONDIDA") {
        await tx.historialEstado.create({
          data: {
            solicitudId: id,
            estadoAnterior: "RESPONDIDA",
            estadoNuevo: "CERRADA",
            usuarioId: user.id,
            comentario: `Evaluación ciudadana: ${resuelto}.`,
          },
        });
      }

      await registrarAuditoria(
        {
          actorId: user.id,
          accion: "EVALUAR_SOLICITUD",
          entidad: "Solicitud",
          entidadId: id,
          detalle: {
            resuelto,
            claridad: parsed.data.claridad,
            tiempo: parsed.data.tiempo,
            satisfaccion: parsed.data.satisfaccion,
          },
        },
        tx,
      );
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return errorJson("Esta solicitud ya fue evaluada", 409);
    }
    throw error;
  }

  return NextResponse.json(
    { ok: true, resuelto, resueltaPorCiudadano: resuelto === "COMPLETA" },
    { status: 201 },
  );
}
