import { NextResponse } from "next/server";
import { errorJson, usuarioActual } from "@/lib/api";
import { registrarAuditoria } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { limitarPorIp } from "@/lib/rate-limit";
import {
  cargarSolicitud,
  esPropietario,
  puedeOperarSolicitud,
  type SolicitudCompleta,
} from "@/lib/solicitudes";
import {
  guardarArchivo,
  UploadError,
} from "@/lib/uploads";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const user = await usuarioActual();
  if (!user) return errorJson("No autenticado", 401);

  const limitado = limitarPorIp(request, "subir-adjunto", 20);
  if (limitado) return limitado;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorJson("Se esperaba multipart/form-data", 415);
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return errorJson("Archivo requerido", 422);
  }

  const solicitudId = form.get("solicitudId")?.toString() || null;
  const respuestaId = form.get("respuestaId")?.toString() || null;

  let solicitudCargada: SolicitudCompleta | null = null;
  if (solicitudId) {
    solicitudCargada = await cargarSolicitud(solicitudId);
    if (!solicitudCargada) return errorJson("Solicitud no encontrada", 404);
    const permitido =
      esPropietario(user, solicitudCargada) ||
      puedeOperarSolicitud(user, solicitudCargada);
    if (!permitido) return errorJson("No puedes adjuntar a esta solicitud", 403);
  } else if (respuestaId) {
    const respuesta = await prisma.respuestaInstitucional.findUnique({
      where: { id: respuestaId },
      select: { solicitudId: true },
    });
    if (!respuesta) return errorJson("Respuesta no encontrada", 404);
    solicitudCargada = await cargarSolicitud(respuesta.solicitudId);
    if (!solicitudCargada) return errorJson("Solicitud no encontrada", 404);
    if (!puedeOperarSolicitud(user, solicitudCargada)) {
      return errorJson("No puedes adjuntar a esta respuesta", 403);
    }
  } else {
    return errorJson("Indica solicitudId o respuestaId", 422);
  }

  let guardado;
  try {
    guardado = await guardarArchivo(file);
  } catch (error) {
    if (error instanceof UploadError) {
      return errorJson(error.message, 422);
    }
    console.error("Error guardando archivo", error);
    return errorJson("No fue posible guardar el archivo", 500);
  }

  const esPersonal =
    user.rol === "ADMIN_INSTITUCIONAL" ||
    user.rol === "PERSONAL_DEPENDENCIA";
  const estadoModeracion = esPersonal ? "APROBADO" : "PENDIENTE";

  const adjunto = await prisma.adjunto.create({
    data: {
      solicitudId: solicitudId ?? undefined,
      respuestaId: respuestaId ?? undefined,
      subidoPorId: user.id,
      path: guardado.path,
      nombreOriginal: guardado.nombreOriginal,
      mime: guardado.mime,
      tamano: guardado.tamano,
      estadoModeracion,
    },
    select: {
      id: true,
      nombreOriginal: true,
      mime: true,
      tamano: true,
      estadoModeracion: true,
    },
  });

  await registrarAuditoria({
    actorId: user.id,
    accion: "SUBIR_ADJUNTO",
    entidad: "Adjunto",
    entidadId: adjunto.id,
    detalle: {
      solicitudId: solicitudCargada.id,
      respuestaId,
      mime: guardado.mime,
      tamano: guardado.tamano,
    },
  });

  return NextResponse.json(adjunto, { status: 201 });
}
