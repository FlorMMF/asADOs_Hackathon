import { NextResponse } from "next/server";
import type { ZodError } from "zod";
import { auth } from "./auth";

export async function usuarioActual() {
  const session = await auth();
  return session?.user ?? null;
}

export function errorJson(
  message: string,
  status = 400,
  extra?: Record<string, unknown>,
) {
  return NextResponse.json({ error: message, ...extra }, { status });
}

export function camposZod(error: ZodError) {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
}

export async function leerJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
