# Reporta Hermosillo

Prototipo full-stack de gobierno abierto para registrar, canalizar, atender y evaluar reportes urbanos, solicitudes, quejas, propuestas, solicitudes de información y denuncias confidenciales del municipio de Hermosillo.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Prisma 6 + PostgreSQL
- Auth.js v5 con credenciales y JWT
- Tailwind CSS v4
- Zod para validación
- Recharts para indicadores
- Vitest para pruebas unitarias/integración
- Playwright para pruebas E2E
- Docker multietapa para despliegue

## Funcionalidad principal

- Registro e inicio de sesión con seis roles.
- Alta guiada de cinco tipos de solicitud con formularios condicionales.
- Folios únicos con formato `HER-AAAA-<TIPO>-000000`.
- Canalización automática sugerida y reasignación con historial.
- Máquina de estados con reglas de negocio RN1–RN9.
- Respuestas institucionales y evaluación ciudadana.
- Revisión y reapertura de casos.
- Moderación de reportes y archivos adjuntos.
- Consulta pública por folio.
- Panel de transparencia con ocho indicadores agregados y filtros.
- Panel institucional por rol: bandeja, detalle, moderación, revisiones, catálogos y usuarios.
- Auditoría de acciones sensibles.

## Requisitos locales

- Node.js 20+
- PostgreSQL 16+ (probado con PostgreSQL 18 local)
- npm 10+

## Configuración local

1. Instala dependencias:

```bash
npm install
```

2. Crea `.env` a partir de `.env.example`:

```bash
cp .env.example .env
```

3. Asegura una base de datos y un usuario. Ejemplo con `psql`:

```sql
CREATE ROLE reporta LOGIN PASSWORD 'reporta';
CREATE DATABASE reporta_hermosillo OWNER reporta;
\c reporta_hermosillo
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

4. Aplica migraciones y carga datos demo:

```bash
npm run db:deploy
npm run db:seed
```

5. Inicia la aplicación:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

Si quieres reiniciar todo desde cero:

```bash
npm run db:reset
```

## Docker

```bash
docker compose up --build
```

El servicio `migrate` aplica migraciones y ejecuta el seed idempotente antes de arrancar la app. La base de datos se publica en el puerto `5433` del host para evitar conflictos con PostgreSQL local; la app queda en [http://localhost:3000](http://localhost:3000).

Para cambiar el secreto de Auth.js:

```bash
AUTH_SECRET="un-secreto-largo-aleatorio" docker compose up --build
```

## Credenciales demo

El seed crea estas cuentas:

| Rol | Correo | Contraseña |
| --- | --- | --- |
| Ciudadano | `ciudadano@reporta.mx` | `Ciudadano123!` |
| Ciudadano 2 | `ciudadano2@reporta.mx` | `Ciudadano123!` |
| Consultante | `consultante@reporta.mx` | `Consultante123!` |
| Moderador | `moderador@reporta.mx` | `Moderador123!` |
| Dependencia (Obras Públicas) | `dependencia@reporta.mx` | `Dependencia123!` |
| Dependencia (Servicios Públicos) | `dependencia2@reporta.mx` | `Dependencia123!` |
| Administración | `admin@reporta.mx` | `Admin123!` |
| Transparencia | `transparencia@reporta.mx` | `Transparencia123!` |

La pantalla de login incluye botones para autocompletar cada credencial.

## Roles y permisos

| Rol | Capacidades |
| --- | --- |
| `CIUDADANO` | Crea solicitudes, adjunta evidencias, evalúa, apoya propuestas y solicita revisión. |
| `CONSULTANTE` | Consulta casos públicos no confidenciales e indicadores. |
| `MODERADOR` | Modera reportes y adjuntos; no opera solicitudes. |
| `PERSONAL_DEPENDENCIA` | Atiende, canaliza y responde solicitudes de su dependencia. |
| `ADMIN_INSTITUCIONAL` | Control total, catálogos, usuarios y resolución de revisiones. |
| `TRANSPARENCIA` | Solo acceso a indicadores agregados, sin datos personales. |

## Reglas de negocio implementadas

- **RN1**: folio único por año y tipo.
- **RN2**: canalización a dependencia con registro histórico.
- **RN3**: reasignación conserva asignaciones anteriores.
- **RN4**: no se cierra una solicitud sin respuesta institucional.
- **RN5**: se distingue “atendida por institución” de “resuelta confirmada por ciudadano”.
- **RN6**: revisión ciudadana permite reapertura o cierre definitivo.
- **RN7**: moderación previa de reportes y adjuntos; rechazo con motivo.
- **RN8**: evaluación ciudadana posterior a la respuesta.
- **RN9**: transparencia solo con datos agregados, sin PII.

## Rutas principales

Públicas:

- `/` portada e indicadores generales
- `/reportes` reportes públicos aprobados
- `/propuestas` propuestas y apoyos
- `/transparencia` panel de indicadores
- `/consulta` consulta por folio
- `/login`, `/registro`

Ciudadanas:

- `/mi-panel`
- `/mi-panel/nueva`
- `/mi-panel/[id]`

Institucionales:

- `/admin`
- `/admin/solicitudes/[id]`
- `/admin/moderacion`
- `/admin/revisiones`
- `/admin/catalogos`
- `/admin/usuarios`

API:

- `/api/auth/[...nextauth]`, `/api/auth/register`
- `/api/catalogos`, `/api/health`, `/api/transparencia`, `/api/consulta`
- `/api/solicitudes`, `/api/solicitudes/[id]`
- `/api/solicitudes/[id]/asignar`, `/estado`, `/respuestas`, `/evaluacion`, `/revision`, `/apoyo`
- `/api/revisiones/[id]`
- `/api/adjuntos`, `/api/adjuntos/[id]`
- `/api/moderacion/reportes/[id]`, `/api/moderacion/adjuntos/[id]`

## Indicadores de transparencia

Se calculan sobre las vistas SQL `vw_solicitudes_base` y `vw_indicadores*`:

1. Total de solicitudes.
2. Respondidas y porcentaje dentro del plazo.
3. Promedio y mediana de días de respuesta.
4. Distribución por dependencia.
5. Distribución por categoría.
6. Distribución por zona.
7. Evolución por periodo.
8. Problemas recurrentes y porcentaje de resolución/satisfacción.

## Scripts

```bash
npm run dev          # desarrollo
npm run build        # build de producción
npm start            # servidor de producción
npm run lint         # ESLint
npm run typecheck    # TypeScript sin emitir
npm test             # Vitest
npm run test:e2e     # Playwright
npm run db:generate  # prisma generate
npm run db:migrate   # migración de desarrollo
npm run db:deploy    # migraciones en producción
npm run db:seed      # datos demo idempotentes
npm run db:reset     # reinicia esquema y vuelve a sembrar
npm run db:studio    # Prisma Studio
```

## Pruebas

Las pruebas unitarias cubren estados, folios, canalización, validaciones, RBAC y utilidades. La prueba de integración de indicadores requiere `.env` apuntando a una base sembrada.

```bash
npm test
```

Las pruebas E2E requieren navegadores de Playwright:

```bash
npx playwright install --with-deps chromium
npm run test:e2e
```

En Linux, `--with-deps` instala las bibliotecas del sistema necesarias (por ejemplo `libnspr4`).

## Estructura

```text
prisma/
  schema.prisma
  migrations/
  views.sql
  seed.ts
src/
  app/            # rutas App Router y API
  components/     # UI, dominio, layout y formularios
  lib/            # Prisma, Auth, RBAC, validaciones, indicadores
  types/          # aumentos de tipos de Auth.js
tests/
  unit/
  integration/
  e2e/
```

## Notas de seguridad

- `.env` no se versiona; usa secretos fuertes en producción.
- Los adjuntos se guardan fuera de `public` y se descargan mediante ruta autenticada.
- Los archivos subidos por ciudadanos quedan pendientes de moderación.
- La información confidencial se excluye de consultas públicas y de transparencia.
- Las acciones sensibles se registran en `Auditoria`.
- Rate limiting básico en memoria para registro, alta de solicitudes, adjuntos y consulta por folio; en producción conviene sustituirlo por un almacén compartido (Redis) si hay varias instancias.
- Cabeceras de seguridad (`nosniff`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS) configuradas en `next.config.ts`.
