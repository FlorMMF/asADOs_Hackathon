import { redirect } from "next/navigation";
import { auth } from "./auth";
import { puedeAccederAdmin } from "./rbac";

export async function sesionActual() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await sesionActual();
  if (!user?.id) redirect("/login");
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!puedeAccederAdmin(user.rol)) redirect("/mi-panel");
  return user;
}

export async function requireAdminInstitucional() {
  const user = await requireUser();
  if (user.rol !== "ADMIN_INSTITUCIONAL") redirect("/admin");
  return user;
}
