import { describe, expect, it } from "vitest";
import {
  diasRestantes,
  esEstadoTerminal,
  estadoDerivado,
  estaVencida,
  puedeTransicionar,
  transicionesPermitidas,
} from "@/lib/estados";

describe("máquina de estados", () => {
  it("permite la ruta normal de atención", () => {
    expect(puedeTransicionar("RECIBIDA", "EN_CLASIFICACION")).toBe(true);
    expect(puedeTransicionar("EN_CLASIFICACION", "CANALIZADA")).toBe(true);
    expect(
      puedeTransicionar("CANALIZADA", "RECIBIDA_DEPENDENCIA"),
    ).toBe(true);
    expect(puedeTransicionar("RECIBIDA_DEPENDENCIA", "EN_ATENCION")).toBe(
      true,
    );
    expect(puedeTransicionar("EN_ATENCION", "RESPONDIDA")).toBe(true);
    expect(puedeTransicionar("RESPONDIDA", "CERRADA")).toBe(true);
  });

  it("rechaza saltos inválidos y estados terminales", () => {
    expect(puedeTransicionar("RECIBIDA", "CERRADA")).toBe(false);
    expect(puedeTransicionar("RESPONDIDA", "EN_ATENCION")).toBe(false);
    expect(transicionesPermitidas("RECHAZADA")).toEqual([]);
    expect(transicionesPermitidas("CANCELADA")).toEqual([]);
    expect(esEstadoTerminal("RECHAZADA")).toBe(true);
    expect(esEstadoTerminal("RESPONDIDA")).toBe(false);
  });

  it("detecta vencimiento solo en casos abiertos y sin respuesta", () => {
    const ahora = new Date("2026-11-10T12:00:00.000Z");
    const vencida = new Date("2026-11-09T12:00:00.000Z");
    const futura = new Date("2026-11-20T12:00:00.000Z");

    expect(
      estaVencida(
        { estado: "EN_ATENCION", fechaLimite: vencida, fechaRespuesta: null },
        ahora,
      ),
    ).toBe(true);

    expect(
      estaVencida(
        { estado: "EN_ATENCION", fechaLimite: vencida, fechaRespuesta: ahora },
        ahora,
      ),
    ).toBe(false);

    expect(
      estaVencida(
        { estado: "CERRADA", fechaLimite: vencida, fechaRespuesta: null },
        ahora,
      ),
    ).toBe(false);

    expect(
      estaVencida(
        { estado: "RECIBIDA", fechaLimite: null, fechaRespuesta: null },
        ahora,
      ),
    ).toBe(false);

    expect(
      estaVencida(
        { estado: "EN_ATENCION", fechaLimite: futura, fechaRespuesta: null },
        ahora,
      ),
    ).toBe(false);
  });

  it("calcula días restantes con redondeo hacia arriba", () => {
    const ahora = new Date("2026-11-10T12:00:00.000Z");
    expect(
      diasRestantes(new Date("2026-11-11T12:00:00.000Z"), ahora),
    ).toBe(1);
    expect(
      diasRestantes(new Date("2026-11-10T18:00:00.000Z"), ahora),
    ).toBe(1);
    expect(diasRestantes(null, ahora)).toBeNull();
  });

  it("deriva el estado VENCIDA sin modificar el estado base", () => {
    const ahora = new Date("2026-11-10T12:00:00.000Z");
    expect(
      estadoDerivado(
        {
          estado: "EN_ATENCION",
          fechaLimite: new Date("2026-11-09T12:00:00.000Z"),
          fechaRespuesta: null,
        },
        ahora,
      ),
    ).toBe("VENCIDA");
    expect(
      estadoDerivado(
        {
          estado: "EN_ATENCION",
          fechaLimite: new Date("2026-11-20T12:00:00.000Z"),
          fechaRespuesta: null,
        },
        ahora,
      ),
    ).toBe("EN_ATENCION");
  });
});
