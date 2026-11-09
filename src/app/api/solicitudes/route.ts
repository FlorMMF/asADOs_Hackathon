import { Prisma, type EstadoSolicitud, type TipoSolicitud } from "@prisma/client";
import { NextResponse } from "next/server";
import { camposZod, errorJson, leerJson, usuarioActual } from "@/lib/api";
import { registrarAuditoria } from "@/lib/audit";
import { ESTADOS_TERMINALES } from "@/lib/constants";
import { estaVencida } from "@/lib/estados";
import { generarFolio } from "@/lib/folio";
import { prisma } from "@/lib/prisma";
import { limitarPorIp } from "@/lib/rate-limit";
import { solicitudSchema } from "@/lib/validations";

const DIA = 86_400_000;

export async function GET(request: Request) {
  const user = await usuarioActual();
  if (!user) return errorJson("No autenticado", 401);
  if (user.rol === "TRANSPARENCIA") {
    return errorJson("El rol de transparencia solo accede a datos agregados", 403);
  }

  const { searchParams } = new URL(request.url);
  const estado = searchParams.get("estado");
  const tipo = searchParams.get("tipo");
  const dependenciaId = searchParams.get("dependenciaId");
  const vencidas = searchParams.get("vencidas") === "1";

  const where: Prisma.SolicitudWhereInput = {};

  if (user.rol === "CIUDADANO") {
    where.ciudadanoId = user.id;
  } else if (user.rol === "PERSONAL_DEPENDENCIA") {
    where.OR = [
      { dependenciaActualId: user.dependenciaId ?? "__none__" },
      {
        asignaciones: {
          some: { dependenciaId: user.dependenciaId ?? "__none__", activa: true },
        },
      },
    ];
  } else if (user.rol === "MODERADOR") {
    where.confidencial = false;
  } else if (user.rol === "CONSULTANTE") {
    where.esPublico = true;
    where.confidencial = false;
  }

  if (estado) where.estado = estado as EstadoSolicitud;
  if (tipo) where.tipo = tipo as TipoSolicitud;
  if (dependenciaId && user.rol !== "PERSONAL_DEPENDENCIA") {
    where.dependenciaActualId = dependenciaId;
  }
  if (user.rol === "MODERADOR") {
    where.tipo = "REPORTE";
    where.confidencial = false;
  }
  if (vencidas) {
    where.fechaLimite = { lt: new Date() };
    where.fechaRespuesta = null;
    where.estado = { notIn: ESTADOS_TERMINALES };
  }

  const rows = await prisma.solicitud.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      folio: true,
      tipo: true,
      titulo: true,
      estado: true,
      confidencial: true,
      esPublico: true,
      fechaLimite: true,
      fechaRespuesta: true,
      createdAt: true,
      categoria: { select: { nombre: true } },
      zona: { select: { nombre: true } },
      dependenciaActual: { select: { id: true, nombre: true } },
      evaluacion: { select: { resuelto: true } },
      _count: { select: { apoyos: true } },
    },
  });

  const items = rows.map((row) => ({
    ...row,
    vencida: estaVencida({
      estado: row.estado,
      fechaLimite: row.fechaLimite,
      fechaRespuesta: row.fechaRespuesta,
    }),
    apoyos: row._count.apoyos,
    _count: undefined,
  }));

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const user = await usuarioActual();
  if (!user) return errorJson("No autenticado", 401);
  if (user.rol !== "CIUDADANO" && user.rol !== "ADMIN_INSTITUCIONAL") {
    return errorJson("Tu rol no puede crear solicitudes", 403);
  }

  const limitado = limitarPorIp(request, "crear-solicitud", 20);
  if (limitado) return limitado;

  const body = await leerJson(request);
  const parsed = solicitudSchema.safeParse(body);
  if (!parsed.success) {
    return errorJson("Datos inválidos", 422, {
      campos: camposZod(parsed.error),
    });
  }

  const data = parsed.data;
  const [categoria, zona] = await Promise.all([
    prisma.categoria.findUnique({ where: { id: data.categoriaId } }),
    prisma.zona.findUnique({ where: { id: data.zonaId } }),
  ]);

  if (!categoria || !categoria.activa) {
    return errorJson("Categoría inválida o inactiva", 422);
  }
  if (categoria.tipoSolicitud !== data.tipo) {
    return errorJson("La categoría no corresponde al tipo elegido", 422);
  }
  if (!zona) return errorJson("Zona inválida", 422);

  const esReporte = data.tipo === "REPORTE";
  const estadoInicial: EstadoSolicitud = esReporte
    ? "EN_MODERACION"
    : data.tipo === "PROPUESTA"
      ? "PUBLICADA"
      : "RECIBIDA";
  const esPublico =
    data.tipo === "CONFIDENCIAL"
      ? false
      : (data.esPublico ??
        (data.tipo === "REPORTE" || data.tipo === "PROPUESTA"));

  try {
    const solicitud = await prisma.$transaction(async (tx) => {
      const folio = await generarFolio(data.tipo, new Date().getFullYear(), tx);
      const fechaLimite = new Date(Date.now() + categoria.plazoDias * DIA);

      const creada = await tx.solicitud.create({
        data: {
          folio,
          tipo: data.tipo,
          titulo: data.titulo,
          descripcion: data.descripcion,
          estado: estadoInicial,
          esPublico,
          confidencial: data.tipo === "CONFIDENCIAL",
          fechaLimite,
          categoriaId: data.categoriaId,
          zonaId: data.zonaId,
          ciudadanoId: user.id,
          reporte: esReporte
            ? {
                create: {
                  ubicacion: data.ubicacion ?? `${zona.nombre}, Hermosillo`,
                  lat: data.lat,
                  lng: data.lng,
                  estadoModeracion: "PENDIENTE",
                },
              }
            : undefined,
          queja:
            data.tipo === "SOLICITUD" && data.subtipoQueja
              ? { create: { subtipo: data.subtipoQueja } }
              : undefined,
          info:
            data.tipo === "SOLICITUD_INFORMACION" && data.detalleInfo
              ? {
                  create: {
                    detalle: data.detalleInfo,
                    fechaLimiteRespuesta: fechaLimite,
                    prorroga: data.prorroga ?? false,
                  },
                }
              : undefined,
          propuesta:
            data.tipo === "PROPUESTA" && data.umbralApoyos
              ? {
                  create: {
                    umbralApoyos: data.umbralApoyos,
                    etapa: "RECOLECTANDO_APOYOS",
                  },
                }
              : undefined,
          confidencialDetalle:
            data.tipo === "CONFIDENCIAL" && data.restriccionAcceso
              ? { create: { restriccionAcceso: data.restriccionAcceso } }
              : undefined,
        },
      });

      await tx.historialEstado.create({
        data: {
          solicitudId: creada.id,
          estadoAnterior: null,
          estadoNuevo: estadoInicial,
          usuarioId: user.id,
          comentario:
            estadoInicial === "EN_MODERACION"
              ? "Reporte recibido; pendiente de moderación."
              : "Registro inicial de la solicitud.",
        },
      });

      await registrarAuditoria(
        {
          actorId: user.id,
          accion: "CREAR_SOLICITUD",
          entidad: "Solicitud",
          entidadId: creada.id,
          detalle: { folio, tipo: data.tipo, estado: estadoInicial },
        },
        tx,
      );

      return creada;
    });

    return NextResponse.json(
      {
        id: solicitud.id,
        folio: solicitud.folio,
        estado: solicitud.estado,
        fechaLimite: solicitud.fechaLimite,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creando solicitud", error);
    return errorJson("No fue posible crear la solicitud", 500);
  }
}
