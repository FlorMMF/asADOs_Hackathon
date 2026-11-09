"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export function AdjuntoUploader({
  solicitudId,
  respuestaId,
  label = "Subir evidencias",
}: {
  solicitudId?: string;
  respuestaId?: string;
  label?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function upload() {
    const files = inputRef.current?.files;
    if (!files || files.length === 0) {
      setError("Selecciona al menos un archivo");
      return;
    }
    setPending(true);
    setError(null);
    setStatus(null);

    let subidos = 0;
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append("file", file);
      if (solicitudId) form.append("solicitudId", solicitudId);
      if (respuestaId) form.append("respuestaId", respuestaId);

      const response = await fetch("/api/adjuntos", {
        method: "POST",
        body: form,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? `No se pudo subir ${file.name}`);
        setPending(false);
        return;
      }
      subidos += 1;
    }

    setStatus(`${subidos} archivo(s) subidos. Quedan pendientes de moderación.`);
    setPending(false);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
        />
        <Button size="sm" variant="outline" onClick={upload} disabled={pending}>
          {pending ? "Subiendo…" : label}
        </Button>
      </div>
      <p className="text-xs text-slate-500">
        JPG, PNG, WEBP, GIF o PDF. Máximo 10 MB por archivo.
      </p>
      {status ? <p className="text-xs text-emerald-700">{status}</p> : null}
      {error ? <p className="text-xs text-rose-600">{error}</p> : null}
    </div>
  );
}
