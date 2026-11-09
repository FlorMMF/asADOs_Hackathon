import type { TipoSolicitud } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { TIPOS_CORTOS } from "@/lib/constants";

const COLORES: Record<TipoSolicitud, string> = {
  REPORTE: "bg-sky-100 text-sky-800",
  SOLICITUD: "bg-indigo-100 text-indigo-800",
  SOLICITUD_INFORMACION: "bg-amber-100 text-amber-800",
  PROPUESTA: "bg-emerald-100 text-emerald-800",
  CONFIDENCIAL: "bg-slate-800 text-white",
};

export function TipoBadge({ tipo }: { tipo: TipoSolicitud }) {
  return <Badge className={COLORES[tipo]}>{TIPOS_CORTOS[tipo]}</Badge>;
}
