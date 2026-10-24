# Registro de compras (DTE) — diseño

Diseño técnico de las historias US-19 a US-24 de [BACKLOG.md](./BACKLOG.md). Basado en el análisis de 49 DTE reales de octubre 2026 (38 créditos fiscales y 11 notas de crédito de 5 proveedores).

## Contexto

En El Salvador las compras se documentan con **DTE** (Documento Tributario Electrónico). El emisor lo transmite a Hacienda, que le asigna un **sello de recepción**: ese sello es lo que da validez fiscal al documento. El receptor lo recibe por correo como JSON (los datos) y PDF (la versión legible).

Conceptos que aparecen en el modelo:

| Concepto | Qué es |
|---|---|
| Código de generación | UUID que identifica al DTE de forma única. Es la clave para evitar duplicados. |
| Número de control | Correlativo del emisor (`DTE-03-M001P001-000000000168613`). |
| Sello de recepción | Lo asigna Hacienda al aceptar el DTE. |
| NRC | Número de Registro de Contribuyente de IVA. Identifica al receptor de forma fiable; el NIT varía según el proveedor. |
| IVA percibido (`ivaPerci1`) | 1 % que cobran los grandes contribuyentes al vender. Es acreditable para el comprador. |
| IVA retenido (`ivaRete1`) | 1 % que retiene un gran contribuyente al comprar. En las muestras siempre es 0. |

## Configuración

| Variable | Ejemplo | Uso |
|---|---|---|
| `RECEIVER_NRCS` | `1317457` | NRC aceptados como receptor, separados por comas. Normalmente uno. |

## Lectura del JSON

**Codificación.** Intentar UTF-8 (quitando BOM); si falla, Latin-1. 15 de las 49 muestras vienen en Latin-1.

**Sello de recepción.** Hay dos formatos:
- `selloRecibido` en la raíz (la mayoría).
- `respuestaHacienda.selloRecibido` (Sello de Oro). Ese objeto trae además `descripcionMsg` (`"RECIBIDO CON OBSERVACIONES"`) y `observaciones`, que se guardan como advertencia.

**Campos por bloque**

| Bloque | Campos que se usan |
|---|---|
| `identificacion` | `tipoDte`, `version`, `ambiente`, `codigoGeneracion`, `numeroControl`, `fecEmi`, `horEmi`, `tipoMoneda` |
| `emisor` | `nit`, `nrc`, `nombre`, `nombreComercial`, `codActividad`, `descActividad`, `telefono`, `correo` |
| `receptor` | `nrc` (validación), `nit`, `nombre` |
| `resumen` | `totalNoSuj`, `totalExenta`, `totalGravada`, `totalDescu`, `subTotal`, `tributos` (código `20` = IVA), `ivaPerci1`, `ivaRete1`, `reteRenta`, `montoTotalOperacion`, `totalPagar`, `condicionOperacion` |
| `cuerpoDocumento[]` | `numItem`, `tipoItem`, `codigo`, `descripcion`, `cantidad`, `uniMedida`, `precioUni`, `montoDescu`, `ventaNoSuj`, `ventaExenta`, `ventaGravada`, `numeroDocumento` |
| `documentoRelacionado[]` | `tipoDocumento`, `tipoGeneracion`, `numeroDocumento`, `fechaEmision` (solo notas de crédito) |

**Total del documento.** Las notas de crédito no traen `totalPagar`. Se calcula siempre:

```
total = montoTotalOperacion + ivaPerci1 − ivaRete1 − reteRenta
```

Cuando el JSON trae `totalPagar` se compara con el cálculo; si difieren en más de $0.01 es una advertencia.

**Validaciones**, en este orden:

| # | Regla | Resultado |
|---|---|---|
| 1 | Extensión `.json`, ≤ 1 MB, ≤ 100 archivos por carga | Rechazo |
| 2 | JSON válido con `identificacion`, `emisor`, `receptor`, `resumen`, `cuerpoDocumento` | Rechazo |
| 3 | `tipoDte` ∈ {`03`, `05`} | Rechazo |
| 4 | `ambiente = 01` | Rechazo |
| 5 | Tiene sello de recepción | Rechazo |
| 6 | `receptor.nrc` ∈ `RECEIVER_NRCS` | Rechazo |
| 7 | Código de generación no registrado ni repetido en la carga | Rechazo |
| 8 | Hacienda lo recibió con observaciones | Advertencia |
| 9 | IVA = 13 % del gravado; suma de líneas = gravado; total calculado = `totalPagar` (±$0.01) | Advertencia |
| 10 | Nota de crédito cuyo crédito fiscal no está registrado | Advertencia (pendiente de vincular) |

**Orden de proceso dentro de una carga:** primero los créditos fiscales y después las notas de crédito, para que se vinculen aunque vengan en la misma carga.

## Modelo de datos (propuesta Prisma)

```prisma
enum PurchaseDocumentType {
  CREDITO_FISCAL // tipoDte 03
  NOTA_CREDITO   // tipoDte 05
}

model Supplier {
  id                  Int      @id @default(autoincrement())
  nit                 String   @unique
  nrc                 String?
  name                String
  commercialName      String?
  activityCode        String?
  activityDescription String?
  phone               String?
  email               String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  documents PurchaseDocument[]
}

model PurchaseDocument {
  id             Int                  @id @default(autoincrement())
  type           PurchaseDocumentType
  generationCode String               @unique // codigoGeneracion, en mayúsculas
  controlNumber  String
  receptionStamp String
  schemaVersion  Int
  issueDate      DateTime             @db.Date
  issueTime      String
  currency       String               @default("USD")
  receiverNrc    String
  operationCondition Int // 1 contado, 2 crédito, 3 otro (informativo)

  nonSubjectTotal   Decimal @db.Decimal(12, 2)
  exemptTotal       Decimal @db.Decimal(12, 2)
  taxedTotal        Decimal @db.Decimal(12, 2)
  discountTotal     Decimal @db.Decimal(12, 2)
  subtotal          Decimal @db.Decimal(12, 2)
  ivaAmount         Decimal @db.Decimal(12, 2) // tributo 20
  ivaPerceived      Decimal @db.Decimal(12, 2)
  ivaWithheld       Decimal @db.Decimal(12, 2)
  incomeTaxWithheld Decimal @db.Decimal(12, 2)
  operationTotal    Decimal @db.Decimal(12, 2) // montoTotalOperacion
  total             Decimal @db.Decimal(12, 2) // calculado, ver "Total del documento"

  warnings Json? // [{ code, message }]
  rawJson  Json  // DTE original completo

  voidedAt   DateTime?
  voidReason String?
  voidedById Int?

  importedById Int
  createdAt    DateTime @default(now())

  supplierId Int
  supplier   Supplier @relation(fields: [supplierId], references: [id])
  importedBy User     @relation("PurchaseDocumentImportedBy", fields: [importedById], references: [id])
  voidedBy   User?    @relation("PurchaseDocumentVoidedBy", fields: [voidedById], references: [id])

  items            PurchaseDocumentItem[]
  relatedDocuments CreditNoteRelation[] @relation("CreditNote")    // si es nota de crédito
  creditNotes      CreditNoteRelation[] @relation("RelatedDocument") // si es crédito fiscal

  @@index([issueDate])
  @@index([supplierId, issueDate])
}

model PurchaseDocumentItem {
  id             Int     @id @default(autoincrement())
  itemNumber     Int
  itemType       Int
  code           String?
  description    String
  quantity       Decimal @db.Decimal(14, 4)
  unitOfMeasure  Int
  unitPrice      Decimal @db.Decimal(14, 6)
  discount       Decimal @db.Decimal(12, 2)
  nonSubjectSale Decimal @db.Decimal(12, 2)
  exemptSale     Decimal @db.Decimal(12, 2)
  taxedSale      Decimal @db.Decimal(12, 2)
  relatedDocumentCode String? // numeroDocumento de la línea (notas de crédito)

  documentId Int
  document   PurchaseDocument @relation(fields: [documentId], references: [id], onDelete: Cascade)
}

model CreditNoteRelation {
  id                    Int      @id @default(autoincrement())
  relatedType           String   // tipoDocumento del relacionado (03, ...)
  generationType        Int      // 1 físico, 2 electrónico
  relatedDocumentNumber String   // código de generación o número del documento físico
  relatedIssueDate      DateTime @db.Date

  creditNoteId      Int
  creditNote        PurchaseDocument  @relation("CreditNote", fields: [creditNoteId], references: [id], onDelete: Cascade)
  relatedDocumentId Int? // null + generationType 2 = pendiente de vincular
  relatedDocument   PurchaseDocument? @relation("RelatedDocument", fields: [relatedDocumentId], references: [id])

  @@unique([creditNoteId, relatedDocumentNumber])
  @@index([relatedDocumentNumber])
}
```

`User` necesita las relaciones inversas `importedPurchaseDocuments` y `voidedPurchaseDocuments`.

## Endpoints

| Método | Ruta | Historia |
|---|---|---|
| `GET` | `/api/v1/suppliers` | US-19 |
| `GET` | `/api/v1/suppliers/:id` | US-19 |
| `POST` | `/api/v1/purchase-documents/import` | US-20, US-21 |
| `GET` | `/api/v1/purchase-documents` | US-21, US-22 |
| `GET` | `/api/v1/purchase-documents/:id` | US-22 |
| `PATCH` | `/api/v1/purchase-documents/:id/void` | US-23 |
| `PATCH` | `/api/v1/purchase-documents/:id/unvoid` | US-23 |
| `GET` | `/api/v1/purchase-reports/iva-summary` | US-24 |
| `GET` | `/api/v1/purchase-reports/summary` | US-24 |
| `GET` | `/api/v1/purchase-reports/by-supplier` | US-24 |

Respuesta de la importación:

```json
{
  "summary": { "received": 3, "imported": 2, "rejected": 1, "withWarnings": 1 },
  "results": [
    { "file": "14C892E4-....json", "status": "imported", "documentId": 10, "warnings": [] },
    { "file": "264ED68A-....json", "status": "imported", "documentId": 11,
      "warnings": [{ "code": "PENDING_LINK", "message": "Crédito fiscal 14C892E4-... no registrado" }] },
    { "file": "otro.json", "status": "rejected", "reason": "DUPLICATE", "message": "El documento ya está registrado" }
  ]
}
```

## Decisiones técnicas

- **Subida de archivos:** se necesita una dependencia para multipart (`multer` con almacenamiento en memoria y límites de tamaño y cantidad). Los archivos no se escriben en disco.
- **Una transacción por documento**, no por carga: un archivo inválido no afecta a los demás.
- **Montos** con `Decimal`, igual que el resto del proyecto (US-04).
- **Zona horaria:** `issueDate` es una fecha sin hora, así que el agrupado por mes no depende de `TIMEZONE`.

## Fuera de alcance (por ahora)

- Otros tipos de DTE (facturas `01`, notas de débito `06`, sujeto excluido `14`).
- Guardar el PDF o cualquier archivo.
- Clasificar compras como costo o gasto.
- Registrar pagos o cuentas por pagar.
- Verificar el documento en la consulta pública de Hacienda y exportar el anexo de compras del F07.
- Historial de precios por producto (los datos ya quedan guardados en las líneas).
