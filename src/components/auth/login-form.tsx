"use client";

import { getSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { rutaInicialPorRol } from "@/lib/rbac";

const DEMO = [
  { label: "Ciudadano", email: "ciudadano@reporta.mx", password: "Ciudadano123!" },
  { label: "Dependencia", email: "dependencia@reporta.mx", password: "Dependencia123!" },
  { label: "Moderador", email: "moderador@reporta.mx", password: "Moderador123!" },
  { label: "Admin", email: "admin@reporta.mx", password: "Admin123!" },
  { label: "Transparencia", email: "transparencia@reporta.mx", password: "Transparencia123!" },
  { label: "Consultante", email: "consultante@reporta.mx", password: "Consultante123!" },
];

export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("ciudadano@reporta.mx");
  const [password, setPassword] = useState("Ciudadano123!");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (!result || result.error) {
      setError("Correo o contraseña incorrectos, o la cuenta está inactiva.");
      setPending(false);
      return;
    }
    const session = await getSession();
    router.push(callbackUrl ?? rutaInicialPorRol(session?.user?.rol));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Correo electrónico" htmlFor="email">
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </Field>
        <Field label="Contraseña" htmlFor="password">
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </Field>
        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Ingresando…" : "Iniciar sesión"}
        </Button>
      </form>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Credenciales de demostración
        </p>
        <div className="flex flex-wrap gap-2">
          {DEMO.map((item) => (
            <button
              key={item.email}
              type="button"
              onClick={() => {
                setEmail(item.email);
                setPassword(item.password);
              }}
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:border-emerald-300 hover:text-emerald-700"
            >
              {item.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Al elegir un rol se llenan automáticamente correo y contraseña demo.
        </p>
      </div>
    </div>
  );
}
