"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";

export function RespuestaForm({ solicitudId }: { solicitudId: string }) {
  const router = useRouter();
  const [contenido, setContenido] = useState("");
  const [esConclusiva, setEsConclusiva] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch(`/api/solicitudes/${solicitudId}/respuestas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenido, esConclusiva }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error ?? "No fue posible registrar la respuesta");
      setPending(false);
      return;
    }
    setContenido("");
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field
        label="Respuesta institucional"
        htmlFor="contenido"
        hint="Una respuesta conclusiva marca la solicitud como RESPONDIDA (RN4)."
      >
        <Textarea
          id="contenido"
          value={contenido}
          onChange={(event) => setContenido(event.target.value)}
          minLength={10}
          maxLength={10000}
          required
        />
      </Field>
      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={esConclusiva}
          onChange={(event) => setEsConclusiva(event.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600"
        />
        Es una respuesta conclusiva
      </label>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Registrando…" : "Responder"}
      </Button>
    </form>
  );
}
