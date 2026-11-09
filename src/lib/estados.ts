import type { EstadoSolicitud } from "@prisma/client";
import { ESTADOS_TERMINALES } from "./constants";

export type Estado = EstadoSolicitud;

const TRANSICIONES: Record<Estado, Estado[]> = {
  RECIBIDA: ["EN_CLASIFICACION", "EN_MODERACION", "RECHAZADA", "CANCELADA"],
  EN_CLASIFICACION: ["CANALIZADA", "EN_MODERACION", "RECHAZADA", "CANCELADA"],
  EN_MODERACION: ["PUBLICADA", "EN_CLASIFICACION", "RECHAZADA"],
  PUBLICADA: ["CANALIZADA", "EN_ATENCION", "CANCELADA"],
  CANALIZADA: ["RECIBIDA_DEPENDENCIA", "EN_ATENCION", "CANCELADA"],
  RECIBIDA_DEPENDENCIA: ["EN_ATENCION", "CANALIZADA", "CANCELADA"],
  EN_ATENCION: ["RESPONDIDA", "RECHAZADA", "CANCELADA"],
  RESPONDIDA: ["CERRADA", "EN_REVISION"],
  CERRADA: ["REABIERTA"],
  EN_REVISION: ["REABIERTA", "CERRADA"],
  REABIERTA: ["EN_ATENCION", "RESPONDIDA", "CERRADA"],
  RECHAZADA: [],
  CANCELADA: [],
};

export function transicionesPermitidas(estado: Estado): Estado[] {
  return TRANSICIONES[estado] ?? [];
}

export function puedeTransicionar(desde: Estado, hacia: Estado): boolean {
  return transicionesPermitidas(desde).includes(hacia);
}

export function esEstadoTerminal(estado: Estado): boolean {
  return ESTADOS_TERMINALES.includes(estado);
}

export interface SolicitudVencimiento {
  estado: Estado;
  fechaLimite: Date | null;
  fechaRespuesta: Date | null;
}

export function estaVencida(
  solicitud: SolicitudVencimiento,
  ahora: Date = new Date(),
): boolean {
  if (!solicitud.fechaLimite) return false;
  if (solicitud.fechaRespuesta) return false;
  if (esEstadoTerminal(solicitud.estado)) return false;
  return solicitud.fechaLimite.getTime() < ahora.getTime();
}

export function diasRestantes(
  fechaLimite: Date | null,
  ahora: Date = new Date(),
): number | null {
  if (!fechaLimite) return null;
  return Math.ceil(
    (fechaLimite.getTime() - ahora.getTime()) / 86_400_000,
  );
}

export function estadoDerivado(
  solicitud: SolicitudVencimiento,
  ahora: Date = new Date(),
): Estado | "VENCIDA" {
  return estaVencida(solicitud, ahora) ? "VENCIDA" : solicitud.estado;
}
