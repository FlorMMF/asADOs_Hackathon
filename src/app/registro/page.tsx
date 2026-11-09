import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Crear cuenta" };

export default function RegistroPage() {
  return (
    <div className="mx-auto max-w-lg py-6">
      <Card className="p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">
          Registro ciudadano
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Crea tu cuenta
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Con tu cuenta podrás registrar reportes, solicitudes, propuestas,
          denuncias confidenciales y dar seguimiento a cada folio.
        </p>
        <div className="mt-6">
          <RegisterForm />
        </div>
        <p className="mt-6 text-sm text-slate-600">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Inicia sesión
          </Link>
        </p>
      </Card>
    </div>
  );
}
