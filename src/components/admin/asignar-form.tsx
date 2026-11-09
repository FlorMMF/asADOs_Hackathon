"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Select, Textarea } from "@/components/ui/input";

export function AsignarForm({
  solicitudId,
  dependencias,
  dependenciaActualId,
}: {
  solicitudId: string;
  dependencias: Array<{ id: string; nombre: string }>;
  dependenciaActualId: string | null;
}) {
  const router = useRouter();
  const [dependenciaId, setDependenciaId] = useState(
    dependenciaActualId ?? dependencias[0]?.id ?? "",
  );
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const response = await fetch(`/api/solicitudes/${solicitudId}/asignar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dependenciaId, motivo }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error ?? "No fue posible canalizar la solicitud");
      setPending(false);
      return;
    }
    setMotivo("");
    setPending(false);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <Field label="Dependencia destino" htmlFor="dependencia">
        <Select
          id="dependencia"
          value={dependenciaId}
          onChange={(event) => setDependenciaId(event.target.value)}
        >
          {dependencias.map((dependencia) => (
            <option key={dependencia.id} value={dependencia.id}>
              {dependencia.nombre}
            </option>
          ))}
        </Select>
      </Field>
      <Field
        label="Motivo de canalización / reasignación"
        htmlFor="motivo"
        hint="El historial conserva todas las asignaciones (RN3)."
      >
        <Textarea
          id="motivo"
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
          minLength={10}
          maxLength={1000}
          required
        />
      </Field>
      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Canalizando…" : "Canalizar / reasignar"}
      </Button>
    </form>
  );
}
