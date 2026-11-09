import { describe, expect, it } from "vitest";
import { formatearFolio, PREFIJOS_FOLIO } from "@/lib/folio";

describe("folio institucional", () => {
  it("usa prefijos por tipo de solicitud", () => {
    expect(PREFIJOS_FOLIO).toEqual({
      REPORTE: "REP",
      SOLICITUD: "SOL",
      SOLICITUD_INFORMACION: "INF",
      PROPUESTA: "PRO",
      CONFIDENCIAL: "CON",
    });
  });

  it("formatea con año y consecutivo de seis dígitos", () => {
    expect(formatearFolio(2026, "REPORTE", 1)).toBe("HER-2026-REP-000001");
    expect(formatearFolio(2026, "SOLICITUD", 42)).toBe(
      "HER-2026-SOL-000042",
    );
    expect(formatearFolio(2026, "CONFIDENCIAL", 999999)).toBe(
      "HER-2026-CON-999999",
    );
  });
});
