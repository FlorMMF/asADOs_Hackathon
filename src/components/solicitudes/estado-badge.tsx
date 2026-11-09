import type { EstadoSolicitud } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { ESTADOS, ESTADO_COLORS } from "@/lib/constants";
import { estaVencida } from "@/lib/estados";

export function EstadoBadge({
  estado,
  fechaLimite,
  fechaRespuesta,
}: {
  estado: EstadoSolicitud;
  fechaLimite?: Date | null;
  fechaRespuesta?: Date | null;
}) {
  const vencida = estaVencida({
    estado,
    fechaLimite: fechaLimite ?? null,
    fechaRespuesta: fechaRespuesta ?? null,
  });
  if (vencida) {
    return <Badge className="bg-red-100 text-red-800">Vencida</Badge>;
  }
  return <Badge className={ESTADO_COLORS[estado]}>{ESTADOS[estado]}</Badge>;
}
