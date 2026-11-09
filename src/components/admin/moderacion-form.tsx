"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";

export function ModeracionForm({
  endpoint,
  titulo,
}: {
  endpoint: string;
  titulo: string;
}) {
  const router = useRouter();
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function enviar(estado: "APROBADO" | "RECHAZADO") {
    if (estado === "RECHAZADO" && motivo.trim().length === 0) {
      setError("Indica el motivo del rechazo (RN7).");
      return;
    }
    setPending(true);
    setError(null);
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado, motivo: motivo || undefined }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error ?? "No fue posible moderar el contenido");
      setPending(false);
      return;
    }
    setMotivo("");
    setPending(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {titulo}
      </p>
      <Field label="Motivo (obligatorio al rechazar)" htmlFor="motivo-moderacion">
        <Textarea
          id="motivo-moderacion"
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
          maxLength={1000}
        />
      </Field>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => enviar("APROBADO")}
          disabled={pending}
        >
          Aprobar
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => enviar("RECHAZADO")}
          disabled={pending}
        >
          Rechazar
        </Button>
      </div>
    </div>
  );
}
