"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface CampoError {
  path: string;
  message: string;
}

export function RegisterForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errores, setErrores] = useState<CampoError[]>([]);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setErrores([]);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, email, password }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      setError(data?.error ?? "No fue posible crear la cuenta");
      setErrores(data?.campos ?? []);
      setPending(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    if (!result || result.error) {
      router.push("/login");
      return;
    }
    router.push("/mi-panel");
    router.refresh();
  }

  const errorDe = (path: string) =>
    errores.find((item) => item.path === path)?.message;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Field label="Nombre completo" htmlFor="nombre" error={errorDe("nombre")}>
        <Input
          id="nombre"
          value={nombre}
          onChange={(event) => setNombre(event.target.value)}
          autoComplete="name"
          required
        />
      </Field>
      <Field
        label="Correo electrónico"
        htmlFor="email"
        error={errorDe("email")}
      >
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
        />
      </Field>
      <Field
        label="Contraseña"
        htmlFor="password"
        hint="Mínimo 8 caracteres."
        error={errorDe("password")}
      >
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </Field>
      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creando cuenta…" : "Crear cuenta ciudadana"}
      </Button>
    </form>
  );
}
