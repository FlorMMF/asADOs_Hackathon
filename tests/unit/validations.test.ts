import { describe, expect, it } from "vitest";
import {
  evaluacionSchema,
  moderacionSchema,
  solicitudSchema,
  transparenciaFiltrosSchema,
} from "@/lib/validations";

const solicitudBase = {
  tipo: "REPORTE",
  categoriaId: "cat-1",
  zonaId: "zona-1",
  titulo: "Bache profundo",
  descripcion: "Hay un bache profundo frente a la escuela primaria.",
  esPublico: true,
};

describe("validación de solicitudes", () => {
  it("acepta un reporte completo", () => {
    const parsed = solicitudSchema.safeParse(solicitudBase);
    expect(parsed.success).toBe(true);
  });

  it("exige subtipo en quejas y solicitudes", () => {
    const parsed = solicitudSchema.safeParse({
      ...solicitudBase,
      tipo: "SOLICITUD",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.path).toEqual(["subtipoQueja"]);
    }
  });

  it("exige detalle en solicitudes de información", () => {
    const parsed = solicitudSchema.safeParse({
      ...solicitudBase,
      tipo: "SOLICITUD_INFORMACION",
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(parsed.error.issues[0]?.path).toEqual(["detalleInfo"]);
    }
  });

  it("exige umbral y restricción en propuestas y confidenciales", () => {
    expect(
      solicitudSchema.safeParse({ ...solicitudBase, tipo: "PROPUESTA" })
        .success,
    ).toBe(false);
    expect(
      solicitudSchema.safeParse({ ...solicitudBase, tipo: "CONFIDENCIAL" })
        .success,
    ).toBe(false);
  });

  it("rechaza títulos y descripciones demasiado cortos", () => {
    const parsed = solicitudSchema.safeParse({
      ...solicitudBase,
      titulo: "Hola",
      descripcion: "Corto",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("filtros de transparencia", () => {
  it("convierte cadenas vacías del formulario en undefined", () => {
    const parsed = transparenciaFiltrosSchema.safeParse({
      dependencia: "",
      categoria: "  ",
      zona: "",
      tipo: "",
      desde: "",
      hasta: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toEqual({
        dependencia: undefined,
        categoria: undefined,
        zona: undefined,
        tipo: undefined,
        desde: undefined,
        hasta: undefined,
      });
    }
  });

  it("conserva filtros válidos junto con campos vacíos", () => {
    const parsed = transparenciaFiltrosSchema.safeParse({
      dependencia: "Obras Públicas",
      tipo: "",
      zona: "Centro",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.dependencia).toBe("Obras Públicas");
      expect(parsed.data.zona).toBe("Centro");
      expect(parsed.data.tipo).toBeUndefined();
    }
  });

  it("rechaza tipos desconocidos", () => {
    const parsed = transparenciaFiltrosSchema.safeParse({ tipo: "OTRO" });
    expect(parsed.success).toBe(false);
  });
});

describe("moderación y evaluación", () => {
  it("exige motivo al rechazar", () => {
    expect(
      moderacionSchema.safeParse({ estado: "RECHAZADO" }).success,
    ).toBe(false);
    expect(
      moderacionSchema.safeParse({
        estado: "RECHAZADO",
        motivo: "Contiene datos personales",
      }).success,
    ).toBe(true);
    expect(moderacionSchema.safeParse({ estado: "APROBADO" }).success).toBe(
      true,
    );
  });

  it("limita las calificaciones a 1..5", () => {
    expect(
      evaluacionSchema.safeParse({
        resuelto: "COMPLETA",
        claridad: 5,
        tiempo: 1,
        satisfaccion: 3,
      }).success,
    ).toBe(true);
    expect(
      evaluacionSchema.safeParse({
        resuelto: "COMPLETA",
        claridad: 6,
        tiempo: 0,
        satisfaccion: 3,
      }).success,
    ).toBe(false);
  });
});
