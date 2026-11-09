import { describe, expect, it } from "vitest";
import {
  puedeAccederAdmin,
  puedeAsignar,
  puedeModerar,
  puedeVerConfidencial,
  rutaInicialPorRol,
} from "@/lib/rbac";

describe("control de acceso por rol", () => {
  it("restringe el panel institucional a roles internos", () => {
    expect(puedeAccederAdmin("ADMIN_INSTITUCIONAL")).toBe(true);
    expect(puedeAccederAdmin("MODERADOR")).toBe(true);
    expect(puedeAccederAdmin("PERSONAL_DEPENDENCIA")).toBe(true);
    expect(puedeAccederAdmin("TRANSPARENCIA")).toBe(true);
    expect(puedeAccederAdmin("CIUDADANO")).toBe(false);
    expect(puedeAccederAdmin("CONSULTANTE")).toBe(false);
  });

  it("solo administración y moderación moderan contenido", () => {
    expect(puedeModerar("ADMIN_INSTITUCIONAL")).toBe(true);
    expect(puedeModerar("MODERADOR")).toBe(true);
    expect(puedeModerar("PERSONAL_DEPENDENCIA")).toBe(false);
  });

  it("solo perfiles operativos canalizan solicitudes", () => {
    expect(puedeAsignar("ADMIN_INSTITUCIONAL")).toBe(true);
    expect(puedeAsignar("PERSONAL_DEPENDENCIA")).toBe(true);
    expect(puedeAsignar("MODERADOR")).toBe(false);
  });

  it("protege la información confidencial", () => {
    expect(puedeVerConfidencial("ADMIN_INSTITUCIONAL", false)).toBe(true);
    expect(puedeVerConfidencial("PERSONAL_DEPENDENCIA", true)).toBe(true);
    expect(puedeVerConfidencial("PERSONAL_DEPENDENCIA", false)).toBe(false);
    expect(puedeVerConfidencial("MODERADOR", true)).toBe(false);
    expect(puedeVerConfidencial("CIUDADANO", true)).toBe(false);
  });

  it("define el destino inicial por rol", () => {
    expect(rutaInicialPorRol("CIUDADANO")).toBe("/mi-panel");
    expect(rutaInicialPorRol(null)).toBe("/mi-panel");
    expect(rutaInicialPorRol("CONSULTANTE")).toBe("/transparencia");
    expect(rutaInicialPorRol("ADMIN_INSTITUCIONAL")).toBe("/admin");
  });
});
