import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const [row] = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`;
    return NextResponse.json({
      status: "ok",
      database: row?.ok === 1 ? "ok" : "unknown",
      timestamp: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      { status: "error", database: "down" },
      { status: 503 },
    );
  }
}
