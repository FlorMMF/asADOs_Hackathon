import Link from "next/link";
import { puedeModerar } from "@/lib/rbac";
import { requireAdmin } from "@/lib/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  const enlaces = [
    ...(user.rol !== "TRANSPARENCIA"
      ? [{ href: "/admin", label: "Bandeja" }]
      : []),
    ...(puedeModerar(user.rol)
      ? [{ href: "/admin/moderacion", label: "Moderación" }]
      : []),
    ...(user.rol === "ADMIN_INSTITUCIONAL"
      ? [
          { href: "/admin/revisiones", label: "Revisiones" },
          { href: "/admin/catalogos", label: "Catálogos" },
          { href: "/admin/usuarios", label: "Usuarios" },
        ]
      : []),
    { href: "/transparencia", label: "Transparencia" },
  ];

  return (
    <div>
      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <nav className="flex flex-wrap gap-1">
          {enlaces.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {enlace.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
