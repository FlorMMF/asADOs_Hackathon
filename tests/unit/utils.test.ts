import { describe, expect, it } from "vitest";
import {
  daysBetween,
  initials,
  normalizeError,
  parseJson,
  truncate,
} from "@/lib/utils";

describe("utilidades", () => {
  it("genera iniciales de hasta dos palabras", () => {
    expect(initials("Ana María López")).toBe("AM");
    expect(initials("Hermosillo")).toBe("H");
  });

  it("trunca textos largos sin cortar en exceso", () => {
    expect(truncate("Hola mundo", 20)).toBe("Hola mundo");
    expect(truncate("Hola mundo", 4)).toBe("Hola…");
  });

  it("calcula días entre fechas", () => {
    expect(
      daysBetween(
        new Date("2026-11-01T00:00:00.000Z"),
        new Date("2026-11-11T00:00:00.000Z"),
      ),
    ).toBe(10);
  });

  it("parsea JSON con respaldo seguro", () => {
    expect(parseJson('{"a":1}', { a: 0 })).toEqual({ a: 1 });
    expect(parseJson("no-json", { a: 0 })).toEqual({ a: 0 });
    expect(parseJson(undefined, { a: 0 })).toEqual({ a: 0 });
  });

  it("normaliza errores", () => {
    expect(normalizeError(new Error("falló"))).toBe("falló");
    expect(normalizeError("otro")).toBe("Ocurrió un error inesperado");
  });
});
