# Backlog — caja-api

Pendientes detectados en el análisis del proyecto (octubre 2026), escritos como User Stories.

**Prioridad:** 🔴 Alta (seguridad o integridad de datos) · 🟡 Media (bugs o robustez) · 🟢 Baja (deuda técnica)

| ID | Historia | Prioridad | Estado |
|----|----------|-----------|--------|
| US-01 | Separar tokens de sesión y de reset de contraseña | 🔴 | ✅ Hecho (rama `staging`) |
| US-02 | No exponer credenciales de BD en logs | 🔴 | ✅ Hecho (rama `staging`) |
| US-03 | Apertura y cierre de caja atómicos | 🔴 | ✅ Hecho (rama `staging`) |
| US-04 | Montos con precisión decimal | 🔴 | ✅ Hecho (rama `staging`) |
| US-05 | Evitar enumeración de usuarios en "olvidé mi contraseña" | 🔴 | ✅ Hecho (rama `staging`) |
| US-06 | Protección contra fuerza bruta y cabeceras seguras | 🔴 | ✅ Hecho (rama `staging`) |
| US-07 | Corregir `.env.template` y configuración local | 🟡 | ✅ Hecho (rama `staging`) |
| US-08 | Límite máximo en la paginación | 🟡 | ✅ Hecho (rama `staging`) |
| US-09 | Errores de base de datos con respuestas claras | 🟡 | ✅ Hecho (rama `staging`) |
| US-10 | Emails normalizados y validados | 🟡 | Pendiente |
| US-11 | 404 en JSON para rutas `/api` inexistentes | 🟡 | ✅ Hecho (rama `staging`) |
| US-12 | Email opcional en desarrollo | 🟡 | ✅ Hecho (rama `staging`) |
| US-13 | Usuario autenticado en `req.user` | 🟢 | ✅ Hecho (rama `staging`) |
| US-14 | Respetar la regla de dependencias de Clean Architecture | 🟢 | ✅ Hecho (rama `staging`) |
| US-15 | Limpiar código muerto y restos de la plantilla | 🟢 | ✅ Hecho (rama `staging`) |
| US-16 | Tests automatizados y linter | 🟢 | Pendiente |
| US-17 | Despliegue con Docker y scripts de producción | 🟢 | Pendiente |
| US-18 | Dashboard de ventas | — | ✅ Hecho (rama `staging`) |
| US-19 | Catálogo de proveedores | — | ✅ Hecho (rama `staging`) |
| US-20 | Importación masiva de DTE de compras | — | ✅ Hecho (rama `staging`) |
| US-21 | Vincular notas de crédito con su crédito fiscal | — | ✅ Hecho (rama `staging`) |
| US-22 | Consultar documentos de compra | — | ✅ Hecho (rama `staging`) |
| US-23 | Anular y reactivar documentos de compra | — | ✅ Hecho (rama `staging`) |
| US-24 | Reportes de compras e IVA | — | ✅ Hecho (rama `staging`) |
| US-25 | Análisis de precios de productos | — | ✅ Hecho (rama `staging`) |
| US-26 | Unir variantes de un mismo producto | 🟡 | ✅ Hecho (rama `staging`) |
| US-27 | Guardar el código del producto al importar | 🟢 | Pendiente |
| US-28 | Descontar del precio las devoluciones de producto | 🟢 | Pendiente |
| US-29 | Comparar un producto entre proveedores | 🟢 | Pendiente |

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

> **Nota:** el índice está declarado en el schema (`@@unique(..., where: raw(...))`, preview feature `partialIndexes`). El cierre bloquea la caja con `SELECT ... FOR UPDATE` y valida los totales dentro de la transacción; las ventas y movimientos toman un bloqueo compartido (`FOR SHARE`), así que esperan al cierre y después lo ven como cerrado. El seed abre y cierra las cajas una por una.

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

> **Nota:** login: 10 intentos **fallidos** por IP cada 15 min (los exitosos no cuentan); forgot-password: 5 por IP cada 15 min. Detrás de un proxy (Railway) Express necesita `trust proxy` para ver la IP real: se configura con `TRUST_PROXY` (por defecto `1`). Los contadores viven en memoria, así que valen mientras la API corra en una sola instancia.

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
- (También `MAILER_EMAIL`.)

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

> **Nota:** los contratos viven en `src/domain/interfaces` (`EmailSender`, `SignToken`, `HashPassword`, …, y `TokenPurpose`). Los controladores inyectan `JwtAdapter`, `bcryptAdapter` y `EmailService`. El dominio ya no importa nada de `config` ni de `infrastructure`.

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

## 📥 Registro de compras (DTE)

Registrar los Documentos Tributarios Electrónicos de compra (créditos fiscales y notas de crédito) a partir de su JSON, para controlar compras e IVA. Diseño técnico, reglas de lectura del JSON y modelo de datos: [compras-dte.md](./compras-dte.md). Referencia de endpoints: [compras-api.md](./compras-api.md).

Todas las historias son solo para `ADMIN`. El frontend vive en otro repositorio; cada historia necesita su pantalla allí.

### US-19 — Catálogo de proveedores
**Como** administrador, **quiero** que los proveedores se registren solos a partir de los documentos que importo, **para** no tener que darlos de alta a mano y poder ver las compras por proveedor.

**Criterios de aceptación**
- Al importar un DTE, el emisor se busca por NIT; si no existe se crea con NIT, NRC, nombre, nombre comercial, actividad económica, teléfono y correo.
- Si ya existe, sus datos se actualizan con los del documento más reciente (por fecha de emisión).
- `GET /api/v1/suppliers`: listado paginado con búsqueda por nombre o NIT.
- `GET /api/v1/suppliers/:id`: detalle del proveedor.
- Los proveedores no se crean, editan ni borran manualmente.

### US-20 — Importación masiva de DTE de compras
**Como** administrador, **quiero** subir varios archivos JSON de facturas a la vez, **para** registrar mis compras sin capturarlas a mano.

**Criterios de aceptación**
- `POST /api/v1/purchase-documents/import` recibe archivos `.json` (multipart). Máximo 100 archivos por carga y 1 MB por archivo; si se exceden, la carga completa responde `400`.
- Solo se acepta el JSON; el PDF no se sube ni se guardan archivos en disco.
- Lee archivos en UTF-8 y en Latin-1 (varios proveedores envían Latin-1).
- Se aceptan solo créditos fiscales (`tipoDte = 03`) y notas de crédito (`tipoDte = 05`).
- Un archivo se **rechaza** si:
  - no es un JSON válido o no tiene la estructura de un DTE;
  - su tipo no es `03` ni `05`;
  - es del ambiente de pruebas (`ambiente ≠ 01`);
  - no tiene sello de recepción (se busca en `selloRecibido` y en `respuestaHacienda.selloRecibido`);
  - el NRC del receptor no está en `RECEIVER_NRCS`;
  - su código de generación ya está registrado o se repite dentro de la misma carga.
- Un archivo se importa **con advertencia** si:
  - Hacienda lo recibió con observaciones (se guardan las observaciones);
  - sus totales no cuadran (IVA ≠ 13 % del gravado, o suma de líneas ≠ total gravado, con tolerancia de $0.01).
- La carga es parcial: los archivos válidos se importan aunque otros fallen. La respuesta trae el resultado por archivo (`imported`, `rejected` con motivo, `warnings`) y un conteo total.
- Se guardan encabezado, totales, líneas de detalle y el JSON original completo.
- Cada documento queda asociado al usuario que lo importó.

### US-21 — Vincular notas de crédito con su crédito fiscal
**Como** administrador, **quiero** que cada nota de crédito quede ligada al crédito fiscal que modifica, **para** conocer el monto neto real de cada compra.

**Criterios de aceptación**
- Al importar una nota de crédito, cada `documentoRelacionado` electrónico (`tipoGeneracion = 2`) se vincula con el crédito fiscal que tenga ese código de generación.
- Si el crédito fiscal aún no está registrado, la relación queda **pendiente de vincular** y la respuesta de la carga lo advierte.
- Al importar después ese crédito fiscal, las notas pendientes se vinculan solas, también si ambos vienen en la misma carga y en cualquier orden.
- Las relaciones con documentos físicos (`tipoGeneracion = 1`) se guardan pero no se intentan vincular.
- `GET /api/v1/purchase-documents?pendingLink=true` lista las notas de crédito pendientes de vincular.
- El aviso es solo en la aplicación; no se envía correo.

### US-22 — Consultar documentos de compra
**Como** administrador, **quiero** buscar y ver el detalle de mis documentos de compra, **para** revisar lo que he importado.

**Criterios de aceptación**
- `GET /api/v1/purchase-documents`: listado paginado, ordenado por fecha de emisión descendente, con filtros por tipo, proveedor, rango de fechas, NRC receptor, estado (activo / anulado), con advertencias y pendientes de vincular.
- `GET /api/v1/purchase-documents/:id`: encabezado, totales, líneas, proveedor, documentos relacionados (en ambos sentidos), advertencias y datos de anulación.
- Los documentos no se pueden editar.

### US-23 — Anular y reactivar documentos de compra
**Como** administrador, **quiero** anular un documento importado, **para** sacarlo de los reportes cuando no corresponde, y poder revertirlo si me equivoco.

**Criterios de aceptación**
- `PATCH /api/v1/purchase-documents/:id/void` con `reason` obligatorio; guarda motivo, fecha y usuario.
- `PATCH /api/v1/purchase-documents/:id/unvoid` reactiva el documento y limpia los datos de anulación.
- Anular un documento ya anulado, o reactivar uno activo, responde `400`.
- Los documentos anulados no cuentan en ningún reporte.
- Anular un crédito fiscal con notas de crédito vinculadas lo permite, pero la respuesta lo advierte.
- Anular en el sistema no anula nada en Hacienda; eso solo lo hace el emisor.

### US-24 — Reportes de compras e IVA
**Como** administrador, **quiero** ver el IVA de mis compras y cuánto le compro a cada proveedor, **para** controlar mi crédito fiscal y mis gastos.

**Criterios de aceptación**
- Cada documento cuenta en el mes de su fecha de emisión.
- Las notas de crédito restan; los documentos anulados no cuentan. Las notas pendientes de vincular sí cuentan.
- `GET /api/v1/purchase-reports/iva-summary?year=`: por mes, compras gravadas, IVA crédito fiscal (13 %), IVA percibido (1 %), notas de crédito y neto.
- `GET /api/v1/purchase-reports/summary?from=&to=`: total de compras, IVA, percepción y número de documentos en el rango.
- `GET /api/v1/purchase-reports/by-supplier?from=&to=`: totales por proveedor con porcentaje del total.
- Todos los reportes aceptan filtro por NRC receptor.

---

## 📈 Análisis de precios de productos

Seguir el precio de lo que se compra a cada proveedor a partir de las líneas de los créditos fiscales. Reglas de cálculo, endpoints y hallazgos en los datos: [productos-api.md](./productos-api.md).

### US-25 — Análisis de precios de productos
**Como** administrador, **quiero** ver cómo cambia el precio de cada producto que compro, **para** saber cuánto han subido y hacia dónde van.

**Criterios de aceptación**
- `GET /api/v1/purchase-products`: productos del periodo (`months` = últimos N meses o `all`) con último precio, variación del periodo, tendencia mensual con su R² y gasto. Búsqueda sin acentos, filtro por proveedor, orden y paginación.
- `GET /api/v1/purchase-products/history?key=`: compras una por una, resumen por mes y proyección a 3 meses si hay tendencia.
- Solo cuentan los créditos fiscales activos. Se excluyen las notas de crédito y las bonificaciones (rotuladas, de monto 0 o de $0.01 o menos).
- El precio es el de lista menos el descuento, sin IVA.
- La tendencia no se calcula con menos de 4 compras o menos de 60 días.

### US-26 — Unir variantes de un mismo producto 🟡
**Como** administrador, **quiero** indicar que dos nombres o códigos de un proveedor son el mismo producto, **para** que su historial de precios no quede partido cuando el proveedor cambia la redacción.

**Contexto:** Hernández Hermanos no manda código y renombró sus productos en mayo 2025 (`CHORIZO BARBACOA 454 g` → `CHORIZO BARBACOA 454 g 8U`, mismo precio): aparece con 47 productos que son unos 20 reales. San Valentín usa el mismo código con dos unidades de medida. Detalle en [productos-api.md](./productos-api.md#pendientes).

**Criterios de aceptación**
- Se pueden asignar una o más variantes (código o nombre + unidad de medida) a un producto principal del mismo proveedor, y deshacer la asignación.
- El listado y el historial muestran el producto principal con las compras de todas sus variantes.
- Opcional: sugerir variantes probables (mismo proveedor, nombre parecido, mismo precio en fechas que no se traslapan) para confirmarlas con un clic.

**Implementación:** tabla `ProductVariant` (variante → principal, sin cadenas) y `ProductSuggestionDismissal` (sugerencias descartadas). Endpoints `GET /purchase-products/suggestions`, `POST /purchase-products/suggestions/dismiss`, `GET|POST|DELETE /purchase-products/merges`. Las sugerencias agrupan por nombre normalizado y no mezclan unidades con precios distintos (Avícola facturó por bolsa lo que factura por libra). Detalle en [productos-api.md](./productos-api.md#variantes-unir-el-mismo-producto-con-otro-nombre-o-código).

### US-27 — Guardar el código del producto al importar 🟢
**Como** administrador, **quiero** que el código y el nombre del producto se extraigan al importar el DTE, **para** enterarme si un proveedor cambia el formato en lugar de que sus productos se partan sin aviso.

**Criterios de aceptación**
- Cada línea guarda el código y el nombre de producto calculados con las reglas de [productos-api.md](./productos-api.md#cómo-se-arma-el-análisis) (migración que los calcula para las líneas existentes).
- La importación advierte cuando una línea de Avícola Salvadoreña no tiene el formato `código|...`.
- El análisis de precios usa los campos guardados en lugar de calcularlos en cada consulta.

### US-28 — Descontar del precio las devoluciones de producto 🟢
**Como** administrador, **quiero** que las notas de crédito por devolución de un producto se reflejen en su precio, **para** ver lo que realmente pagué.

**Contexto:** las notas de crédito son el 3.65 % de las compras. La mayoría es `DESCUENTO POR MERMA` (general, sin producto), pero hay devoluciones de producto de Avícola Campestre (`POLLO EN 1/4 PECHUGA SIN ALA`, $6,004).

**Criterios de aceptación**
- Las líneas de nota de crédito con el código de un producto ajustan el precio de ese producto en la compra que modifican.
- Los descuentos generales (sin código de producto) no se reparten entre productos y se siguen viendo solo en los reportes.

### US-29 — Comparar un producto entre proveedores 🟢
**Como** administrador, **quiero** agrupar productos equivalentes de distintos proveedores, **para** comparar quién me vende más barato.

**Criterios de aceptación**
- Existe un catálogo propio de productos al que se asignan los productos de cada proveedor.
- Para un producto del catálogo se ve el precio de cada proveedor en el tiempo, en la misma unidad de medida.

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
