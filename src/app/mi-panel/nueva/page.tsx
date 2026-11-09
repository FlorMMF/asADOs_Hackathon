import type { TipoSolicitud } from "@prisma/client";
import { redirect } from "next/navigation";
import {
  NuevaSolicitudWizard,
  type CategoriaOpcion,
  type ZonaOpcion,
} from "@/components/ciudadano/nueva-solicitud-wizard";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Nueva solicitud" };

const TIPOS_VALIDOS = new Set([
  "REPORTE",
  "SOLICITUD",
  "SOLICITUD_INFORMACION",
  "PROPUESTA",
  "CONFIDENCIAL",
]);

export default async function NuevaSolicitudPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const user = await requireUser();
  if (user.rol !== "CIUDADANO" && user.rol !== "ADMIN_INSTITUCIONAL") {
    redirect("/mi-panel");
  }

  const { tipo } = await searchParams;
  const tipoInicial =
    tipo && TIPOS_VALIDOS.has(tipo) ? (tipo as TipoSolicitud) : undefined;

  const [categorias, zonas] = await Promise.all([
    prisma.categoria.findMany({
      where: { activa: true },
      orderBy: { nombre: "asc" },
      select: {
        id: true,
        nombre: true,
        tipoSolicitud: true,
        plazoDias: true,
        dependenciaSugerida: { select: { id: true, nombre: true } },
      },
    }),
    prisma.zona.findMany({
      orderBy: { nombre: "asc" },
      select: { id: true, nombre: true, colonias: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="Registro guiado"
        title="Nueva solicitud"
        description="Elige el tipo, completa los detalles y adjunta evidencias. Recibirás un folio único con plazo de atención."
      />
      <Card>
        <CardHeader
          title="Asistente de registro"
          description="El folio y la fecha límite se calculan automáticamente según la categoría."
        />
        <CardBody>
          <NuevaSolicitudWizard
            categorias={categorias as CategoriaOpcion[]}
            zonas={zonas as ZonaOpcion[]}
            tipoInicial={tipoInicial}
          />
        </CardBody>
      </Card>
    </div>
  );
}
