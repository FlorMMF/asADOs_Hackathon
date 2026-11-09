"use client";

import type { EstadoSolicitud } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select, Textarea } from "@/components/ui/input";
import { ESTADOS } from "@/lib/constants";

export function CambiarEstadoForm({
  solicitudId,
  transiciones,
}: {
  solicitudId: string;
  transiciones: EstadoSolicitud[];
}) {
  const router = useRouter();
  const [estado, setEstado] = useState<EstadoSolicitud | "">(
    transiciones[0] ?? "",
  );
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  if (transiciones.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        No hay transiciones disponibles para el estado actual.
      </p>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!estado) return;
    setPending(true);
    setError(null);
    const response = await fetch(`/api/solicitudes/${solicitudId}/estado`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado, comentario: comentario || undefined }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error ?? "No fue posible cambiar el estado");
      setPending(false);
      return;
    }
    setComentario("");
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="Nuevo estado" htmlFor="estado">
        <Select
          id="estado"
          value={estado}
          onChange={(event) =>
            setEstado(event.target.value as EstadoSolicitud)
          }
        >
          {transiciones.map((opcion) => (
            <option key={opcion} value={opcion}>
              {ESTADOS[opcion]}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Comentario" htmlFor="comentario">
        <Textarea
          id="comentario"
          value={comentario}
          onChange={(event) => setComentario(event.target.value)}
          maxLength={1000}
        />
      </Field>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Actualizando…" : "Cambiar estado"}
      </Button>
    </form>
  );
}
