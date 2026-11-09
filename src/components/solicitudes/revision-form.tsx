"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";

export function RevisionForm({ solicitudId }: { solicitudId: string }) {
  const router = useRouter();
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch(`/api/solicitudes/${solicitudId}/revision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motivo }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error ?? "No fue posible solicitar la revisión");
      setPending(false);
      return;
    }
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field
        label="Motivo de la revisión o reapertura"
        htmlFor="motivo"
        hint="Explica por qué la respuesta no atendió el problema (RN6)."
      >
        <Textarea
          id="motivo"
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
          minLength={10}
          maxLength={2000}
          required
        />
      </Field>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" variant="outline" disabled={pending}>
        {pending ? "Enviando…" : "Solicitar revisión"}
      </Button>
    </form>
  );
}
