import {
  EstadoModeracion,
  EstadoRevision,
  EstadoSolicitud,
  EtapaPropuesta,
  PrismaClient,
  ResultadoEvaluacion,
  Rol,
  SubtipoQueja,
  TipoSolicitud,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { formatearFolio } from "../src/lib/folio";

const prisma = new PrismaClient();

const ANIO = new Date().getFullYear();
const DIA = 86_400_000;

function diasAtras(dias: number): Date {
  return new Date(Date.now() - dias * DIA);
}

async function sembrarDependencias() {
  const datos = [
    {
      nombre: "Dirección General de Desarrollo Social",
      competencias:
        "atención ciudadana programas sociales comunidad participación vecinal",
      contacto: "desarrollo.social@hermosillo.gob.mx",
    },
    {
      nombre: "Dirección de Servicios Públicos Municipales",
      competencias:
        "alumbrado basura limpieza parques áreas verdes recolección aseo",
      contacto: "servicios.publicos@hermosillo.gob.mx",
    },
    {
      nombre: "Dirección de Obras Públicas",
      competencias:
        "baches pavimento vialidades calles obra pública infraestructura",
      contacto: "obras.publicas@hermosillo.gob.mx",
    },
    {
      nombre: "Dirección de Seguridad Pública Municipal",
      competencias:
        "seguridad vigilancia policía prevención delito emergencias",
      contacto: "seguridad.publica@hermosillo.gob.mx",
    },
    {
      nombre: "Dirección de Tránsito Municipal",
      competencias: "tránsito semáforos señalamiento movilidad accidentes",
      contacto: "transito@hermosillo.gob.mx",
    },
    {
      nombre: "Dirección de Ecología y Medio Ambiente",
      competencias:
        "ecología medio ambiente contaminación ruido residuos árboles",
      contacto: "ecologia@hermosillo.gob.mx",
    },
    {
      nombre: "Agua de Hermosillo",
      competencias: "agua potable drenaje fuga alcantarillado saneamiento",
      contacto: "agua.hermosillo@hermosillo.gob.mx",
    },
    {
      nombre: "Dirección de Salud Municipal",
      competencias: "salud pública prevención epidemiología bienestar",
      contacto: "salud@hermosillo.gob.mx",
    },
  ];

  const mapa = new Map<string, string>();
  for (const dep of datos) {
    const row = await prisma.dependencia.upsert({
      where: { nombre: dep.nombre },
      update: { competencias: dep.competencias, contacto: dep.contacto },
      create: { ...dep, descripcion: `Dependencia municipal: ${dep.nombre}` },
    });
    mapa.set(dep.nombre, row.id);
  }
  return mapa;
}

async function sembrarCategorias(deps: Map<string, string>) {
  const datos: Array<{
    nombre: string;
    tipoSolicitud: TipoSolicitud;
    dependencia: string;
    plazoDias: number;
  }> = [
    {
      nombre: "Baches y vialidades",
      tipoSolicitud: "REPORTE",
      dependencia: "Dirección de Obras Públicas",
      plazoDias: 10,
    },
    {
      nombre: "Alumbrado público",
      tipoSolicitud: "REPORTE",
      dependencia: "Dirección de Servicios Públicos Municipales",
      plazoDias: 7,
    },
    {
      nombre: "Basura y limpieza",
      tipoSolicitud: "REPORTE",
      dependencia: "Dirección de Servicios Públicos Municipales",
      plazoDias: 5,
    },
    {
      nombre: "Parques y áreas verdes",
      tipoSolicitud: "REPORTE",
      dependencia: "Dirección de Servicios Públicos Municipales",
      plazoDias: 10,
    },
    {
      nombre: "Seguridad y vigilancia",
      tipoSolicitud: "REPORTE",
      dependencia: "Dirección de Seguridad Pública Municipal",
      plazoDias: 5,
    },
    {
      nombre: "Fuga de agua",
      tipoSolicitud: "REPORTE",
      dependencia: "Agua de Hermosillo",
      plazoDias: 3,
    },
    {
      nombre: "Atención ciudadana",
      tipoSolicitud: "SOLICITUD",
      dependencia: "Dirección General de Desarrollo Social",
      plazoDias: 15,
    },
    {
      nombre: "Ruido y contaminación",
      tipoSolicitud: "SOLICITUD",
      dependencia: "Dirección de Ecología y Medio Ambiente",
      plazoDias: 15,
    },
    {
      nombre: "Información pública",
      tipoSolicitud: "SOLICITUD_INFORMACION",
      dependencia: "Dirección General de Desarrollo Social",
      plazoDias: 20,
    },
    {
      nombre: "Mejora comunitaria",
      tipoSolicitud: "PROPUESTA",
      dependencia: "Dirección General de Desarrollo Social",
      plazoDias: 30,
    },
    {
      nombre: "Denuncia confidencial",
      tipoSolicitud: "CONFIDENCIAL",
      dependencia: "Dirección de Seguridad Pública Municipal",
      plazoDias: 10,
    },
  ];

  const mapa = new Map<string, string>();
  for (const cat of datos) {
    const row = await prisma.categoria.upsert({
      where: {
        nombre_tipoSolicitud: {
          nombre: cat.nombre,
          tipoSolicitud: cat.tipoSolicitud,
        },
      },
      update: {
        dependenciaSugeridaId: deps.get(cat.dependencia) ?? null,
        plazoDias: cat.plazoDias,
        activa: true,
      },
      create: {
        nombre: cat.nombre,
        tipoSolicitud: cat.tipoSolicitud,
        dependenciaSugeridaId: deps.get(cat.dependencia) ?? null,
        plazoDias: cat.plazoDias,
      },
    });
    mapa.set(`${cat.tipoSolicitud}:${cat.nombre}`, row.id);
  }
  return mapa;
}

async function sembrarZonas() {
  const datos = [
    {
      nombre: "Centro",
      colonias: ["Centro", "Villa de Seris", "El Centenario"],
      centroLat: 29.073,
      centroLng: -110.961,
    },
    {
      nombre: "Norte",
      colonias: ["Pitic", "Las Quintas", "San Benito"],
      centroLat: 29.106,
      centroLng: -110.956,
    },
    {
      nombre: "Sur",
      colonias: ["La Victoria", "El Sahuaro", "Nuevo Hermosillo"],
      centroLat: 29.043,
      centroLng: -110.955,
    },
    {
      nombre: "Este",
      colonias: ["Los Olivos", "Monterreal", "Altares"],
      centroLat: 29.079,
      centroLng: -110.914,
    },
    {
      nombre: "Oeste",
      colonias: ["Paloverde", "Real del Carmen", "Prados del Sol"],
      centroLat: 29.082,
      centroLng: -111.006,
    },
    {
      nombre: "Rural",
      colonias: ["Miguel Alemán", "Zamorano", "La Manga"],
      centroLat: 29.132,
      centroLng: -110.875,
    },
  ];

  const mapa = new Map<string, string>();
  for (const zona of datos) {
    const row = await prisma.zona.upsert({
      where: { nombre: zona.nombre },
      update: { colonias: zona.colonias },
      create: zona,
    });
    mapa.set(zona.nombre, row.id);
  }
  return mapa;
}

async function sembrarUsuarios(deps: Map<string, string>) {
  const password = async (plain: string) => bcrypt.hash(plain, 10);
  const datos: Array<{
    email: string;
    nombre: string;
    rol: Rol;
    passwordPlano: string;
    dependencia?: string;
  }> = [
    {
      email: "ciudadano@reporta.mx",
      nombre: "Ana Ciudadana",
      rol: "CIUDADANO",
      passwordPlano: "Ciudadano123!",
    },
    {
      email: "ciudadano2@reporta.mx",
      nombre: "Luis Vecino",
      rol: "CIUDADANO",
      passwordPlano: "Ciudadano123!",
    },
    {
      email: "consultante@reporta.mx",
      nombre: "Carla Consultante",
      rol: "CONSULTANTE",
      passwordPlano: "Consultante123!",
    },
    {
      email: "moderador@reporta.mx",
      nombre: "Mario Moderador",
      rol: "MODERADOR",
      passwordPlano: "Moderador123!",
    },
    {
      email: "dependencia@reporta.mx",
      nombre: "Diego Dependencia",
      rol: "PERSONAL_DEPENDENCIA",
      passwordPlano: "Dependencia123!",
      dependencia: "Dirección de Obras Públicas",
    },
    {
      email: "dependencia2@reporta.mx",
      nombre: "Diana Servicios",
      rol: "PERSONAL_DEPENDENCIA",
      passwordPlano: "Dependencia123!",
      dependencia: "Dirección de Servicios Públicos Municipales",
    },
    {
      email: "admin@reporta.mx",
      nombre: "Adrián Administrador",
      rol: "ADMIN_INSTITUCIONAL",
      passwordPlano: "Admin123!",
    },
    {
      email: "transparencia@reporta.mx",
      nombre: "Teresa Transparencia",
      rol: "TRANSPARENCIA",
      passwordPlano: "Transparencia123!",
    },
  ];

  const mapa = new Map<string, string>();
  for (const user of datos) {
    const passwordHash = await password(user.passwordPlano);
    const row = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        nombre: user.nombre,
        rol: user.rol,
        dependenciaId: user.dependencia ? deps.get(user.dependencia) : null,
        activo: true,
      },
      create: {
        email: user.email,
        nombre: user.nombre,
        rol: user.rol,
        passwordHash,
        dependenciaId: user.dependencia ? deps.get(user.dependencia) : null,
      },
    });
    mapa.set(user.email, row.id);
  }
  return mapa;
}

interface DemoSpec {
  tipo: TipoSolicitud;
  categoria: string;
  zona: string;
  titulo: string;
  descripcion: string;
  estado: EstadoSolicitud;
  diasAtras: number;
  plazoDias: number;
  esPublico?: boolean;
  confidencial?: boolean;
  subtipoQueja?: SubtipoQueja;
  detalleInfo?: string;
  umbralApoyos?: number;
  restriccionAcceso?: string;
  reporte?: {
    moderacion: EstadoModeracion;
    ubicacion: string;
    lat: number;
    lng: number;
  };
  respuesta?: { contenido: string; esConclusiva: boolean; diasRespuesta: number };
  evaluacion?: {
    resuelto: ResultadoEvaluacion;
    claridad: number;
    tiempo: number;
    satisfaccion: number;
    comentario?: string;
  };
  reabierta?: boolean;
  enRevision?: boolean;
}

function construirSpecs(): DemoSpec[] {
  const titulos = [
    "Bache profundo en avenida principal",
    "Luminaria apagada desde hace una semana",
    "Acumulación de basura en la esquina",
    "Árbol caído bloquea el paso peatonal",
    "Falta de vigilancia en el parque",
    "Fuga de agua en la vía pública",
    "Solicitud de mantenimiento al parque",
    "Ruido excesivo de un negocio nocturno",
    "Solicitud de información sobre presupuesto",
    "Propuesta de huerto comunitario",
    "Denuncia confidencial por inseguridad",
    "Baches múltiples en calle secundaria",
    "Alumbrado intermitente en el bulevar",
    "Quema de basura en terreno baldío",
    "Banqueta en mal estado frente a escuela",
    "Reconocimiento a cuadrilla de limpieza",
    "Solicitud de poda de árboles",
    "Contaminación por escombros",
    "Solicitud de información de obra pública",
    "Propuesta de ciclovía vecinal",
    "Denuncia confidencial por ruido",
    "Socavón en calle residencial",
    "Luminarias dañadas en callejón",
    "Contenedores de basura saturados",
    "Juegos infantiles en mal estado",
    "Solicitud de atención a persona mayor",
    "Sugerencia de señalización vial",
    "Solicitud de información de programas sociales",
    "Propuesta de jornada de reforestación",
    "Denuncia confidencial por maltrato",
  ];

  const estadosReporte: EstadoSolicitud[] = [
    "EN_MODERACION",
    "PUBLICADA",
    "CANALIZADA",
    "EN_ATENCION",
    "RESPONDIDA",
    "CERRADA",
    "RECIBIDA",
    "EN_CLASIFICACION",
    "RECHAZADA",
  ];
  const estadosSolicitud: EstadoSolicitud[] = [
    "RECIBIDA",
    "CANALIZADA",
    "EN_ATENCION",
    "RESPONDIDA",
    "CERRADA",
    "REABIERTA",
    "EN_REVISION",
    "RECHAZADA",
    "CANCELADA",
  ];
  const estadosInfo: EstadoSolicitud[] = [
    "RECIBIDA",
    "EN_ATENCION",
    "RESPONDIDA",
    "CERRADA",
  ];
  const estadosPropuesta: EstadoSolicitud[] = [
    "PUBLICADA",
    "PUBLICADA",
    "EN_REVISION",
    "EN_REVISION",
  ];
  const estadosConfidencial: EstadoSolicitud[] = [
    "RECIBIDA",
    "CANALIZADA",
    "EN_ATENCION",
    "RESPONDIDA",
  ];

  const categorias: Record<TipoSolicitud, string[]> = {
    REPORTE: [
      "Baches y vialidades",
      "Alumbrado público",
      "Basura y limpieza",
      "Parques y áreas verdes",
      "Seguridad y vigilancia",
      "Fuga de agua",
    ],
    SOLICITUD: ["Atención ciudadana", "Ruido y contaminación"],
    SOLICITUD_INFORMACION: ["Información pública"],
    PROPUESTA: ["Mejora comunitaria"],
    CONFIDENCIAL: ["Denuncia confidencial"],
  };

  const zonas = ["Centro", "Norte", "Sur", "Este", "Oeste", "Rural"];

  const plan: TipoSolicitud[] = [
    "REPORTE",
    "REPORTE",
    "REPORTE",
    "REPORTE",
    "REPORTE",
    "SOLICITUD",
    "SOLICITUD",
    "SOLICITUD_INFORMACION",
    "PROPUESTA",
    "CONFIDENCIAL",
  ];

  const specs: DemoSpec[] = [];

  for (let i = 0; i < 30; i += 1) {
    const tipo = plan[i % plan.length];
    const categoriaLista = categorias[tipo];
    const categoria = categoriaLista[i % categoriaLista.length];
    const zona = zonas[i % zonas.length];
    const plazoDias =
      tipo === "REPORTE" ? 7 : tipo === "PROPUESTA" ? 30 : 15;

    let estado: EstadoSolicitud;
    if (tipo === "REPORTE") {
      estado = estadosReporte[i % estadosReporte.length];
    } else if (tipo === "SOLICITUD") {
      estado = estadosSolicitud[i % estadosSolicitud.length];
    } else if (tipo === "SOLICITUD_INFORMACION") {
      estado = estadosInfo[i % estadosInfo.length];
    } else if (tipo === "PROPUESTA") {
      estado = estadosPropuesta[i % estadosPropuesta.length];
    } else {
      estado = estadosConfidencial[i % estadosConfidencial.length];
    }

    const respondida = [
      "RESPONDIDA",
      "CERRADA",
      "REABIERTA",
      "EN_REVISION",
    ].includes(estado);

    const spec: DemoSpec = {
      tipo,
      categoria,
      zona,
      titulo: titulos[i],
      descripcion: `${titulos[i]}. Reporte generado para la demostración de Reporta Hermosillo, con datos representativos de la ciudad.`,
      estado,
      diasAtras: 5 + i * 4,
      plazoDias,
      esPublico: tipo === "REPORTE" || tipo === "PROPUESTA",
      confidencial: tipo === "CONFIDENCIAL",
    };

    if (tipo === "REPORTE") {
      spec.reporte = {
        moderacion:
          estado === "EN_MODERACION"
            ? "PENDIENTE"
            : estado === "RECHAZADA"
              ? "RECHAZADO"
              : "APROBADO",
        ubicacion: `${zona}, Hermosillo, Sonora`,
        lat: 29.07 + (i % 6) * 0.008,
        lng: -110.96 + (i % 5) * 0.01,
      };
    }

    if (tipo === "SOLICITUD") {
      const subtipos: SubtipoQueja[] = [
        "QUEJA",
        "RECONOCIMIENTO",
        "SUGERENCIA",
      ];
      spec.subtipoQueja = subtipos[i % subtipos.length];
    }

    if (tipo === "SOLICITUD_INFORMACION") {
      spec.detalleInfo =
        "Se solicita el desglose de recursos y acciones correspondientes al presente ejercicio fiscal.";
    }

    if (tipo === "PROPUESTA") {
      spec.umbralApoyos = 20 + (i % 3) * 10;
    }

    if (tipo === "CONFIDENCIAL") {
      spec.restriccionAcceso =
        "Acceso limitado a personal autorizado de la dependencia y administración.";
    }

    if (respondida) {
      const diasRespuesta = (i % 4) * 5 + 4;
      spec.respuesta = {
        contenido:
          "La dependencia atendió el caso, realizó la verificación en campo y ejecutó las acciones correspondientes. Se anexa el resultado del operativo.",
        esConclusiva: true,
        diasRespuesta,
      };

      if (
        ["CERRADA", "REABIERTA", "EN_REVISION"].includes(estado) ||
        (estado === "RESPONDIDA" && i % 2 === 0)
      ) {
        const resultados: ResultadoEvaluacion[] = [
          "COMPLETA",
          "PARCIAL",
          "NO_RESUELTA",
        ];
        spec.evaluacion = {
          resuelto: resultados[i % resultados.length],
          claridad: 3 + (i % 3),
          tiempo: 2 + (i % 4),
          satisfaccion: 2 + (i % 4),
          comentario: "Evaluación ciudadana de la atención recibida.",
        };
      }
    }

    if (estado === "REABIERTA") {
      spec.reabierta = true;
      spec.evaluacion = {
        resuelto: "NO_RESUELTA",
        claridad: 2,
        tiempo: 2,
        satisfaccion: 2,
        comentario: "El problema persistió después de la respuesta institucional.",
      };
    }

    if (estado === "EN_REVISION") {
      spec.enRevision = true;
    }

    specs.push(spec);
  }

  return specs;
}

async function sembrarSolicitudes(
  deps: Map<string, string>,
  categorias: Map<string, string>,
  zonas: Map<string, string>,
  usuarios: Map<string, string>,
) {
  const specs = construirSpecs();
  const adminId = usuarios.get("admin@reporta.mx");
  const personalObras = usuarios.get("dependencia@reporta.mx");
  const personalServicios = usuarios.get("dependencia2@reporta.mx");
  const ciudadano2 = usuarios.get("ciudadano2@reporta.mx");
  const contador = new Map<TipoSolicitud, number>();
  const especificacionesPorTipo = new Map<TipoSolicitud, Array<{ folio: string; spec: DemoSpec }>>();

  for (let i = 0; i < specs.length; i += 1) {
    const spec = specs[i];
    const categoriaId = categorias.get(`${spec.tipo}:${spec.categoria}`);
    const zonaId = zonas.get(spec.zona);
    if (!categoriaId || !zonaId) continue;

    const categoria = await prisma.categoria.findUnique({
      where: { id: categoriaId },
    });
    const dependenciaId = categoria?.dependenciaSugeridaId ?? null;
    const creado = diasAtras(spec.diasAtras);
    const fechaLimite = new Date(creado.getTime() + spec.plazoDias * DIA);
    const fechaRespuesta = spec.respuesta
      ? new Date(creado.getTime() + spec.respuesta.diasRespuesta * DIA)
      : null;
    const fechaCierre =
      ["CERRADA", "REABIERTA"].includes(spec.estado) && fechaRespuesta
        ? new Date(fechaRespuesta.getTime() + 2 * DIA)
        : null;

    const consecutivo = (contador.get(spec.tipo) ?? 0) + 1;
    contador.set(spec.tipo, consecutivo);
    const folio = formatearFolio(ANIO, spec.tipo, consecutivo);

    const lista = especificacionesPorTipo.get(spec.tipo) ?? [];
    lista.push({ folio, spec });
    especificacionesPorTipo.set(spec.tipo, lista);

    const asignadaA = [
      "CANALIZADA",
      "RECIBIDA_DEPENDENCIA",
      "EN_ATENCION",
      "RESPONDIDA",
      "CERRADA",
      "EN_REVISION",
      "REABIERTA",
    ].includes(spec.estado)
      ? dependenciaId
      : null;

    const solicitud = await prisma.solicitud.upsert({
      where: { id: `seed-sol-${i + 1}` },
      update: {},
      create: {
        id: `seed-sol-${i + 1}`,
        folio,
        tipo: spec.tipo,
        titulo: spec.titulo,
        descripcion: spec.descripcion,
        estado: spec.estado,
        esPublico: spec.esPublico ?? false,
        confidencial: spec.confidencial ?? false,
        fechaLimite,
        fechaRespuesta,
        fechaCierre,
        atendidaPorInstitucion: !!spec.respuesta,
        resueltaPorCiudadano:
          spec.evaluacion?.resuelto === "COMPLETA" &&
          spec.estado === "CERRADA",
        categoriaId,
        zonaId,
        ciudadanoId: usuarios.get("ciudadano@reporta.mx")!,
        dependenciaActualId: asignadaA,
        createdAt: creado,
        updatedAt: fechaRespuesta ?? creado,
      },
    });

    if (spec.reporte) {
      await prisma.reporte.upsert({
        where: { solicitudId: solicitud.id },
        update: {},
        create: {
          solicitudId: solicitud.id,
          ubicacion: spec.reporte.ubicacion,
          lat: spec.reporte.lat,
          lng: spec.reporte.lng,
          estadoModeracion: spec.reporte.moderacion,
          motivoModeracion:
            spec.reporte.moderacion === "RECHAZADO"
              ? "No cumple con los criterios de publicación."
              : null,
          createdAt: creado,
        },
      });
    }

    if (spec.subtipoQueja) {
      await prisma.queja.upsert({
        where: { solicitudId: solicitud.id },
        update: {},
        create: {
          solicitudId: solicitud.id,
          subtipo: spec.subtipoQueja,
        },
      });
    }

    if (spec.detalleInfo) {
      await prisma.solicitudInformacion.upsert({
        where: { solicitudId: solicitud.id },
        update: {},
        create: {
          solicitudId: solicitud.id,
          detalle: spec.detalleInfo,
          fechaLimiteRespuesta: fechaLimite,
        },
      });
    }

    if (spec.umbralApoyos) {
      await prisma.propuesta.upsert({
        where: { solicitudId: solicitud.id },
        update: {},
        create: {
          solicitudId: solicitud.id,
          umbralApoyos: spec.umbralApoyos,
          etapa:
            spec.estado === "EN_REVISION"
              ? EtapaPropuesta.EN_REVISION
              : EtapaPropuesta.RECOLECTANDO_APOYOS,
        },
      });
    }

    if (spec.restriccionAcceso) {
      await prisma.confidencial.upsert({
        where: { solicitudId: solicitud.id },
        update: {},
        create: {
          solicitudId: solicitud.id,
          restriccionAcceso: spec.restriccionAcceso,
        },
      });
    }

    if (asignadaA) {
      const existentes = await prisma.asignacion.count({
        where: { solicitudId: solicitud.id },
      });
      if (existentes === 0) {
        await prisma.asignacion.create({
          data: {
            solicitudId: solicitud.id,
            dependenciaId: asignadaA,
            asignadoPorId: adminId,
            motivo: "Canalización automática por categoría y competencia.",
            activa: true,
            createdAt: creado,
          },
        });
      }
    }

    if (spec.respuesta) {
      const existentes = await prisma.respuestaInstitucional.count({
        where: { solicitudId: solicitud.id },
      });
      if (existentes === 0) {
        const responsable =
          dependenciaId === deps.get("Dirección de Obras Públicas")
            ? personalObras
            : personalServicios;
        await prisma.respuestaInstitucional.create({
          data: {
            solicitudId: solicitud.id,
            usuarioId: responsable ?? adminId,
            contenido: spec.respuesta.contenido,
            esConclusiva: spec.respuesta.esConclusiva,
            createdAt: fechaRespuesta!,
          },
        });
      }
    }

    if (spec.evaluacion) {
      await prisma.evaluacion.upsert({
        where: { solicitudId: solicitud.id },
        update: {},
        create: {
          solicitudId: solicitud.id,
          resuelto: spec.evaluacion.resuelto,
          claridad: spec.evaluacion.claridad,
          tiempo: spec.evaluacion.tiempo,
          satisfaccion: spec.evaluacion.satisfaccion,
          comentario: spec.evaluacion.comentario,
          createdAt: new Date(
            (fechaRespuesta ?? creado).getTime() + 2 * DIA,
          ),
        },
      });
    }

    const historialExistente = await prisma.historialEstado.count({
      where: { solicitudId: solicitud.id },
    });
    if (historialExistente === 0) {
      await prisma.historialEstado.create({
        data: {
          solicitudId: solicitud.id,
          estadoAnterior: null,
          estadoNuevo: "RECIBIDA",
          usuarioId: usuarios.get("ciudadano@reporta.mx"),
          comentario: "Registro inicial de la solicitud.",
          createdAt: creado,
        },
      });
      if (asignadaA) {
        await prisma.historialEstado.create({
          data: {
            solicitudId: solicitud.id,
            estadoAnterior: "RECIBIDA",
            estadoNuevo: "CANALIZADA",
            usuarioId: adminId,
            comentario: "Canalizada a la dependencia competente.",
            createdAt: new Date(creado.getTime() + 1 * DIA),
          },
        });
      }
      if (spec.estado !== "RECIBIDA" && spec.estado !== "CANALIZADA") {
        await prisma.historialEstado.create({
          data: {
            solicitudId: solicitud.id,
            estadoAnterior: asignadaA ? "CANALIZADA" : "RECIBIDA",
            estadoNuevo: spec.estado,
            usuarioId: adminId,
            comentario: "Actualización de estado.",
            createdAt: fechaRespuesta ?? new Date(creado.getTime() + 2 * DIA),
          },
        });
      }
      if (spec.reabierta) {
        await prisma.historialEstado.create({
          data: {
            solicitudId: solicitud.id,
            estadoAnterior: "CERRADA",
            estadoNuevo: "REABIERTA",
            usuarioId: usuarios.get("ciudadano@reporta.mx"),
            comentario: "El ciudadano solicitó la reapertura del caso.",
            createdAt: new Date(
              (fechaCierre ?? creado).getTime() + 1 * DIA,
            ),
          },
        });
      }
    }

    if (spec.enRevision || spec.reabierta) {
      const revisionExistente = await prisma.revisionSolicitud.count({
        where: { solicitudId: solicitud.id },
      });
      if (revisionExistente === 0) {
        await prisma.revisionSolicitud.create({
          data: {
            solicitudId: solicitud.id,
            motivo:
              "El problema no quedó resuelto con la respuesta institucional recibida.",
            estado:
              spec.reabierta
                ? EstadoRevision.ACEPTADA
                : EstadoRevision.PENDIENTE,
            respuesta: spec.reabierta
              ? "Se acepta la reapertura para una nueva revisión."
              : null,
            solicitadoPorId: usuarios.get("ciudadano@reporta.mx"),
            createdAt: new Date(
              (fechaCierre ?? creado).getTime() + 1 * DIA,
            ),
            resueltaAt: spec.reabierta
              ? new Date((fechaCierre ?? creado).getTime() + 2 * DIA)
              : null,
          },
        });
      }
    }

    if (spec.tipo === "PROPUESTA" && ciudadano2) {
      await prisma.apoyo.upsert({
        where: {
          solicitudId_ciudadanoId: {
            solicitudId: solicitud.id,
            ciudadanoId: ciudadano2,
          },
        },
        update: {},
        create: {
          solicitudId: solicitud.id,
          ciudadanoId: ciudadano2,
          createdAt: new Date(creado.getTime() + 1 * DIA),
        },
      });
    }
  }

  for (const [tipo, lista] of especificacionesPorTipo.entries()) {
    const maximo = lista.length;
    const existente = await prisma.folioCounter.findUnique({
      where: { anio_tipo: { anio: ANIO, tipo } },
    });
    await prisma.folioCounter.upsert({
      where: { anio_tipo: { anio: ANIO, tipo } },
      update: { ultimo: Math.max(existente?.ultimo ?? 0, maximo) },
      create: { anio: ANIO, tipo, ultimo: maximo },
    });
  }

  return {
    total: specs.length,
    specs,
  };
}

async function main() {
  console.log("Sembrando catálogos de Hermosillo…");
  const deps = await sembrarDependencias();
  const categorias = await sembrarCategorias(deps);
  const zonas = await sembrarZonas();
  const usuarios = await sembrarUsuarios(deps);

  console.log("Sembrando solicitudes de demostración…");
  const resultado = await sembrarSolicitudes(deps, categorias, zonas, usuarios);

  const [dependencias, cats, zs, users, solicitudes, vistas] = await Promise.all([
    prisma.dependencia.count(),
    prisma.categoria.count(),
    prisma.zona.count(),
    prisma.user.count(),
    prisma.solicitud.count(),
    prisma.$queryRaw<Array<{ total: number }>>`SELECT count(*)::int AS total FROM "vw_solicitudes_base"`,
  ]);

  console.log("Seed completado:");
  console.log(`  dependencias: ${dependencias}`);
  console.log(`  categorías: ${cats}`);
  console.log(`  zonas: ${zs}`);
  console.log(`  usuarios: ${users}`);
  console.log(`  solicitudes demo: ${resultado.total} (total en BD: ${solicitudes})`);
  console.log(`  vistas de indicadores: ${vistas[0]?.total ?? 0} filas`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
