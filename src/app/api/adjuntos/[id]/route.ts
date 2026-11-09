import { readFile } from "node:fs/promises";
import { errorJson, usuarioActual } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { cargarSolicitud, puedeVerSolicitud } from "@/lib/solicitudes";
import { resolverArchivoSeguro } from "@/lib/uploads";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await usuarioActual();
  if (!user) return errorJson("No autenticado", 401);

  const adjunto = await prisma.adjunto.findUnique({
    where: { id },
    include: { respuesta: { select: { solicitudId: true } } },
  });
  if (!adjunto) return errorJson("Adjunto no encontrado", 404);

  const solicitudId = adjunto.solicitudId ?? adjunto.respuesta?.solicitudId;
  if (!solicitudId) return errorJson("Adjunto sin solicitud asociada", 404);

  const solicitud = await cargarSolicitud(solicitudId);
  if (!solicitud) return errorJson("Solicitud no encontrada", 404);
  if (!puedeVerSolicitud(user, solicitud)) {
    return errorJson("No tienes acceso a este adjunto", 403);
  }

  const esPropietario = user.id === solicitud.ciudadanoId;
  const esInterno =
    user.rol === "ADMIN_INSTITUCIONAL" ||
    user.rol === "PERSONAL_DEPENDENCIA" ||
    user.rol === "MODERADOR";
  if (
    adjunto.estadoModeracion !== "APROBADO" &&
    !esPropietario &&
    !esInterno
  ) {
    return errorJson("El adjunto aún no ha sido aprobado por moderación", 403);
  }

  try {
    const ruta = resolverArchivoSeguro(adjunto.path);
    const buffer = await readFile(ruta);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": adjunto.mime,
        "Content-Disposition": `inline; filename="${encodeURIComponent(adjunto.nombreOriginal)}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return errorJson("Archivo no disponible", 404);
  }
}
