import { NextResponse } from "next/server";
import { camposZod, errorJson, leerJson, usuarioActual } from "@/lib/api";
import { registrarAuditoria } from "@/lib/audit";
import { ESTADOS_TERMINALES } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { cargarSolicitud, puedeOperarSolicitud } from "@/lib/solicitudes";
import { respuestaSchema } from "@/lib/validations";
import type { EstadoSolicitud } from "@prisma/client";

const ESTADOS_PARA_ATENCION: EstadoSolicitud[] = [
  "CANALIZADA",
  "RECIBIDA_DEPENDENCIA",
  "REABIERTA",
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
  if (!puedeOperarSolicitud(user, solicitud)) {
    return errorJson("No puedes responder esta solicitud", 403);
  }
  if (ESTADOS_TERMINALES.includes(solicitud.estado)) {
    return errorJson("La solicitud está cerrada o cancelada", 422);
  }

  const body = await leerJson(request);
  const parsed = respuestaSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson("Datos inválidos", 422, {
      campos: camposZod(parsed.error),
    });
  }

  const ahora = new Date();
  const esConclusiva = parsed.data.esConclusiva ?? false;
  const nuevoEstado: EstadoSolicitud = esConclusiva
    ? "RESPONDIDA"
    : ESTADOS_PARA_ATENCION.includes(solicitud.estado)
      ? "EN_ATENCION"
      : solicitud.estado;

  const respuesta = await prisma.$transaction(async (tx) => {
    const creada = await tx.respuestaInstitucional.create({
      data: {
        solicitudId: id,
        usuarioId: user.id,
        contenido: parsed.data.contenido,
        esConclusiva,
      },
    });

    await tx.solicitud.update({
      where: { id },
      data: {
        estado: nuevoEstado,
        ...(esConclusiva
          ? { fechaRespuesta: ahora, atendidaPorInstitucion: true }
          : {}),
      },
    });

    if (nuevoEstado !== solicitud.estado) {
      await tx.historialEstado.create({
        data: {
          solicitudId: id,
          estadoAnterior: solicitud.estado,
          estadoNuevo: nuevoEstado,
          usuarioId: user.id,
          comentario: esConclusiva
            ? "Respuesta conclusiva registrada por la dependencia."
            : "Respuesta parcial registrada; la solicitud continúa en atención.",
        },
      });
    }

    await registrarAuditoria(
      {
        actorId: user.id,
        accion: "RESPONDER_SOLICITUD",
        entidad: "Solicitud",
        entidadId: id,
        detalle: {
          respuestaId: creada.id,
          esConclusiva,
          estadoNuevo: nuevoEstado,
        },
      },
      tx,
    );

    return creada;
  });

  return NextResponse.json(
    { id: respuesta.id, estado: nuevoEstado },
    { status: 201 },
  );
}
