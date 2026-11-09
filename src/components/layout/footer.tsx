import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="text-sm font-bold text-slate-900">{APP_NAME}</p>
          <p className="mt-2 max-w-xs text-sm text-slate-600">
            Plataforma cívica para reportar problemas, dar seguimiento a
            solicitudes y consultar la transparencia del gobierno municipal de
            Hermosillo.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Participa
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <Link href="/mi-panel/nueva" className="hover:text-emerald-700">
                Crear una solicitud
              </Link>
            </li>
            <li>
              <Link href="/reportes" className="hover:text-emerald-700">
                Ver reportes públicos
              </Link>
            </li>
            <li>
              <Link href="/consulta" className="hover:text-emerald-700">
                Consultar por folio
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Transparencia
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <Link
                href="/transparencia"
                className="hover:text-emerald-700"
              >
                Indicadores de atención
              </Link>
            </li>
            <li>
              <Link href="/admin/moderacion" className="hover:text-emerald-700">
                Moderación de contenido
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-500">
        Prototipo de hackathon · Datos de demostración · Hermosillo, Sonora
      </div>
    </footer>
  );
}
