import { afterAll, describe, expect, it } from "vitest";
import { obtenerIndicadores } from "@/lib/indicadores";
import { prisma } from "@/lib/prisma";

describe("indicadores agregados contra PostgreSQL", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("devuelve las dimensiones e indicadores del seed", async () => {
    const data = await obtenerIndicadores();

    expect(data.resumen.total).toBeGreaterThan(0);
    expect(data.resumen.total).toBeGreaterThanOrEqual(data.resumen.respondidas);
    expect(data.resumen.pctATiempo).toBeGreaterThanOrEqual(0);
    expect(data.resumen.pctATiempo).toBeLessThanOrEqual(100);
    expect(data.porDependencia.length).toBeGreaterThan(0);
    expect(data.porCategoria.length).toBeGreaterThan(0);
    expect(data.porZona.length).toBeGreaterThan(0);
    expect(data.porPeriodo.length).toBeGreaterThan(0);
  });

  it("respeta filtros sobre datos agregados", async () => {
    const data = await obtenerIndicadores({ zona: "Centro" });
    expect(data.resumen.total).toBeGreaterThanOrEqual(0);
    expect(
      data.porZona.every((fila) => fila.nombre === "Centro"),
    ).toBe(true);
  });
});
