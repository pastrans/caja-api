# Compras (DTE) — guía para el frontend

Qué construir en el frontend para el módulo de compras y qué reglas respetar. Los detalles de cada endpoint (parámetros, respuestas, errores) están en [compras-api.md](./compras-api.md); este documento no los repite.

## Qué es el módulo

El negocio recibe por correo las facturas de sus proveedores como **DTE** (Documento Tributario Electrónico de El Salvador): un archivo JSON y un PDF. El módulo permite subir los JSON, consultarlos y ver cuánto se compra y cuánto IVA se paga.

Solo maneja dos tipos de documento:

| Tipo en la API | Nombre para el usuario | Efecto |
|---|---|---|
| `CREDITO_FISCAL` | Crédito fiscal | Una compra |
| `NOTA_CREDITO` | Nota de crédito | Un descuento o devolución sobre un crédito fiscal: **resta** |

Glosario mínimo para las etiquetas:

| Campo | Etiqueta sugerida | Qué es |
|---|---|---|
| `generationCode` | Código de generación | Identificador único del DTE (UUID) |
| `controlNumber` | Número de control | Correlativo del proveedor |
| `receptionStamp` | Sello de recepción | Lo pone Hacienda; da validez al documento |
| `receiverNrc` | NRC receptor | Número de registro de IVA del negocio |
| `totals.ivaAmount` | IVA (13 %) | |
| `totals.ivaPerceived` | IVA percibido (1 %) | Lo cobran los grandes contribuyentes; también es crédito de IVA |
| `operationCondition` | Condición | 1 Contado, 2 Crédito, 3 Otro |

## Acceso

Todo el módulo es solo para usuarios `ADMIN`. Oculta el menú de Compras a los `CASHIER`; si aun así llaman a la API, reciben `403`.

## Pantallas

### 1. Importar DTE

**Objetivo:** subir muchos JSON a la vez y ver qué pasó con cada uno.

- Zona para arrastrar archivos y botón para seleccionarlos, con selección múltiple. Acepta solo `.json`.
- Antes de enviar, validar en el navegador: solo `.json`, máximo 100 archivos y 1 MB por archivo. El backend lo valida igual, pero así el usuario no espera para nada.
- Enviar `multipart/form-data` con todos los archivos en el campo `files`: `POST /api/v1/purchase-documents/import`.
- Mostrar un indicador de carga: con muchos archivos puede tardar unos segundos.

**Resultado** (la respuesta siempre es `200` si la petición llegó bien):

- Resumen arriba con los contadores de `summary`: recibidos, importados, rechazados y con advertencias.
- Tabla con una fila por archivo, en el mismo orden en que se enviaron:
  - Nombre del archivo.
  - Estado: ✅ Importado o ❌ Rechazado.
  - Si se importó: tipo y enlace al detalle (`documentId`). Si `linkedCreditNotes > 0`: "Se vincularon N notas de crédito".
  - Si se rechazó: motivo traducido (tabla de traducciones abajo).
  - Advertencias traducidas, si hay.
- Que el usuario pueda filtrar la tabla para ver solo rechazados o solo con advertencias.
- Botón "Ver documentos importados" que lleve al listado.

Si la respuesta es `400` (sin archivos, más de 100, archivo de más de 1 MB), mostrar el error general: no se importó nada.

### 2. Listado de documentos

`GET /api/v1/purchase-documents`

Columnas sugeridas: fecha de emisión, tipo, proveedor, número de control, total, estado.

- **Total:** `totals.total`. Para notas de crédito mostrarlo en negativo o con otro color, porque restan.
- **Estado** con insignias, que pueden combinarse:
  - "Anulado" si `voided` no es `null`.
  - "Con advertencias" si `warnings` no está vacío.
  - "Pendiente de vincular" si `pendingLinks` no está vacío.

Filtros (cada uno es un parámetro de la URL):

| Filtro en pantalla | Parámetro |
|---|---|
| Tipo | `type` |
| Proveedor (selector, ver pantalla 4) | `supplierId` |
| Rango de fechas | `from`, `to` |
| Estado: Activos / Anulados / Todos | `status` = `active` / `voided` / `all` |
| Solo con advertencias | `withWarnings=true` |
| Solo pendientes de vincular | `pendingLink=true` |

`receiverNrc` solo hace falta si el negocio llega a tener más de un NRC; por ahora puede omitirse.

**Paginación:** usar `page` y `limit` junto con los filtros. **No** usar los enlaces `next` y `prev` de la respuesta: no conservan los filtros.

Conviene tener un acceso directo a "Notas de crédito pendientes de vincular" (`?pendingLink=true`), porque son las que el usuario debe resolver importando el crédito fiscal que falta.

### 3. Detalle del documento

`GET /api/v1/purchase-documents/:id`

Secciones:

1. **Encabezado:** tipo, fecha y hora de emisión, número de control, código de generación, sello de recepción, condición, quién lo importó y cuándo.
2. **Proveedor:** nombre y NIT, con enlace al proveedor.
3. **Productos** (`items`): descripción, código, cantidad, precio unitario, descuento y monto gravado (`taxedSale`). En las notas de crédito suelen ser conceptos como "DESCUENTO POR MERMA".
4. **Totales** (`totals`): gravado, exento, no sujeto, descuento, subtotal, IVA 13 %, IVA percibido 1 %, IVA retenido, renta retenida y total. Mostrar en cero o esconder los que vengan en 0, a criterio del diseño; total, gravado e IVA siempre visibles.
5. **Documentos relacionados:**
   - En una **nota de crédito** (`relatedDocuments`): el crédito fiscal que modifica, con enlace a su detalle (`document.id`). Si `document` es `null` y `generationType` es 2: "Pendiente de vincular: importa el crédito fiscal `relatedDocumentNumber`". Si `generationType` es 1: "Documento físico" (no se puede vincular).
   - En un **crédito fiscal** (`creditNotes`): lista de sus notas de crédito con enlace, total e indicador si están anuladas.
6. **Advertencias** (`warnings` y `pendingLinks`), traducidas.
7. **Anulación** (si `voided` no es `null`): banner con fecha, motivo y usuario.

Acciones:

- **Anular** (solo si está activo): abre un modal con el motivo, obligatorio y de máximo 500 caracteres. Debe aclarar que anular solo lo saca de los reportes del sistema y **no lo anula en Hacienda**.
  - `PATCH /:id/void` con `{ "reason": "..." }`.
  - Si la respuesta trae `HAS_CREDIT_NOTES` en `warnings`: avisar que sus notas de crédito siguen activas y siguen restando, y ofrecer ir a ellas.
- **Reactivar** (solo si está anulado): confirmación simple. `PATCH /:id/unvoid`.
- No hay edición ni borrado: los documentos no se modifican.

Después de anular o reactivar, refrescar con el documento que devuelve la respuesta (en anular, `document`; en reactivar, la respuesta es el documento).

### 4. Proveedores

`GET /api/v1/suppliers` (con `search`) y `GET /api/v1/suppliers/:id`

- Listado con búsqueda por nombre o NIT. Columnas: nombre, nombre comercial, NIT, NRC, teléfono, correo y fecha del último documento (`lastIssueDate`).
- Detalle con sus datos, un acceso "Ver documentos" (listado con `supplierId`) y un bloque de compras del proveedor:
  - **Totales del periodo:** `GET /api/v1/purchase-reports/summary?supplierId=:id`. Selector de rango con la misma regla de los reportes: primera carga sin `from`/`to` (mes en curso) y el selector toma el `from` y `to` de la respuesta. Tarjetas: total neto, crédito de IVA y número de créditos fiscales y notas de crédito. Si no compró en el rango, llega todo en cero: mostrar "Sin compras en este periodo".
  - **Opcional, compras por mes:** `GET /api/v1/purchase-reports/iva-summary?supplierId=:id` (12 meses del año, para un gráfico o tabla).
  - No usar `by-supplier` para esto: solo incluye proveedores con compras en el rango.
- Solo lectura: los proveedores se crean y actualizan solos al importar. No hay alta ni edición.
- El mismo listado sirve para el selector de proveedor de los filtros (`search` y `limit=100`).

### 5. Reportes

Reglas que comparten los tres reportes:

- Los documentos anulados no cuentan.
- `creditosFiscales` y `notasCredito` vienen por separado y con montos en positivo; `net` ya es la resta (créditos fiscales − notas de crédito). **Mostrar `net` como cifra principal.**
- `net.ivaCredit` = IVA 13 % + IVA percibido 1 %: es el crédito de IVA del periodo. Etiqueta sugerida: "Crédito fiscal de IVA".
- **Fechas por defecto:** el backend calcula "hoy" con la zona horaria del negocio (`TIMEZONE`). Para no desfasarse cerca de la medianoche o si el navegador está en otra zona, el frontend **no calcula "hoy" por su cuenta**. En la primera carga llama sin `from`/`to` (o sin `year`) y llena los selectores con los valores que trae la respuesta (`from` y `to` en `summary` y `by-supplier`; `year` en `iva-summary`). Después envía las fechas que elija el usuario.

**a) Resumen de IVA mensual** — `GET /api/v1/purchase-reports/iva-summary?year=`

- Selector de año. Primera carga sin `year`; el año mostrado es el `year` de la respuesta.
- Tabla de 12 filas (siempre llegan los 12 meses): mes, compras gravadas (`net.taxed`), IVA (`net.iva`), IVA percibido (`net.ivaPerceived`), crédito de IVA (`net.ivaCredit`), total (`net.total`), número de créditos fiscales y de notas de crédito. Fila final con `total`.
- Opcional: gráfico de barras por mes con `net.total` o `net.ivaCredit`.

**b) Total de compras** — `GET /api/v1/purchase-reports/summary?from=&to=`

- Selector de rango. Primera carga sin `from`/`to` (el backend usa el mes en curso) y el selector toma el `from` y `to` de la respuesta.
- Tarjetas: total neto, crédito de IVA, número de créditos fiscales y de notas de crédito, y monto de notas de crédito.

**c) Compras por proveedor** — `GET /api/v1/purchase-reports/by-supplier?from=&to=`

- Mismo selector de rango y misma regla para la primera carga.
- Tabla ordenada como llega (de mayor a menor): proveedor, documentos, total neto, IVA, IVA percibido y porcentaje (`percentage`).
- Opcional: gráfico de barras horizontales o de dona con `percentage`.
- Clic en un proveedor: listado de documentos filtrado por `supplierId` y el mismo rango.

## Reglas de formato

- **Fechas sin hora** (`issueDate`, `relatedIssueDate`, `lastIssueDate`): llegan como `YYYY-MM-DD`. Mostrarlas tal cual o formatearlas como texto. **No** convertirlas con `new Date('2026-10-13')`: lo interpreta como medianoche UTC y en El Salvador se muestra el día anterior.
- **Fechas con hora** (`createdAt`, `voided.voidedAt`): son ISO en UTC; mostrarlas en hora local.
- **Montos:** dólares con 2 decimales (`$1,237.78`). `unitPrice` puede traer hasta 6 decimales y `quantity` hasta 4.
- **Errores:** las respuestas de error tienen la forma `{ "error": "mensaje" }`, con el mensaje en inglés. Para los códigos de la importación y la anulación, usar la tabla de traducciones de abajo.

## Traducciones de códigos

Motivos de rechazo de la importación (`reason`):

| Código | Texto sugerido |
|---|---|
| `INVALID_FILE` | Solo se aceptan archivos .json |
| `INVALID_JSON` | El archivo no es un JSON válido |
| `INVALID_STRUCTURE` | El archivo no es un DTE válido |
| `UNSUPPORTED_TYPE` | Tipo de documento no soportado (solo créditos fiscales y notas de crédito) |
| `TEST_ENVIRONMENT` | Es un documento de pruebas, no tiene validez |
| `MISSING_STAMP` | No tiene sello de recepción de Hacienda |
| `RECEIVER_MISMATCH` | El documento no está emitido a nombre del negocio (NRC distinto) |
| `DUPLICATE` | El documento ya estaba registrado o venía repetido en esta carga |
| `INTERNAL_ERROR` | Error inesperado al guardar; intenta de nuevo |

Advertencias (`warnings[].code`). Todas tienen la forma `{ code, message }`:

| Código | Dónde aparece | Texto sugerido |
|---|---|---|
| `MH_OBSERVATIONS` | Importación, listado y detalle | Hacienda lo recibió con observaciones (el documento es válido) |
| `TOTALS_MISMATCH` | Importación, listado y detalle | Los totales del documento no cuadran (error del proveedor; el documento es válido) |
| `PENDING_LINK` | Solo en la importación | Nota de crédito pendiente de vincular: falta importar su crédito fiscal |
| `PRODUCT_FORMAT_CHANGED` | Solo en la importación | El proveedor cambió el formato de sus productos: algunas líneas no traen el código de siempre |
| `PRODUCT_UNIT_CHANGED` | Solo en la importación | Un producto se facturó en una unidad distinta de la habitual (por ejemplo, por bolsa en vez de por libra) |
| `HAS_CREDIT_NOTES` | Solo en la respuesta de anular | Este crédito fiscal tiene notas de crédito activas que siguen contando en los reportes |

En el listado y el detalle, "pendiente de vincular" no viene en `warnings` sino en `pendingLinks` (`string[]` con los códigos de los créditos fiscales que faltan). Muestra la insignia cuando `pendingLinks` no esté vacío.

Para `INVALID_STRUCTURE`, `MH_OBSERVATIONS` y `TOTALS_MISMATCH`, mostrar también el `message` original como detalle técnico (por ejemplo en un tooltip): dice qué campo falta o qué observó Hacienda.

## Orden sugerido

1. Importar DTE (pantalla 1): es la entrada de todos los datos.
2. Listado y detalle (pantallas 2 y 3), con anular y reactivar.
3. Proveedores (pantalla 4).
4. Reportes (pantalla 5).

## Fuera de alcance

- Subir o ver el PDF: solo se guarda el JSON.
- Editar o borrar documentos o proveedores.
- Registrar pagos o cuentas por pagar.
- Otros tipos de DTE (facturas de consumidor final, notas de débito, sujeto excluido).
