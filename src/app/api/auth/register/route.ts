import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { camposZod, errorJson, leerJson } from "@/lib/api";
import { registrarAuditoria } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { limitarPorIp } from "@/lib/rate-limit";
import { registroSchema } from "@/lib/validations";

export async function POST(request: Request) {
  const limitado = limitarPorIp(request, "registro", 5);
  if (limitado) return limitado;

  const body = await leerJson(request);
  const parsed = registroSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson("Datos inválidos", 422, {
      campos: camposZod(parsed.error),
    });
  }

  const email = parsed.data.email.trim().toLowerCase();
  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    return errorJson("Ya existe una cuenta con ese correo", 409);
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      nombre: parsed.data.nombre,
      passwordHash,
      rol: "CIUDADANO",
    },
    select: { id: true, email: true, nombre: true, rol: true },
  });

  await registrarAuditoria({
    actorId: user.id,
    accion: "REGISTRO",
    entidad: "User",
    entidadId: user.id,
    detalle: { rol: user.rol },
  });

  return NextResponse.json(user, { status: 201 });
}
