# Plan de ejecución — Reporta Hermosillo

**Repositorio destino:** `/home/flowers/asADOs_Hackathon` (vacío, solo README + commit inicial)
**Stack confirmado:** Next.js 15 (App Router) + TypeScript + Prisma + PostgreSQL + Docker
**Alcance:** Prototipo funcional completo de la Etapa 1
**Docker:** se entregan Dockerfile + compose listos; la máquina no lo tiene instalado, así que habrá un modo local de respaldo con el PostgreSQL 18 ya activo.

---

## 1. Decisiones técnicas

| Área | Elección | Motivo |
|---|---|---|
| Framework | Next.js 15 App Router + TypeScript | Full-stack en un repo, SSR para panel público |
| ORM | Prisma 6 | Migraciones versionadas, tipado, seed |
| BD | PostgreSQL 16 (Docker) / 18 (local) | Requisito; `percentile_cont` para medianas |
| Auth | Auth.js v5 + Credentials (bcryptjs) + JWT | Roles y sesión sin dependencia externa |
| Validación | Zod | Esquemas compartidos API/formularios |
| UI | Tailwind CSS + shadcn/ui | Velocidad de desarrollo |
| Gráficas | Recharts | Panel de transparencia |
| Archivos | Volumen local `uploads/` + ruta autenticada | Evidencias nunca públicas por estático |
| Tests | Vitest (unit/integración) + Playwright (smoke) | Cubrir reglas de negocio |
| Contenedores | `postgres:16-alpine` + app `node:20-alpine` multi-stage | Reproducible |

---

## 2. Arquitectura

```
Navegador
   │
Next.js (App Router)
 ├── Server Components / Server Actions  → lógica de negocio
 ├── Route Handlers /api/*               → API + RBAC
 └── Prisma Client ──────────────┐
                                 ▼
                    PostgreSQL (volumen persistente)
                                 ▲
                    uploads/ (volumen, servido con permisos)
```

- **RBAC** en tres capas: middleware de sesión, guardas por ruta y validación de propiedad en cada handler.
- **Auditoría** transversal: toda transición de estado/asignación/respuesta escribe en `Auditoria`.
- **Folios** generados en transacción con tabla `FolioCounter` (formato `HER-2026-REP-000123`).
- **Vencimientos** calculados con `fechaLimite`; job de consulta (no cron obligatorio) marca vencidas al leer y expone alertas.

---

## 3. Modelo de datos (Prisma)

| Modelo | Campos clave |
|---|---|
| `User` | email, passwordHash, nombre, rol (enum), dependenciaId?, activo |
| `Dependencia` | nombre, descripción, competencias, contacto |
| `Categoria` | nombre, tipoSolicitud, dependenciaSugeridaId, plazoDias, activa |
| `Zona` | nombre, colonias, lat/lng centro |
| `Solicitud` | folio único, tipo (enum), categoriaId, zonaId, ciudadanoId, título, descripción, estado, dependenciaActualId, fechaLimite, esPublico, confidencial |
| `Reporte` | solicitudId, ubicación, lat/lng, estadoModeracion |
| `SolicitudInformacion` | solicitudId, detalle, fechaLimiteRespuesta, prórroga |
| `Queja` | solicitudId, subtipo (QUEJA/RECONOCIMIENTO/SUGERENCIA) |
| `Propuesta` | solicitudId, umbralApoyos, etapa, justificación institucional |
| `Confidencial` | solicitudId, restricción de acceso |
| `Adjunto` | solicitudId?/respuestaId?, path, mime, estadoModeracion |
| `Asignacion` | solicitudId, dependenciaId, asignadoPorId, motivo, activa |
| `RespuestaInstitucional` | solicitudId, usuarioId, contenido, esConclusiva |
| `HistorialEstado` | solicitudId, estadoAnterior, estadoNuevo, usuarioId, comentario |
| `Apoyo` | solicitudId, ciudadanoId (unique compuesto) |
| `Evaluacion` | solicitudId, resuelto (COMPLETA/PARCIAL/NO_RESUELTA), claridad, tiempo, satisfacción, comentario |
| `RevisionSolicitud` | solicitudId, motivo, estado, respuesta |
| `Auditoria` | actorId, acción, entidad, entidadId, detalle JSON |

**Enums de estado:** `RECIBIDA → EN_CLASIFICACION → CANALIZADA → RECIBIDA_DEPENDENCIA → EN_ATENCION → RESPONDIDA → CERRADA`, más `EN_MODERACION`, `PUBLICADA`, `EN_REVISION`, `REABIERTA`, `RECHAZADA`, `CANCELADA`.
**Estados derivados (vista):** `VENCIDA` (fechaLimite < now y sin respuesta).

**Vistas SQL** para transparencia: `vw_indicadores` con `count`, `percentile_cont` (mediana), promedios y agrupaciones por dependencia/categoría/zona/periodo.

---

## 4. Estructura del proyecto

```
asADOs_Hackathon/
├── docker-compose.yml          # db + app (+ adminer opcional)
├── Dockerfile                  # multi-stage standalone
├── .dockerignore / .env.example
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   ├── seed.ts                 # catálogos + usuarios + solicitudes demo
│   └── views.sql
├── src/
│   ├── app/
│   │   ├── (public)/           # landing, reportes, propuestas, transparencia, consulta folio
│   │   ├── (auth)/             # login, registro
│   │   ├── (ciudadano)/mi-panel/…
│   │   ├── (institucional)/admin/…   # bandeja, detalle, moderación, catálogos, usuarios
│   │   └── api/…               # auth, solicitudes, adjuntos, transparencia, catálogos
│   ├── lib/                    # auth, rbac, folio, estados, canalización, indicadores, uploads
│   └── components/             # ui, formularios, tablas, gráficas
├── tests/                      # unit + integración + e2e
└── README.md                   # setup, demo, credenciales
```

---

## 5. Fases de implementación

### Fase 0 — Bootstrap (0.5 día)
- Inicializar Next.js 15 + TS + Tailwind + ESLint/Prettier.
- Instalar Prisma, Zod, Auth.js, bcryptjs, Recharts, Vitest.
- `Dockerfile`, `docker-compose.yml`, `.env.example`, `.dockerignore`.
- Scripts: `dev`, `build`, `lint`, `typecheck`, `test`, `db:migrate`, `db:seed`.
- **Aceptación:** `npm run build` y `npm run lint` pasan.

### Fase 1 — Base de datos y seed (1 día)
- `schema.prisma` completo, primera migración, vistas SQL.
- Seed: 8 dependencias reales de Hermosillo, ~10 categorías, 6 zonas, 1 usuario por rol, ~30 solicitudes en distintos estados con respuestas/evaluaciones para poblar indicadores.
- Generador de folios y helper de transición de estados.
- **Aceptación:** `prisma migrate deploy && prisma db seed` idempotente; consultas de indicadores devuelven datos.

### Fase 2 — Autenticación y RBAC (1 día)
- Registro/login, sesión JWT, hash bcrypt.
- Matriz de permisos por rol (ciudadano, consultante, moderador, personal de dependencia, admin institucional, transparencia).
- Middleware + guardas; bloqueo total de `Confidencial` a roles no autorizados.
- **Aceptación:** cada rol solo accede a sus rutas; pruebas de acceso denegado.

### Fase 3 — Centro ciudadano (2 días)
- Wizard de 5 tipos (reporte, solicitud/queja/reconocimiento, información, propuesta, confidencial).
- Sugerencia de dependencia por categoría/zona; generación de folio; `fechaLimite`.
- Subida de evidencias con validación de tipo/tamaño; moderación pendiente.
- `/mi-panel`: listado, filtros, historial, documentos y respuestas.
- Consulta pública por folio.
- **Aceptación:** cada tipo crea `Solicitud` + subtipo + folio + historial inicial (RN1, RN2, RN8).

### Fase 4 — Panel institucional y canalización (2 días)
- Bandeja por dependencia con filtros, vencimientos y alertas.
- Detalle: asignar/reasignar con motivo (historial conservado, RN3), cambiar estado, registrar acciones y respuesta conclusiva (RN4), adjuntos.
- Separación de bandejas: info pública, confidencial, reportes.
- **Aceptación:** flujo completo registro→respuesta; reasignación visible en historial; no se cierra sin respuesta.

### Fase 5 — Moderación y feed público (1 día)
- Cola de moderación de reportes/evidencias; aprobar/rechazar con motivo (RN7).
- Feed público solo de aprobados; apoyos ciudadanos con restricción única.
- Propuestas: apoyos, umbral configurable y paso a `EN_REVISION`.
- **Aceptación:** evidencia no aprobada nunca aparece públicamente.

### Fase 6 — Evaluación y reapertura (1 día)
- Evaluación post-respuesta (resuelto, claridad, tiempo, satisfacción).
- Distinción explícita "atendida por institución" vs "resuelta por ciudadano" (RN5).
- Solicitud de revisión/reapertura con historial (RN6).
- **Aceptación:** ambos estados coexisten y se reflejan en métricas.

### Fase 7 — Panel de transparencia (1.5 días)
- Endpoint con filtros (institución, categoría, tipo, zona, periodo).
- 8 indicadores: volumen, % a tiempo, promedio/mediana, tasa de resolución, resolución confirmada, satisfacción, reabiertas, problemas recurrentes.
- Dashboard con tarjetas, gráficas y tablas comparativas; solo datos agregados (RN9).
- **Aceptación:** cifras cuadran con SQL de verificación; sin datos personales.

### Fase 8 — Endurecimiento, tests y entrega (1.5 días)
- Tests unitarios (folios, máquina de estados, canalización, indicadores) e integración con BD de prueba.
- Smoke E2E de los flujos principales.
- Rate limiting básico, headers de seguridad, límites de upload, logs de auditoría.
- README con setup Docker/local, credenciales demo y guion de demostración.
- **Aceptación:** `docker compose up` levanta app+migraciones+seed; demo completa reproducible.

**Estimación total:** ~11–12 días-persona (comprimible a ~6–7 en sprint de hackathon priorizando Fases 1–5).

---

## 6. Docker

`docker-compose.yml`:
- `db`: `postgres:16-alpine`, `POSTGRES_*`, volumen `pgdata`, healthcheck `pg_isready`.
- `app`: build local, `depends_on: db (healthy)`, puerto 3000, `env_file`, volumen `uploads`.
- Servicio one-shot `migrate` (o entrypoint): `prisma migrate deploy && prisma db seed`.
- `adminer` opcional para inspección.

`Dockerfile` multi-stage: deps → build (`prisma generate`, `next build` standalone) → runner no-root.

**Modo sin Docker (esta máquina):**
1. Crear rol/BD en el PostgreSQL 18 local (`sudo -u postgres psql`).
2. `DATABASE_URL` apuntando a `localhost:5432`.
3. `npm run db:migrate && npm run db:seed && npm run dev`.

Quedará documentado en el README; el compose se valida con `docker compose config` una vez instalado Docker.

---

## 7. Reglas de negocio → implementación

| Regla | Dónde se garantiza |
|---|---|
| RN1 folio único | `FolioCounter` + constraint `@unique` |
| RN2 tipo/categoría | validación Zod + FK obligatorias |
| RN3 canalización/reasignación | `Asignacion` + `HistorialEstado` |
| RN4 acciones antes de concluir | guarda en transición a `RESPONDIDA/CERRADA` |
| RN5 atendida ≠ resuelta | campos separados en `Solicitud` y `Evaluacion` |
| RN6 evaluación/revisión | endpoints + `RevisionSolicitud` |
| RN7 moderación | `estadoModeracion` + filtro en feed |
| RN8 permisos diferenciados | RBAC por tipo/bandeja |
| RN9 solo agregados | vistas SQL sin PII |
| RN10 plazos configurables | `Categoria.plazoDias` + cálculo `fechaLimite` |

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Docker no instalado | compose listo + modo local con PG 18 |
| Rol `flowers` inexistente en PG local | script de bootstrap de rol/BD en README |
| Alcance amplio en poco tiempo | orden de fases prioriza flujo ciudadano→institución→transparencia |
| Datos sensibles | RBAC estricto, adjuntos por ruta autenticada, auditoría |
| Mediana/indicadores | SQL con `percentile_cont`, pruebas de cuadre |

---

## 9. Entregables finales

1. Repo Next.js + Prisma funcional con Etapa 1 completa.
2. `docker-compose.yml` + `Dockerfile` + `.env.example`.
3. Migraciones + seed con datos demo de Hermosillo.
4. Suite de tests y guion de demo en README.
5. Credenciales demo por rol y checklist de criterios de aceptación.
