"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select, Textarea } from "@/components/ui/input";

export function EvaluacionForm({ solicitudId }: { solicitudId: string }) {
  const router = useRouter();
  const [resuelto, setResuelto] = useState("COMPLETA");
  const [claridad, setClaridad] = useState(4);
  const [tiempo, setTiempo] = useState(4);
  const [satisfaccion, setSatisfaccion] = useState(4);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch(`/api/solicitudes/${solicitudId}/evaluacion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resuelto,
        claridad,
        tiempo,
        satisfaccion,
        comentario: comentario || undefined,
      }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error ?? "No fue posible guardar la evaluación");
      setPending(false);
      return;
    }
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="¿Se resolvió el problema?" htmlFor="resuelto">
          <Select
            id="resuelto"
            value={resuelto}
            onChange={(event) => setResuelto(event.target.value)}
          >
            <option value="COMPLETA">Sí, completamente</option>
            <option value="PARCIAL">Parcialmente</option>
            <option value="NO_RESUELTA">No se resolvió</option>
          </Select>
        </Field>
        <Field label="Satisfacción" htmlFor="satisfaccion">
          <Select
            id="satisfaccion"
            value={satisfaccion}
            onChange={(event) => setSatisfaccion(Number(event.target.value))}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value} / 5
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Claridad de la respuesta" htmlFor="claridad">
          <Select
            id="claridad"
            value={claridad}
            onChange={(event) => setClaridad(Number(event.target.value))}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value} / 5
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Tiempo de atención" htmlFor="tiempo">
          <Select
            id="tiempo"
            value={tiempo}
            onChange={(event) => setTiempo(Number(event.target.value))}
          >
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                {value} / 5
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Comentario (opcional)" htmlFor="comentario">
        <Textarea
          id="comentario"
          value={comentario}
          onChange={(event) => setComentario(event.target.value)}
          maxLength={2000}
        />
      </Field>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Guardando…" : "Enviar evaluación"}
      </Button>
    </form>
  );
}
