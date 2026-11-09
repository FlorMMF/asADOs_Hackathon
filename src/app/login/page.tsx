import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Iniciar sesión" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="mx-auto grid max-w-5xl gap-8 py-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
      <Card className="p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
          Acceso
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Inicia sesión en Reporta Hermosillo
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Ciudadanía, dependencias, moderación, administración y transparencia
          usan el mismo acceso con permisos diferenciados.
        </p>
        <div className="mt-6">
          <LoginForm callbackUrl={callbackUrl} />
        </div>
        <p className="mt-6 text-sm text-slate-600">
          ¿Aún no tienes cuenta?{" "}
          <Link
            href="/registro"
            className="font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Regístrate
          </Link>
        </p>
      </Card>

      <Card className="bg-slate-900 p-6 text-white sm:p-8">
        <h2 className="text-lg font-bold">Una plataforma, seis roles</h2>
        <ul className="mt-4 space-y-3 text-sm text-slate-300">
          <li>
            <strong className="text-white">Ciudadanía:</strong> crea y evalúa
            solicitudes, sube evidencias y solicita revisión.
          </li>
          <li>
            <strong className="text-white">Dependencia:</strong> atiende,
            reasigna y responde su bandeja.
          </li>
          <li>
            <strong className="text-white">Moderación:</strong> aprueba o
            rechaza reportes y evidencias.
          </li>
          <li>
            <strong className="text-white">Administración:</strong> control
            total, catálogos y usuarios.
          </li>
          <li>
            <strong className="text-white">Transparencia:</strong> solo
            indicadores agregados, sin datos personales.
          </li>
          <li>
            <strong className="text-white">Consultante:</strong> consulta
            pública de solicitudes no confidenciales.
          </li>
        </ul>
        <p className="mt-6 rounded-lg bg-white/10 px-3 py-2 text-xs text-slate-200">
          Las cuentas demo ya están creadas por el seed. Usa los botones de la
          izquierda para entrar con cada rol.
        </p>
      </Card>
    </div>
  );
}
