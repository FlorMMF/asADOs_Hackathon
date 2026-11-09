"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function ApoyoButton({
  solicitudId,
  inicial,
  umbral,
  yaApoyo,
  autenticado,
}: {
  solicitudId: string;
  inicial: number;
  umbral: number;
  yaApoyo: boolean;
  autenticado: boolean;
}) {
  const router = useRouter();
  const [total, setTotal] = useState(inicial);
  const [apoyado, setApoyado] = useState(yaApoyo);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const porcentaje = Math.min(100, Math.round((total / umbral) * 100));

  async function apoyar() {
    if (!autenticado) {
      router.push("/login?callbackUrl=/propuestas");
      return;
    }
    setPending(true);
    setError(null);
    const response = await fetch(`/api/solicitudes/${solicitudId}/apoyo`, {
      method: "POST",
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error ?? "No fue posible registrar tu apoyo");
      setPending(false);
      return;
    }
    setTotal(data.total);
    setApoyado(true);
    setPending(false);
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">
          {total} de {umbral} apoyos ({porcentaje}%)
        </span>
        <Button
          size="sm"
          variant={apoyado ? "outline" : "primary"}
          onClick={apoyar}
          disabled={pending || apoyado}
        >
          {apoyado ? "Ya apoyaste" : pending ? "Enviando…" : "Apoyar"}
        </Button>
      </div>
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
