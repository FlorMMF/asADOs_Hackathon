import Link from "next/link";
import { APP_NAME, ROLES } from "@/lib/constants";
import { puedeAccederAdmin, rutaInicialPorRol } from "@/lib/rbac";
import { sesionActual } from "@/lib/session";
import { LogoutButton } from "./logout-button";

const enlacesPublicos = [
  { href: "/reportes", label: "Reportes" },
  { href: "/propuestas", label: "Propuestas" },
  { href: "/transparencia", label: "Transparencia" },
  { href: "/consulta", label: "Consultar folio" },
];

export async function Header() {
  const user = await sesionActual();

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-lg font-black text-white">
            R
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-bold text-slate-900">
              {APP_NAME}
            </span>
            <span className="block text-[11px] text-slate-500">
              Gobierno abierto municipal
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {enlacesPublicos.map((enlace) => (
            <Link
              key={enlace.href}
              href={enlace.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              {enlace.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {puedeAccederAdmin(user.rol) ? (
                <Link
                  href="/admin"
                  className="hidden rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 sm:inline-flex"
                >
                  Panel institucional
                </Link>
              ) : null}
              <Link
                href="/mi-panel"
                className="hidden rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 sm:inline-flex"
              >
                Mi panel
              </Link>
              <div className="hidden text-right lg:block">
                <p className="text-sm font-semibold text-slate-900">
                  {user.name}
                </p>
                <p className="text-[11px] text-slate-500">{ROLES[user.rol]}</p>
              </div>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Iniciar sesión
              </Link>
              <Link
                href="/registro"
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Registrarme
              </Link>
            </>
          )}
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-slate-100 px-4 py-2 md:hidden">
        {enlacesPublicos.map((enlace) => (
          <Link
            key={enlace.href}
            href={enlace.href}
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            {enlace.label}
          </Link>
        ))}
        {user ? (
          <Link
            href={rutaInicialPorRol(user.rol)}
            className="whitespace-nowrap rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-800"
          >
            Mi panel
          </Link>
        ) : null}
      </nav>
    </header>
  );
}
