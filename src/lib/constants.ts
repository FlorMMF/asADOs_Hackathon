import type {
  EstadoModeracion,
  EstadoSolicitud,
  Rol,
  SubtipoQueja,
  TipoSolicitud,
} from "@prisma/client";

export const APP_NAME =
  process.env.NEXT_PUBLIC_APP_NAME ?? "Reporta Hermosillo";

export const ROLES: Record<Rol, string> = {
  CIUDADANO: "Ciudadano",
  CONSULTANTE: "Consultante",
  MODERADOR: "Moderador",
  PERSONAL_DEPENDENCIA: "Personal de dependencia",
  ADMIN_INSTITUCIONAL: "Admin institucional",
  TRANSPARENCIA: "Transparencia",
};

export const TIPOS_SOLICITUD: Record<TipoSolicitud, string> = {
  REPORTE: "Reporte ciudadano",
  SOLICITUD: "Solicitud / queja / reconocimiento",
  SOLICITUD_INFORMACION: "Solicitud de información",
  PROPUESTA: "Propuesta ciudadana",
  CONFIDENCIAL: "Denuncia confidencial",
};

export const TIPOS_CORTOS: Record<TipoSolicitud, string> = {
  REPORTE: "Reporte",
  SOLICITUD: "Solicitud",
  SOLICITUD_INFORMACION: "Información",
  PROPUESTA: "Propuesta",
  CONFIDENCIAL: "Confidencial",
};

export const SUBTIPOS_QUEJA: Record<SubtipoQueja, string> = {
  QUEJA: "Queja",
  RECONOCIMIENTO: "Reconocimiento",
  SUGERENCIA: "Sugerencia",
};

export const ESTADOS: Record<EstadoSolicitud, string> = {
  RECIBIDA: "Recibida",
  EN_CLASIFICACION: "En clasificación",
  EN_MODERACION: "En moderación",
  PUBLICADA: "Publicada",
  CANALIZADA: "Canalizada",
  RECIBIDA_DEPENDENCIA: "Recibida por dependencia",
  EN_ATENCION: "En atención",
  RESPONDIDA: "Respondida",
  CERRADA: "Cerrada",
  EN_REVISION: "En revisión",
  REABIERTA: "Reabierta",
  RECHAZADA: "Rechazada",
  CANCELADA: "Cancelada",
};

export const ESTADOS_MODERACION: Record<EstadoModeracion, string> = {
  PENDIENTE: "Pendiente",
  APROBADO: "Aprobado",
  RECHAZADO: "Rechazado",
};

export const ESTADO_COLORS: Record<EstadoSolicitud, string> = {
  RECIBIDA: "bg-slate-100 text-slate-700",
  EN_CLASIFICACION: "bg-amber-100 text-amber-800",
  EN_MODERACION: "bg-purple-100 text-purple-800",
  PUBLICADA: "bg-sky-100 text-sky-800",
  CANALIZADA: "bg-indigo-100 text-indigo-800",
  RECIBIDA_DEPENDENCIA: "bg-blue-100 text-blue-800",
  EN_ATENCION: "bg-cyan-100 text-cyan-800",
  RESPONDIDA: "bg-emerald-100 text-emerald-800",
  CERRADA: "bg-green-100 text-green-800",
  EN_REVISION: "bg-orange-100 text-orange-800",
  REABIERTA: "bg-red-100 text-red-800",
  RECHAZADA: "bg-rose-100 text-rose-800",
  CANCELADA: "bg-gray-100 text-gray-700",
};

export const MODERACION_COLORS: Record<EstadoModeracion, string> = {
  PENDIENTE: "bg-amber-100 text-amber-800",
  APROBADO: "bg-emerald-100 text-emerald-800",
  RECHAZADO: "bg-rose-100 text-rose-800",
};

export const ESTADOS_TERMINALES: EstadoSolicitud[] = [
  "CERRADA",
  "RECHAZADA",
  "CANCELADA",
];

export const ESTADOS_ABIERTOS: EstadoSolicitud[] = [
  "RECIBIDA",
  "EN_CLASIFICACION",
  "EN_MODERACION",
  "PUBLICADA",
  "CANALIZADA",
  "RECIBIDA_DEPENDENCIA",
  "EN_ATENCION",
  "RESPONDIDA",
  "EN_REVISION",
  "REABIERTA",
];
