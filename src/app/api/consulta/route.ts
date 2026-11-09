import { NextResponse } from "next/server";
import { errorJson, usuarioActual } from "@/lib/api";
import { estaVencida } from "@/lib/estados";
import { limitarPorIp } from "@/lib/rate-limit";
import {
  cargarSolicitudPorFolio,
  puedeVerSolicitud,
} from "@/lib/solicitudes";

export async function GET(request: Request) {
  const limitado = limitarPorIp(request, "consulta-folio", 60);
  if (limitado) return limitado;

  const { searchParams } = new URL(request.url);
  const folio = searchParams.get("folio")?.trim().toUpperCase();
  if (!folio) return errorJson("Indica un folio", 422);

  const user = await usuarioActual();
  const solicitud = await cargarSolicitudPorFolio(folio);
  if (!solicitud || !puedeVerSolicitud(user, solicitud)) {
    return errorJson(
      "No encontramos una solicitud consultable con ese folio",
      404,
    );
  }

  return NextResponse.json({
    folio: solicitud.folio,
    tipo: solicitud.tipo,
    titulo: solicitud.titulo,
    descripcion: solicitud.descripcion,
    estado: solicitud.estado,
    vencida: estaVencida(solicitud),
    categoria: solicitud.categoria.nombre,
    zona: solicitud.zona.nombre,
    dependencia: solicitud.dependenciaActual?.nombre ?? null,
    fechaLimite: solicitud.fechaLimite,
    fechaRespuesta: solicitud.fechaRespuesta,
    createdAt: solicitud.createdAt,
    historial: solicitud.historial.map((h) => ({
      estadoAnterior: h.estadoAnterior,
      estadoNuevo: h.estadoNuevo,
      comentario: h.comentario,
      createdAt: h.createdAt,
    })),
    respuestas: solicitud.respuestas.map((r) => ({
      contenido: r.contenido,
      esConclusiva: r.esConclusiva,
      createdAt: r.createdAt,
    })),
    evaluacion: solicitud.evaluacion
      ? {
          resuelto: solicitud.evaluacion.resuelto,
          satisfaccion: solicitud.evaluacion.satisfaccion,
        }
      : null,
  });
}
