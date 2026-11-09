import { describe, expect, it } from "vitest";
import { limitarPorIp } from "@/lib/rate-limit";

function requestDesde(ip: string) {
  return new Request("http://localhost/api/test", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("rate limiting básico", () => {
  it("permite solicitudes dentro del límite", () => {
    const nombre = `test-${Date.now()}-ok`;
    expect(limitarPorIp(requestDesde("10.0.0.1"), nombre, 3)).toBeNull();
    expect(limitarPorIp(requestDesde("10.0.0.1"), nombre, 3)).toBeNull();
    expect(limitarPorIp(requestDesde("10.0.0.1"), nombre, 3)).toBeNull();
  });

  it("bloquea al superar el límite y devuelve Retry-After", () => {
    const nombre = `test-${Date.now()}-block`;
    expect(limitarPorIp(requestDesde("10.0.0.2"), nombre, 1)).toBeNull();
    const bloqueo = limitarPorIp(requestDesde("10.0.0.2"), nombre, 1);
    expect(bloqueo?.status).toBe(429);
    expect(bloqueo?.headers.get("Retry-After")).toBeTruthy();
  });

  it("aísla los límites por IP", () => {
    const nombre = `test-${Date.now()}-ip`;
    expect(limitarPorIp(requestDesde("10.0.0.3"), nombre, 1)).toBeNull();
    expect(limitarPorIp(requestDesde("10.0.0.4"), nombre, 1)).toBeNull();
    expect(limitarPorIp(requestDesde("10.0.0.3"), nombre, 1)?.status).toBe(
      429,
    );
  });
});
