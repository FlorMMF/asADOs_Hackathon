import { Prisma, type EstadoSolicitud } from "@prisma/client";
import { prisma } from "./prisma";
import { puedeVerConfidencial, type SessionUser } from "./rbac";

export const solicitudInclude = {
  categoria: { include: { dependenciaSugerida: true } },
  zona: true,
  ciudadano: { select: { id: true, nombre: true, email: true } },
  dependenciaActual: true,
  reporte: true,
  info: true,
  queja: true,
  propuesta: true,
  confidencialDetalle: true,
  adjuntos: { orderBy: { createdAt: "desc" } },
  asignaciones: {
    orderBy: { createdAt: "desc" },
    include: {
      dependencia: true,
      asignadoPor: { select: { id: true, nombre: true } },
    },
  },
  respuestas: {
    orderBy: { createdAt: "asc" },
    include: {
      usuario: { select: { id: true, nombre: true } },
      adjuntos: true,
    },
  },
  historial: {
    orderBy: { createdAt: "asc" },
    include: { usuario: { select: { id: true, nombre: true } } },
  },
  apoyos: { select: { ciudadanoId: true } },
  evaluacion: true,
  revisiones: {
    orderBy: { createdAt: "desc" },
    include: { solicitadoPor: { select: { id: true, nombre: true } } },
  },
} satisfies Prisma.SolicitudInclude;

export type SolicitudCompleta = Prisma.SolicitudGetPayload<{
  include: typeof solicitudInclude;
}>;

const ESTADOS_PUBLICOS: EstadoSolicitud[] = [
  "PUBLICADA",
  "CANALIZADA",
  "RECIBIDA_DEPENDENCIA",
  "EN_ATENCION",
  "RESPONDIDA",
  "CERRADA",
  "REABIERTA",
  "EN_REVISION",
];

export async function cargarSolicitud(
  id: string,
): Promise<SolicitudCompleta | null> {
  return prisma.solicitud.findUnique({
    where: { id },
    include: solicitudInclude,
  });
}

export async function cargarSolicitudPorFolio(
  folio: string,
): Promise<SolicitudCompleta | null> {
  return prisma.solicitud.findUnique({
    where: { folio },
    include: solicitudInclude,
  });
}

export function esPropietario(
  user: SessionUser | null,
  solicitud: Pick<SolicitudCompleta, "ciudadanoId">,
): boolean {
  return !!user && user.id === solicitud.ciudadanoId;
}

export function esDeDependencia(
  user: SessionUser | null,
  solicitud: Pick<SolicitudCompleta, "dependenciaActualId">,
): boolean {
  return (
    !!user?.dependenciaId &&
    solicitud.dependenciaActualId === user.dependenciaId
  );
}

export function esVisiblePublicamente(
  solicitud: Pick<
    SolicitudCompleta,
    "confidencial" | "esPublico" | "tipo" | "estado" | "reporte"
  >,
): boolean {
  if (solicitud.confidencial || !solicitud.esPublico) return false;
  if (!ESTADOS_PUBLICOS.includes(solicitud.estado)) return false;
  if (solicitud.tipo === "REPORTE") {
    return solicitud.reporte?.estadoModeracion === "APROBADO";
  }
  return true;
}

export function puedeVerSolicitud(
  user: SessionUser | null,
  solicitud: SolicitudCompleta,
): boolean {
  if (esVisiblePublicamente(solicitud)) return true;
  if (!user) return false;
  if (user.rol === "ADMIN_INSTITUCIONAL") return true;
  if (esPropietario(user, solicitud)) return true;

  if (user.rol === "PERSONAL_DEPENDENCIA") {
    if (!esDeDependencia(user, solicitud)) return false;
    if (solicitud.confidencial) {
      return puedeVerConfidencial(user.rol, true);
    }
    return true;
  }

  if (user.rol === "MODERADOR") {
    return solicitud.tipo === "REPORTE" && !solicitud.confidencial;
  }

  if (user.rol === "CONSULTANTE") {
    return !solicitud.confidencial && solicitud.esPublico;
  }

  return false;
}

export function puedeOperarSolicitud(
  user: SessionUser | null,
  solicitud: SolicitudCompleta,
): boolean {
  if (!user) return false;
  if (user.rol === "ADMIN_INSTITUCIONAL") return true;
  if (user.rol !== "PERSONAL_DEPENDENCIA") return false;
  if (!esDeDependencia(user, solicitud)) return false;
  if (solicitud.confidencial) {
    return puedeVerConfidencial(user.rol, true);
  }
  return true;
}

export function resumenSolicitud(solicitud: SolicitudCompleta) {
  return {
    id: solicitud.id,
    folio: solicitud.folio,
    tipo: solicitud.tipo,
    titulo: solicitud.titulo,
    estado: solicitud.estado,
    confidencial: solicitud.confidencial,
    esPublico: solicitud.esPublico,
    fechaLimite: solicitud.fechaLimite,
    fechaRespuesta: solicitud.fechaRespuesta,
    createdAt: solicitud.createdAt,
    categoria: solicitud.categoria.nombre,
    zona: solicitud.zona.nombre,
    dependencia: solicitud.dependenciaActual?.nombre ?? null,
    apoyos: solicitud.apoyos.length,
    resuelto: solicitud.evaluacion?.resuelto ?? null,
  };
}
