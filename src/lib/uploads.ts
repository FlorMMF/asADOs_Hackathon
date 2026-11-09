import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const MIME_PERMITIDOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
]);

const EXTENSIONES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "application/pdf": ".pdf",
};

export function uploadDir(): string {
  return path.resolve(process.env.UPLOAD_DIR ?? "./uploads");
}

export function maxUploadBytes(): number {
  const mb = Number(process.env.MAX_UPLOAD_MB ?? 10);
  return (Number.isFinite(mb) ? mb : 10) * 1024 * 1024;
}

export interface ArchivoGuardado {
  path: string;
  nombreOriginal: string;
  mime: string;
  tamano: number;
}

export class UploadError extends Error {}

export function validarArchivo(file: File): void {
  if (file.size === 0) {
    throw new UploadError("El archivo está vacío");
  }
  if (file.size > maxUploadBytes()) {
    throw new UploadError(
      `El archivo supera el límite de ${Math.round(maxUploadBytes() / 1024 / 1024)} MB`,
    );
  }
  if (!MIME_PERMITIDOS.has(file.type)) {
    throw new UploadError(
      "Tipo de archivo no permitido (usa JPG, PNG, WEBP, GIF o PDF)",
    );
  }
}

export async function guardarArchivo(file: File): Promise<ArchivoGuardado> {
  validarArchivo(file);

  const extension = EXTENSIONES[file.type] ?? "";
  const nombre = `${randomUUID()}${extension}`;
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(dir, nombre), buffer);

  return {
    path: nombre,
    nombreOriginal: file.name.slice(0, 200),
    mime: file.type,
    tamano: file.size,
  };
}

export function resolverArchivoSeguro(relativePath: string): string {
  const base = uploadDir();
  const resolved = path.resolve(base, relativePath);
  if (!resolved.startsWith(`${base}${path.sep}`) && resolved !== base) {
    throw new UploadError("Ruta de archivo inválida");
  }
  return resolved;
}

export function mimePermitidoParaVista(mime: string): boolean {
  return MIME_PERMITIDOS.has(mime);
}
