import {
  EstadoSolicitud,
  ResultadoEvaluacion,
  SubtipoQueja,
  TipoSolicitud,
} from "@prisma/client";
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Correo inválido"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const registroSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(3, "El nombre debe tener al menos 3 caracteres")
    .max(120),
  email: z.string().trim().email("Correo inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .max(72),
});

export const solicitudSchema = z
  .object({
    tipo: z.nativeEnum(TipoSolicitud),
    categoriaId: z.string().min(1, "Selecciona una categoría"),
    zonaId: z.string().min(1, "Selecciona una zona"),
    titulo: z
      .string()
      .trim()
      .min(5, "El título debe tener al menos 5 caracteres")
      .max(140),
    descripcion: z
      .string()
      .trim()
      .min(20, "Describe el caso con al menos 20 caracteres")
      .max(5000),
    esPublico: z.boolean().optional().default(false),
    subtipoQueja: z.nativeEnum(SubtipoQueja).optional(),
    detalleInfo: z.string().trim().max(2000).optional(),
    prorroga: z.boolean().optional().default(false),
    ubicacion: z.string().trim().max(300).optional(),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    umbralApoyos: z.coerce.number().int().min(1).max(10000).optional(),
    restriccionAcceso: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipo === "SOLICITUD" && !data.subtipoQueja) {
      ctx.addIssue({
        code: "custom",
        path: ["subtipoQueja"],
        message: "Selecciona queja, reconocimiento o sugerencia",
      });
    }
    if (data.tipo === "SOLICITUD_INFORMACION" && !data.detalleInfo) {
      ctx.addIssue({
        code: "custom",
        path: ["detalleInfo"],
        message: "Indica la información solicitada",
      });
    }
    if (data.tipo === "PROPUESTA" && !data.umbralApoyos) {
      ctx.addIssue({
        code: "custom",
        path: ["umbralApoyos"],
        message: "Define el umbral de apoyos",
      });
    }
    if (data.tipo === "CONFIDENCIAL" && !data.restriccionAcceso) {
      ctx.addIssue({
        code: "custom",
        path: ["restriccionAcceso"],
        message: "Especifica la restricción de acceso",
      });
    }
  });

export const asignacionSchema = z.object({
  dependenciaId: z.string().min(1, "Selecciona una dependencia"),
  motivo: z
    .string()
    .trim()
    .min(10, "El motivo debe tener al menos 10 caracteres")
    .max(1000),
});

export const cambioEstadoSchema = z.object({
  estado: z.nativeEnum(EstadoSolicitud),
  comentario: z.string().trim().max(1000).optional(),
});

export const respuestaSchema = z.object({
  contenido: z
    .string()
    .trim()
    .min(10, "La respuesta debe tener al menos 10 caracteres")
    .max(10000),
  esConclusiva: z.boolean().optional().default(false),
});

export const evaluacionSchema = z.object({
  resuelto: z.nativeEnum(ResultadoEvaluacion),
  claridad: z.coerce.number().int().min(1).max(5),
  tiempo: z.coerce.number().int().min(1).max(5),
  satisfaccion: z.coerce.number().int().min(1).max(5),
  comentario: z.string().trim().max(2000).optional(),
});

export const revisionSchema = z.object({
  motivo: z
    .string()
    .trim()
    .min(10, "Explica el motivo de la revisión")
    .max(2000),
});

export const moderacionSchema = z
  .object({
    estado: z.enum(["APROBADO", "RECHAZADO"]),
    motivo: z.string().trim().max(1000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.estado === "RECHAZADO" && !data.motivo) {
      ctx.addIssue({
        code: "custom",
        path: ["motivo"],
        message: "Indica el motivo del rechazo",
      });
    }
  });

const filtroTexto = z.preprocess(
  (value) =>
    typeof value === "string" && value.trim() === "" ? undefined : value,
  z.string().trim().optional(),
);

export const transparenciaFiltrosSchema = z.object({
  dependencia: filtroTexto,
  categoria: filtroTexto,
  zona: filtroTexto,
  tipo: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z.nativeEnum(TipoSolicitud).optional(),
  ),
  desde: filtroTexto,
  hasta: filtroTexto,
});

export type SolicitudInput = z.infer<typeof solicitudSchema>;
export type EvaluacionInput = z.infer<typeof evaluacionSchema>;
export type TransparenciaFiltros = z.infer<typeof transparenciaFiltrosSchema>;
