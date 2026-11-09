"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";

export function RevisionResolverForm({ revisionId }: { revisionId: string }) {
  const router = useRouter();
  const [respuesta, setRespuesta] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function resolver(estado: "ACEPTADA" | "RECHAZADA") {
    setPending(true);
    setError(null);
    const response = await fetch(`/api/revisiones/${revisionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado, respuesta }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error ?? "No fue posible resolver la revisión");
      setPending(false);
      return;
    }
    setRespuesta("");
    setPending(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <Field
        label="Respuesta de la revisión"
        htmlFor="respuesta-revision"
        hint="Aceptar reabre la solicitud; rechazar la cierra nuevamente."
      >
        <Textarea
          id="respuesta-revision"
          value={respuesta}
          onChange={(event) => setRespuesta(event.target.value)}
          minLength={10}
          maxLength={2000}
          required
        />
      </Field>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => resolver("ACEPTADA")}
          disabled={pending || respuesta.trim().length < 10}
        >
          Aceptar reapertura
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => resolver("RECHAZADA")}
          disabled={pending || respuesta.trim().length < 10}
        >
          Rechazar revisión
        </Button>
      </div>
    </div>
  );
}
