"use client";

import type { SubtipoQueja, TipoSolicitud } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { SUBTIPOS_QUEJA, TIPOS_SOLICITUD } from "@/lib/constants";

export interface CategoriaOpcion {
  id: string;
  nombre: string;
  tipoSolicitud: TipoSolicitud;
  plazoDias: number;
  dependenciaSugerida: { id: string; nombre: string } | null;
}

export interface ZonaOpcion {
  id: string;
  nombre: string;
  colonias: string[];
}

const DESCRIPCIONES: Record<TipoSolicitud, string> = {
  REPORTE:
    "Problema urbano con ubicación y evidencia. Pasa por moderación antes de publicarse.",
  SOLICITUD:
    "Queja, reconocimiento o sugerencia dirigida a una dependencia municipal.",
  SOLICITUD_INFORMACION:
    "Petición de información pública con plazo y seguimiento.",
  PROPUESTA:
    "Idea ciudadana que se vuelve prioridad al alcanzar el umbral de apoyos.",
  CONFIDENCIAL:
    "Denuncia con acceso restringido; solo la ven titulares y personal autorizado.",
};

const PASOS = ["Tipo", "Detalles", "Evidencias"];

export function NuevaSolicitudWizard({
  categorias,
  zonas,
  tipoInicial,
}: {
  categorias: CategoriaOpcion[];
  zonas: ZonaOpcion[];
  tipoInicial?: TipoSolicitud;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);

  const [paso, setPaso] = useState(tipoInicial ? 2 : 1);
  const [tipo, setTipo] = useState<TipoSolicitud | null>(tipoInicial ?? null);
  const [categoriaId, setCategoriaId] = useState("");
  const [zonaId, setZonaId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [esPublico, setEsPublico] = useState(true);
  const [subtipoQueja, setSubtipoQueja] = useState<SubtipoQueja>("QUEJA");
  const [detalleInfo, setDetalleInfo] = useState("");
  const [umbralApoyos, setUmbralApoyos] = useState(50);
  const [restriccionAcceso, setRestriccionAcceso] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const categoriasFiltradas = useMemo(
    () => categorias.filter((item) => item.tipoSolicitud === tipo),
    [categorias, tipo],
  );
  const zonaSeleccionada = zonas.find((zona) => zona.id === zonaId);
  const categoriaSeleccionada = categorias.find(
    (categoria) => categoria.id === categoriaId,
  );

  function elegirTipo(nuevo: TipoSolicitud) {
    setTipo(nuevo);
    setCategoriaId("");
    setEsPublico(nuevo === "REPORTE" || nuevo === "PROPUESTA");
    setPaso(2);
    setError(null);
  }

  function validarDetalles(): string | null {
    if (!tipo) return "Selecciona un tipo de solicitud.";
    if (!categoriaId) return "Selecciona una categoría.";
    if (!zonaId) return "Selecciona una zona.";
    if (titulo.trim().length < 5) return "El título debe tener al menos 5 caracteres.";
    if (descripcion.trim().length < 20)
      return "La descripción debe tener al menos 20 caracteres.";
    if (tipo === "SOLICITUD_INFORMACION" && !detalleInfo.trim())
      return "Indica la información solicitada.";
    if (tipo === "CONFIDENCIAL" && !restriccionAcceso.trim())
      return "Especifica la restricción de acceso.";
    return null;
  }

  async function enviar() {
    const problema = validarDetalles();
    if (problema) {
      setError(problema);
      setPaso(2);
      return;
    }
    if (!tipo) return;

    setPending(true);
    setError(null);

    const payload: Record<string, unknown> = {
      tipo,
      categoriaId,
      zonaId,
      titulo,
      descripcion,
      esPublico,
    };
    if (tipo === "SOLICITUD") payload.subtipoQueja = subtipoQueja;
    if (tipo === "SOLICITUD_INFORMACION") payload.detalleInfo = detalleInfo;
    if (tipo === "PROPUESTA") payload.umbralApoyos = umbralApoyos;
    if (tipo === "CONFIDENCIAL") payload.restriccionAcceso = restriccionAcceso;
    if (tipo === "REPORTE") {
      if (ubicacion) payload.ubicacion = ubicacion;
      if (lat) payload.lat = Number(lat);
      if (lng) payload.lng = Number(lng);
    }

    const response = await fetch("/api/solicitudes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const detalle = Array.isArray(data?.campos)
        ? data.campos.map((campo: { message: string }) => campo.message).join(" · ")
        : null;
      setError(detalle ?? data?.error ?? "No fue posible crear la solicitud");
      setPending(false);
      return;
    }

    const archivos = fileInput.current?.files;
    if (archivos && archivos.length > 0) {
      for (const file of Array.from(archivos)) {
        const form = new FormData();
        form.append("file", file);
        form.append("solicitudId", data.id);
        await fetch("/api/adjuntos", { method: "POST", body: form });
      }
    }

    router.push(`/mi-panel/${data.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <ol className="flex items-center gap-2 text-xs font-medium">
        {PASOS.map((nombre, index) => {
          const numero = index + 1;
          const activo = paso === numero;
          const completado = paso > numero;
          return (
            <li key={nombre} className="flex items-center gap-2">
              <span
                className={
                  activo
                    ? "flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white"
                    : completado
                      ? "flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
                      : "flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500"
                }
              >
                {completado ? "✓" : numero}
              </span>
              <span className={activo ? "text-slate-900" : "text-slate-500"}>
                {nombre}
              </span>
              {index < PASOS.length - 1 ? (
                <span className="mx-1 h-px w-6 bg-slate-200" />
              ) : null}
            </li>
          );
        })}
      </ol>

      {paso === 1 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(TIPOS_SOLICITUD) as TipoSolicitud[]).map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => elegirTipo(opcion)}
              className="rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-emerald-400 hover:shadow"
            >
              <p className="text-sm font-semibold text-slate-900">
                {TIPOS_SOLICITUD[opcion]}
              </p>
              <p className="mt-1 text-xs text-slate-600">
                {DESCRIPCIONES[opcion]}
              </p>
            </button>
          ))}
        </div>
      ) : null}

      {paso === 2 && tipo ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-100 text-emerald-800">
              {TIPOS_SOLICITUD[tipo]}
            </Badge>
            <button
              type="button"
              onClick={() => setPaso(1)}
              className="text-xs font-medium text-slate-500 hover:text-slate-800"
            >
              Cambiar tipo
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoría" htmlFor="categoria">
              <Select
                id="categoria"
                value={categoriaId}
                onChange={(event) => setCategoriaId(event.target.value)}
              >
                <option value="">Selecciona…</option>
                {categoriasFiltradas.map((categoria) => (
                  <option key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field
              label="Zona"
              htmlFor="zona"
              hint={
                zonaSeleccionada
                  ? zonaSeleccionada.colonias.join(", ")
                  : undefined
              }
            >
              <Select
                id="zona"
                value={zonaId}
                onChange={(event) => setZonaId(event.target.value)}
              >
                <option value="">Selecciona…</option>
                {zonas.map((zona) => (
                  <option key={zona.id} value={zona.id}>
                    {zona.nombre}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {categoriaSeleccionada?.dependenciaSugerida ? (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              Dependencia sugerida:{" "}
              <strong>{categoriaSeleccionada.dependenciaSugerida.nombre}</strong>{" "}
              · plazo estimado {categoriaSeleccionada.plazoDias} días.
            </p>
          ) : null}

          <Field label="Título" htmlFor="titulo">
            <Input
              id="titulo"
              value={titulo}
              onChange={(event) => setTitulo(event.target.value)}
              maxLength={140}
              placeholder="Resumen breve del caso"
              required
            />
          </Field>

          <Field
            label="Descripción"
            htmlFor="descripcion"
            hint="Incluye qué ocurre, desde cuándo y cualquier detalle útil."
          >
            <Textarea
              id="descripcion"
              value={descripcion}
              onChange={(event) => setDescripcion(event.target.value)}
              minLength={20}
              maxLength={5000}
              required
            />
          </Field>

          {tipo === "SOLICITUD" ? (
            <Field label="Tipo de solicitud" htmlFor="subtipo">
              <Select
                id="subtipo"
                value={subtipoQueja}
                onChange={(event) =>
                  setSubtipoQueja(event.target.value as SubtipoQueja)
                }
              >
                {Object.entries(SUBTIPOS_QUEJA).map(([valor, label]) => (
                  <option key={valor} value={valor}>
                    {label}
                  </option>
                ))}
              </Select>
            </Field>
          ) : null}

          {tipo === "SOLICITUD_INFORMACION" ? (
            <Field label="Información solicitada" htmlFor="detalle">
              <Textarea
                id="detalle"
                value={detalleInfo}
                onChange={(event) => setDetalleInfo(event.target.value)}
                maxLength={2000}
              />
            </Field>
          ) : null}

          {tipo === "PROPUESTA" ? (
            <Field
              label="Umbral de apoyos"
              htmlFor="umbral"
              hint="Número de apoyos necesarios para pasar a revisión institucional."
            >
              <Input
                id="umbral"
                type="number"
                min={1}
                max={10000}
                value={umbralApoyos}
                onChange={(event) =>
                  setUmbralApoyos(Number(event.target.value))
                }
              />
            </Field>
          ) : null}

          {tipo === "CONFIDENCIAL" ? (
            <Field
              label="Restricción de acceso"
              htmlFor="restriccion"
              hint="Explica quién debe poder consultar esta denuncia."
            >
              <Textarea
                id="restriccion"
                value={restriccionAcceso}
                onChange={(event) => setRestriccionAcceso(event.target.value)}
                maxLength={500}
              />
            </Field>
          ) : null}

          {tipo === "REPORTE" ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Ubicación" htmlFor="ubicacion" className="sm:col-span-3">
                <Input
                  id="ubicacion"
                  value={ubicacion}
                  onChange={(event) => setUbicacion(event.target.value)}
                  placeholder="Calle, colonia y referencias"
                  maxLength={300}
                />
              </Field>
              <Field label="Latitud (opcional)" htmlFor="lat">
                <Input
                  id="lat"
                  type="number"
                  step="0.000001"
                  value={lat}
                  onChange={(event) => setLat(event.target.value)}
                />
              </Field>
              <Field label="Longitud (opcional)" htmlFor="lng">
                <Input
                  id="lng"
                  type="number"
                  step="0.000001"
                  value={lng}
                  onChange={(event) => setLng(event.target.value)}
                />
              </Field>
            </div>
          ) : null}

          {tipo === "REPORTE" || tipo === "PROPUESTA" ? (
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={esPublico}
                onChange={(event) => setEsPublico(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600"
              />
              Permitir publicación en el feed público (con moderación).
            </label>
          ) : null}

          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setPaso(1)}>
              Atrás
            </Button>
            <Button
              onClick={() => {
                const problema = validarDetalles();
                if (problema) {
                  setError(problema);
                  return;
                }
                setError(null);
                setPaso(3);
              }}
            >
              Continuar
            </Button>
          </div>
        </div>
      ) : null}

      {paso === 3 && tipo ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
            <p className="font-semibold text-slate-900">{titulo}</p>
            <p className="mt-1 text-slate-600">{descripcion}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded bg-slate-100 px-2 py-0.5">
                {TIPOS_SOLICITUD[tipo]}
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5">
                {categoriaSeleccionada?.nombre}
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5">
                {zonaSeleccionada?.nombre}
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-800">
              Evidencias (opcional)
            </p>
            <p className="mb-2 text-xs text-slate-500">
              Las evidencias nunca se publican de forma directa; pasan por
              moderación y se sirven por ruta autenticada.
            </p>
            <input
              ref={fileInput}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
              className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
            />
          </div>

          {error ? (
            <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setPaso(2)}>
              Atrás
            </Button>
            <Button onClick={enviar} disabled={pending}>
              {pending ? "Enviando…" : "Registrar solicitud"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
