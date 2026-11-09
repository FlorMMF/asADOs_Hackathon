import { NextResponse } from "next/server";
import { errorJson, usuarioActual } from "@/lib/api";
import { estaVencida } from "@/lib/estados";
import {
  cargarSolicitud,
  esVisiblePublicamente,
  puedeVerSolicitud,
  resumenSolicitud,
} from "@/lib/solicitudes";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await usuarioActual();
  const solicitud = await cargarSolicitud(id);
  if (!solicitud) return errorJson("Solicitud no encontrada", 404);
  if (!puedeVerSolicitud(user, solicitud)) {
    return errorJson("No tienes acceso a esta solicitud", 403);
  }

  const esInterno =
    !!user &&
    (user.rol === "ADMIN_INSTITUCIONAL" ||
      user.rol === "PERSONAL_DEPENDENCIA" ||
      user.rol === "MODERADOR");
  const esPropietario = !!user && user.id === solicitud.ciudadanoId;
  const ocultarPendientes =
    esVisiblePublicamente(solicitud) && !esInterno && !esPropietario;

  return NextResponse.json({
    ...resumenSolicitud(solicitud),
    vencida: estaVencida(solicitud),
    descripcion: solicitud.descripcion,
    historial: solicitud.historial.map((h) => ({
      id: h.id,
      estadoAnterior: h.estadoAnterior,
      estadoNuevo: h.estadoNuevo,
      comentario: h.comentario,
      createdAt: h.createdAt,
      usuario: h.usuario?.nombre ?? null,
    })),
    respuestas: solicitud.respuestas.map((r) => ({
      id: r.id,
      contenido: r.contenido,
      esConclusiva: r.esConclusiva,
      createdAt: r.createdAt,
      usuario: r.usuario?.nombre ?? "Institución",
      adjuntos: r.adjuntos
        .filter(
          (a) => !ocultarPendientes || a.estadoModeracion === "APROBADO",
        )
        .map((a) => ({
          id: a.id,
          nombreOriginal: a.nombreOriginal,
          mime: a.mime,
        })),
    })),
    evaluacion: solicitud.evaluacion,
    adjuntos: solicitud.adjuntos
      .filter((a) => !ocultarPendientes || a.estadoModeracion === "APROBADO")
      .map((a) => ({
        id: a.id,
        nombreOriginal: a.nombreOriginal,
        mime: a.mime,
        estadoModeracion: a.estadoModeracion,
        createdAt: a.createdAt,
      })),
  });
}
