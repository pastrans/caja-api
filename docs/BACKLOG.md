# Backlog — caja-api

Pendientes detectados en el análisis del proyecto (octubre 2026), escritos como User Stories.

**Prioridad:** 🔴 Alta (seguridad o integridad de datos) · 🟡 Media (bugs o robustez) · 🟢 Baja (deuda técnica)

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| US-01 | Separar tokens de sesión y de reset de contraseña | 🔴 | ✅ Hecho (rama `staging`) |
| US-02 | No exponer credenciales de BD en logs | 🔴 | ✅ Hecho (rama `staging`) |
| US-03 | Apertura y cierre de caja atómicos | 🔴 | Pendiente |
| US-04 | Montos con precisión decimal | 🔴 | ✅ Hecho (rama `staging`) |
| US-05 | Evitar enumeración de usuarios en "olvidé mi contraseña" | 🔴 | ✅ Hecho (rama `staging`) |
| US-06 | Protección contra fuerza bruta y cabeceras seguras | 🔴 | Pendiente |
| US-07 | Corregir `.env.template` y configuración local | 🟡 | ✅ Hecho (rama `staging`) |
| US-08 | Límite máximo en la paginación | 🟡 | ✅ Hecho (rama `staging`) |
| US-09 | Errores de base de datos con respuestas claras | 🟡 | ✅ Hecho (rama `staging`) |
| US-10 | Emails normalizados y validados | 🟡 | Pendiente |
| US-11 | 404 en JSON para rutas `/api` inexistentes | 🟡 | ✅ Hecho (rama `staging`) |
| US-12 | Email opcional en desarrollo | 🟡 | Pendiente |
| US-13 | Usuario autenticado en `req.user` | 🟢 | ✅ Hecho (rama `staging`) |
| US-14 | Respetar la regla de dependencias de Clean Architecture | 🟢 | Pendiente |
| US-15 | Limpiar código muerto y restos de la plantilla | 🟢 | ✅ Hecho (rama `staging`) |
| US-16 | Tests automatizados y linter | 🟢 | Pendiente |
| US-17 | Despliegue con Docker y scripts de producción | 🟢 | Pendiente |
| US-18 | Dashboard de ventas | — | ✅ Hecho (rama `staging`) |

---

## 🔴 Alta prioridad

### US-01 — Separar tokens de sesión y de reset de contraseña
**Como** administrador del sistema, **quiero** que el token de recuperación de contraseña solo sirva para cambiar la contraseña, **para** que un enlace de reset no dé acceso a la API ni un token de sesión robado permita cambiar la contraseña.

Hoy ambos tokens se firman con el mismo `JWT_SEED` y el mismo payload `{ id }`, así que son intercambiables.

**Criterios de aceptación**
- El token de reset incluye un claim de propósito (ej. `purpose: 'reset-password'`) o se firma con un secreto distinto.
- `AuthMiddleware` rechaza tokens de reset.
- `/auth/reset-password/:token` rechaza tokens de sesión.
- El token de reset es de un solo uso: deja de ser válido tras cambiar la contraseña (ej. incluir un hash parcial de la contraseña actual en el token).

> **Nota:** los tokens de sesión ahora llevan `purpose: 'session'` y el middleware lo exige, así que los tokens emitidos antes del cambio dejan de valer (hay que volver a iniciar sesión una vez).

### US-02 — No exponer credenciales de BD en logs
**Como** responsable de la infraestructura, **quiero** que la API no imprima la cadena de conexión de la base de datos, **para** que el usuario y la contraseña no queden en los logs del servidor.

**Criterios de aceptación**
- Se elimina `console.log(envs.POSTGRES_URL)` de `src/data/postgres/index.ts`.
- Ningún log muestra secretos (`POSTGRES_URL`, `JWT_SEED`, `SENDGRID_API_KEY`).

### US-03 — Apertura y cierre de caja atómicos
**Como** cajero, **quiero** que no se puedan abrir dos cajas al mismo tiempo ni registrar ventas durante el cierre, **para** que los totales del cierre siempre sean correctos.

Hoy `OpenCashRegister` hace `findActive()` y luego `open()` sin transacción, y `CloseCashRegister` calcula el balance y después cierra, sin bloquear las ventas nuevas.

**Criterios de aceptación**
- Existe un índice único parcial en BD que impide más de un `CashRegisterRecord` con `status = 'OPEN'`.
- La apertura y el cierre corren dentro de `prisma.$transaction`.
- Dos peticiones simultáneas de apertura: una responde 200 y la otra 400 (nunca 500).
- Un segundo cierre simultáneo de la misma caja responde 400.

### US-04 — Montos con precisión decimal
**Como** administrador, **quiero** que los montos se guarden con precisión exacta, **para** evitar errores de redondeo en totales y diferencias de caja.

**Criterios de aceptación**
- Los campos de dinero (`cash`, `amountToCharge`, `cashProvided`, `changeReturned`, `amount`, totales del cierre) usan `Decimal(12,2)` en Prisma.
- Hay una migración que convierte los datos existentes sin pérdida.
- La API sigue respondiendo números en JSON (o se documenta el cambio a string).

### US-05 — Evitar enumeración de usuarios en "olvidé mi contraseña"
**Como** usuario, **quiero** que el sistema no revele si mi email está registrado, **para** que nadie pueda descubrir qué cuentas existen.

**Criterios de aceptación**
- `/auth/forgot-password` responde siempre el mismo mensaje y código, exista o no el email.
- Los usuarios deshabilitados (`available = false`) no reciben el correo de reset.

### US-06 — Protección contra fuerza bruta y cabeceras seguras
**Como** administrador del sistema, **quiero** limitar los intentos de login y añadir cabeceras de seguridad, **para** dificultar ataques de fuerza bruta.

**Criterios de aceptación**
- `/auth/login` y `/auth/forgot-password` tienen límite de peticiones por IP (ej. `express-rate-limit`) y responden 429 al excederlo.
- Se usa `helmet` en el servidor.

---

## 🟡 Prioridad media

### US-07 — Corregir `.env.template` y configuración local
**Como** desarrollador nuevo, **quiero** que el `.env.template` funcione tal cual con `docker-compose`, **para** levantar el proyecto sin depurar la conexión.

**Criterios de aceptación**
- El nombre de BD de `POSTGRES_URL` coincide con `POSTGRES_DB` (hoy son `CAJA` y `Caja`; Postgres distingue mayúsculas).
- La plantilla no contiene datos personales (email real, URL de ngrok).
- pgAdmin no usa credenciales fijas `admin/admin` (se leen del `.env`).

### US-08 — Límite máximo en la paginación
**Como** administrador del sistema, **quiero** que los listados tengan un límite máximo por página, **para** que una petición con `limit` muy grande no sature la BD.

**Criterios de aceptación**
- `PaginationDto` rechaza o recorta `limit` mayor a un máximo (ej. 100).
- El listado de cajas no carga todas las transacciones de cada caja (solo un resumen o un endpoint aparte).

> **Nota:** `limit > 100` responde 400. `GET /cash-registers` ya no incluye `transactions` ni `cashInOut`; devuelve un `summary` por caja (`transactionsCount`, `totalTransactions`, `cashInOutCount`, `totalCashIn`, `totalCashOut`), calculado con `groupBy` en la BD. El detalle sigue en `GET /cash-registers/:id`.

### US-09 — Errores de base de datos con respuestas claras
**Como** consumidor de la API (frontend), **quiero** recibir errores 4xx descriptivos en vez de 500, **para** mostrar mensajes útiles al usuario.

**Criterios de aceptación**
- `ErrorMiddleware` traduce errores de Prisma: `P2002` → 400 "ya existe", `P2025` → 404.
- Actualizar un usuario con un email ya usado responde 400.
- Las entidades lanzan `CustomError` en lugar de strings.

### US-10 — Emails normalizados y validados
**Como** usuario, **quiero** poder iniciar sesión sin importar mayúsculas en mi email, **para** no quedar bloqueado por un detalle de escritura.

**Criterios de aceptación**
- Crear, actualizar, login y forgot-password aplican `trim().toLowerCase()` al email.
- `CreateUserDto` y `UpdateUserDto` validan el formato con `regularExps.email`.

### US-11 — 404 en JSON para rutas `/api` inexistentes
**Como** desarrollador del frontend, **quiero** que una ruta `/api/...` inexistente responda 404 en JSON, **para** no recibir el `index.html` de la SPA por error.

**Criterios de aceptación**
- `/api/*` sin coincidencia responde `404 { error: 'Not found' }`.
- El fallback de la SPA usa `path.join(__dirname, '../../', publicPath, 'index.html')` en vez de concatenar strings.
- Un origen bloqueado por CORS responde en JSON a través de `ErrorMiddleware`.

### US-12 — Email opcional en desarrollo
**Como** desarrollador, **quiero** levantar la API sin una API key de SendGrid cuando `SEND_EMAIL=false`, **para** no necesitar credenciales reales en local.

**Criterios de aceptación**
- `SENDGRID_API_KEY` solo es obligatoria si `SEND_EMAIL=true`.

---

## 🟢 Baja prioridad (deuda técnica)

### US-13 — Usuario autenticado en `req.user`
**Como** desarrollador, **quiero** que el middleware deje el usuario en `req.user` y no en `req.body.user`, **para** no mezclarlo con los datos que envía el cliente.

**Criterios de aceptación**
- `AuthMiddleware` asigna `req.user` (tipado en `src/types/express.d.ts`).
- Los controladores leen `req.user`.

### US-14 — Respetar la regla de dependencias de Clean Architecture
**Como** desarrollador, **quiero** que el dominio no dependa de infraestructura ni de `config`, **para** poder testear los casos de uso de forma aislada.

**Criterios de aceptación**
- `ForgotPassword` depende de una interfaz `EmailSender` del dominio, no de `EmailService`.
- Los adaptadores JWT y bcrypt se inyectan por constructor en todos los casos de uso. Hoy `LoginUser` recibe `signToken` y `comparePassword` pero no los usa.

### US-15 — Limpiar código muerto y restos de la plantilla
**Como** desarrollador, **quiero** eliminar el código sin uso, **para** que el proyecto sea más fácil de entender.

**Criterios de aceptación**
- Se eliminan `todo.entity.ts` y `register-user.dto.ts` (sin uso).
- Se evalúa eliminar la migración `todo` de 2023.
- Se eliminan los `if (!record)` que nunca se cumplen porque `findById` ya lanza `notFound`.
- `Closing` usa `onDelete: Cascade` como las demás relaciones de `CashRegisterRecord`.

> **Decisión:** la migración `20230904201308_init` (tabla `todo`) se conserva. Ya está aplicada en las BD existentes y borrarla rompe el historial de `prisma migrate`; la migración siguiente ya elimina la tabla.

### US-16 — Tests automatizados y linter
**Como** desarrollador, **quiero** tener tests y un linter, **para** hacer cambios sin miedo a romper la lógica de caja.

**Criterios de aceptación**
- Jest o Vitest configurado con `npm test`.
- Tests unitarios para `CashCalculatorHelper`, `DenominationHelper`, `SalesCalculatorHelper` y los DTOs de caja.
- ESLint y Prettier configurados.
- CI que ejecuta tests y `tsc` en cada PR.

### US-17 — Despliegue con Docker y scripts de producción
**Como** responsable del despliegue, **quiero** un Dockerfile de la API y scripts separados de build y start, **para** desplegar de forma reproducible.

**Criterios de aceptación**
- `npm start` solo ejecuta `node dist/app.js`; la compilación queda en `npm run build`.
- `npm run dev` no ejecuta `prisma migrate dev` en cada arranque.
- Hay un `Dockerfile` multi-stage para la API.

---

## ✅ Completado

### US-18 — Dashboard de ventas
**Como** administrador, **quiero** ver las ventas por empleado y los totales del día, la semana, el mes y el año, **para** conocer el rendimiento del negocio desde el frontend.

**Criterios de aceptación**
- `GET /api/v1/dashboard/summary`: totales de hoy, semana, mes y año (monto, número de ventas, ticket promedio).
- `GET /api/v1/dashboard/sales-by-employee`: ventas por empleado en un rango de fechas, con porcentaje del total.
- `GET /api/v1/dashboard/sales-over-time`: serie de ventas por día, semana o mes, opcionalmente filtrada por empleado.
- Solo accesible para `ADMIN`.
- Los periodos respetan la zona horaria del negocio (`TIMEZONE`).

Documentación de los endpoints: [dashboard-api.md](./dashboard-api.md).
