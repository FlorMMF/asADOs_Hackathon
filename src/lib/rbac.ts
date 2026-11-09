import type { Rol } from "@prisma/client";

export interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
  rol: Rol;
  dependenciaId?: string | null;
}

const ADMIN_ROLES: Rol[] = [
  "MODERADOR",
  "PERSONAL_DEPENDENCIA",
  "ADMIN_INSTITUCIONAL",
  "TRANSPARENCIA",
];

export function puedeAccederAdmin(rol: Rol | undefined | null): boolean {
  return !!rol && ADMIN_ROLES.includes(rol);
}

export function esAdminInstitucional(rol: Rol | undefined | null): boolean {
  return rol === "ADMIN_INSTITUCIONAL";
}

export function puedeModerar(rol: Rol | undefined | null): boolean {
  return rol === "MODERADOR" || rol === "ADMIN_INSTITUCIONAL";
}

export function puedeResponder(rol: Rol | undefined | null): boolean {
  return rol === "PERSONAL_DEPENDENCIA" || rol === "ADMIN_INSTITUCIONAL";
}

export function puedeAsignar(rol: Rol | undefined | null): boolean {
  return rol === "PERSONAL_DEPENDENCIA" || rol === "ADMIN_INSTITUCIONAL";
}

export function puedeVerTransparencia(rol: Rol | undefined | null): boolean {
  return (
    rol === "TRANSPARENCIA" ||
    rol === "ADMIN_INSTITUCIONAL" ||
    rol === "PERSONAL_DEPENDENCIA" ||
    rol === "CONSULTANTE" ||
    rol === "CIUDADANO" ||
    rol === "MODERADOR"
  );
}

export function puedeVerConfidencial(
  rol: Rol | undefined | null,
  esDeDependenciaAsignada = false,
): boolean {
  if (rol === "ADMIN_INSTITUCIONAL") return true;
  return rol === "PERSONAL_DEPENDENCIA" && esDeDependenciaAsignada;
}

export function esCiudadano(rol: Rol | undefined | null): boolean {
  return rol === "CIUDADANO";
}

export function puedeGestionarCatalogo(rol: Rol | undefined | null): boolean {
  return rol === "ADMIN_INSTITUCIONAL";
}

export function puedeVerBandeja(
  rol: Rol | undefined | null,
  dependenciaId: string | null | undefined,
): boolean {
  if (rol === "ADMIN_INSTITUCIONAL" || rol === "MODERADOR") return true;
  if (rol === "PERSONAL_DEPENDENCIA") return !!dependenciaId;
  return false;
}

export function puedeOperarSolicitud(
  user: SessionUser,
  solicitud: {
    dependenciaActualId: string | null;
    confidencial: boolean;
  },
  esDeDependenciaAsignada: boolean,
): boolean {
  if (user.rol === "ADMIN_INSTITUCIONAL") return true;
  if (user.rol !== "PERSONAL_DEPENDENCIA") return false;
  if (solicitud.confidencial) {
    return puedeVerConfidencial(user.rol, esDeDependenciaAsignada);
  }
  return esDeDependenciaAsignada;
}

export function rutaInicialPorRol(rol: Rol | undefined | null): string {
  if (rol === "CIUDADANO" || !rol) return "/mi-panel";
  if (rol === "CONSULTANTE") return "/transparencia";
  return "/admin";
}
