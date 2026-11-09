import { describe, expect, it } from "vitest";
import { sugerirDependencia } from "@/lib/canalizacion";

const dependencias = [
  {
    id: "obras",
    nombre: "Obras Públicas",
    competencias: "bacheo pavimento calles",
  },
  {
    id: "servicios",
    nombre: "Servicios Públicos",
    competencias: "alumbrado publico recoleccion basura",
  },
];

describe("sugerencia de canalización", () => {
  it("respeta la dependencia sugerida de la categoría", () => {
    const resultado = sugerirDependencia(
      {
        id: "cat-1",
        nombre: "Baches",
        dependenciaSugeridaId: "obras",
      },
      "Centro",
      dependencias,
    );

    expect(resultado.dependenciaId).toBe("obras");
    expect(resultado.dependenciaNombre).toBe("Obras Públicas");
    expect(resultado.motivo).toContain("dependencia sugerida");
  });

  it("coincide por competencias ignorando acentos y mayúsculas", () => {
    const resultado = sugerirDependencia(
      { id: "cat-2", nombre: "Alumbrado público" },
      null,
      dependencias,
    );

    expect(resultado.dependenciaId).toBe("servicios");
    expect(resultado.dependenciaNombre).toBe("Servicios Públicos");
  });

  it("devuelve sin asignar cuando no hay coincidencias", () => {
    const resultado = sugerirDependencia(
      { id: "cat-3", nombre: "Licencias de giro" },
      "Zona Norte",
      dependencias,
    );

    expect(resultado.dependenciaId).toBeNull();
    expect(resultado.dependenciaNombre).toBeNull();
    expect(resultado.motivo).toContain("clasificación manual");
  });
});
