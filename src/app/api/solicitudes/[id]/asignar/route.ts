import { NextResponse } from "next/server";
import { camposZod, errorJson, leerJson, usuarioActual } from "@/lib/api";
import { registrarAuditoria } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { esDeDependencia, cargarSolicitud } from "@/lib/solicitudes";
import { asignacionSchema } from "@/lib/validations";
import type { EstadoSolicitud } from "@prisma/client";

const ESTADOS_CANALIZABLES: EstadoSolicitud[] = [
  "RECIBIDA",
  "EN_CLASIFICACION",
  "EN_MODERACION",
  "PUBLICADA",
  "CANALIZADA",
  "RECIBIDA_DEPENDENCIA",
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

  const autorizado =
    user.rol === "ADMIN_INSTITUCIONAL" ||
    (user.rol === "PERSONAL_DEPENDENCIA" && esDeDependencia(user, solicitud));
  if (!autorizado) return errorJson("No puedes reasignar esta solicitud", 403);

  const body = await leerJson(request);
  const parsed = asignacionSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson("Datos inválidos", 422, {
      campos: camposZod(parsed.error),
    });
  }

  const dependencia = await prisma.dependencia.findUnique({
    where: { id: parsed.data.dependenciaId },
  });
  if (!dependencia) return errorJson("Dependencia inválida", 422);

  const nuevoEstado: EstadoSolicitud = ESTADOS_CANALIZABLES.includes(
    solicitud.estado,
  )
    ? "RECIBIDA_DEPENDENCIA"
    : solicitud.estado;

  await prisma.$transaction(async (tx) => {
    await tx.asignacion.updateMany({
      where: { solicitudId: id, activa: true },
      data: { activa: false },
    });

    await tx.asignacion.create({
      data: {
        solicitudId: id,
        dependenciaId: dependencia.id,
        asignadoPorId: user.id,
        motivo: parsed.data.motivo,
        activa: true,
      },
    });

    await tx.solicitud.update({
      where: { id },
      data: {
        dependenciaActualId: dependencia.id,
        estado: nuevoEstado,
      },
    });

    await tx.historialEstado.create({
      data: {
        solicitudId: id,
        estadoAnterior: solicitud.estado,
        estadoNuevo: nuevoEstado,
        usuarioId: user.id,
        comentario: `Canalización a ${dependencia.nombre}. Motivo: ${parsed.data.motivo}`,
      },
    });

    await registrarAuditoria(
      {
        actorId: user.id,
        accion: "ASIGNAR_DEPENDENCIA",
        entidad: "Solicitud",
        entidadId: id,
        detalle: {
          dependenciaId: dependencia.id,
          motivo: parsed.data.motivo,
          estadoAnterior: solicitud.estado,
          estadoNuevo: nuevoEstado,
        },
      },
      tx,
    );
  });

  return NextResponse.json({
    ok: true,
    dependencia: dependencia.nombre,
    estado: nuevoEstado,
  });
}
