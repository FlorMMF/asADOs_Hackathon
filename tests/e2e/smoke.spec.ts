import { expect, test } from "@playwright/test";

test("la portada muestra la propuesta de valor", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Tu ciudad, tu voz/i }),
  ).toBeVisible();
  await expect(page.getByText("Solicitudes registradas")).toBeVisible();
});

test("transparencia renderiza los indicadores agregados", async ({ page }) => {
  await page.goto("/transparencia");
  await expect(
    page.getByRole("heading", { name: /Panel de transparencia/i }),
  ).toBeVisible();
  await expect(page.getByText("Aplicar filtros")).toBeVisible();
});

test("un administrador entra al panel institucional", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electrónico").fill("admin@reporta.mx");
  await page.getByLabel("Contraseña").fill("Admin123!");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await page.waitForURL("**/admin");
  await expect(
    page.getByRole("heading", { name: /Bandeja de atención/i }),
  ).toBeVisible();
});

test("protege el panel para visitantes sin sesión", async ({ page }) => {
  await page.goto("/admin");
  await page.waitForURL("**/login**");
  await expect(
    page.getByRole("heading", { name: /Inicia sesión/i }),
  ).toBeVisible();
});
