# Compras API (DTE)

Endpoints para registrar y consultar las compras a partir de los DTE (créditos fiscales y notas de crédito). Diseño y reglas de lectura del JSON: [compras-dte.md](./compras-dte.md). Pantallas, flujos y reglas de la interfaz: [compras-frontend.md](./compras-frontend.md).

- **Auth:** `Authorization: Bearer <token>` de un usuario con rol `ADMIN` (cualquier otro rol recibe 403).
- **Fechas:** formato `YYYY-MM-DD`, inclusivas. Cada documento cuenta en el día de su fecha de emisión (`issueDate`).
- **Montos:** en dólares, con 2 decimales.
- **Paginación:** `page` y `limit` (máximo 100), igual que el resto de la API.

---

## Proveedores

### `GET /api/v1/suppliers`

Listado paginado, ordenado por nombre. Los proveedores se crean y actualizan solos al importar DTE; no hay alta ni edición manual.

| Query | Descripción |
|---|---|
| `search` | Busca en nombre, nombre comercial o NIT |

```json
{
  "page": 1, "limit": 10, "total": 5, "next": null, "prev": null,
  "data": [
    {
      "id": 2, "nit": "12172705981028", "nrc": "1065599", "name": "AVICOLA CAMPESTRE S.A. DE C.V.",
      "commercialName": "PLANTA AVICOLA", "activityCode": "01460",
      "activityDescription": "CRIA DE AVES DE CORRAL Y PRODUCCION DE HUEVOS",
      "phone": "26235050", "email": "despacho@campestre.com.sv", "lastIssueDate": "2026-10-23",
      "createdAt": "2026-10-24T02:24:09.009Z", "updatedAt": "2026-10-24T02:24:09.542Z"
    }
  ]
}
```

- `lastIssueDate`: fecha del DTE más reciente del proveedor; sus datos son los que se guardan.

### `GET /api/v1/suppliers/:id`

Un proveedor (mismo formato que un elemento del listado). `404` si no existe.

---

## Documentos de compra

### `POST /api/v1/purchase-documents/import`

`multipart/form-data` con uno o varios archivos `.json` en el campo `files`. Máximo 100 archivos y 1 MB por archivo.

La importación es parcial: responde `200` aunque algunos archivos se rechacen. `results` sigue el orden de los archivos enviados.

```json
{
  "summary": { "received": 3, "imported": 2, "rejected": 1, "withWarnings": 1 },
  "results": [
    { "file": "14C892E4-....json", "status": "imported", "documentId": 10, "type": "CREDITO_FISCAL",
      "generationCode": "14C892E4-...", "linkedCreditNotes": 1, "warnings": [] },
    { "file": "264ED68A-....json", "status": "imported", "documentId": 11, "type": "NOTA_CREDITO",
      "generationCode": "264ED68A-...", "linkedCreditNotes": 0,
      "warnings": [{ "code": "PENDING_LINK", "message": "Related crédito fiscal 14C892E4-... is not registered yet; ..." }] },
    { "file": "otro.json", "status": "rejected", "reason": "DUPLICATE", "message": "Document ... is already registered" }
  ]
}
```

- `linkedCreditNotes`: en un crédito fiscal, cuántas notas de crédito pendientes se vincularon al importarlo.

| `reason` (rechazo) | Causa |
|---|---|
| `INVALID_FILE` | No es `.json` |
| `INVALID_JSON` | El contenido no es JSON |
| `INVALID_STRUCTURE` | Falta un bloque o campo obligatorio del DTE (el mensaje dice cuál) |
| `UNSUPPORTED_TYPE` | Tipo distinto de `03` (crédito fiscal) o `05` (nota de crédito) |
| `TEST_ENVIRONMENT` | Ambiente de pruebas |
| `MISSING_STAMP` | Sin sello de recepción de Hacienda |
| `RECEIVER_MISMATCH` | El NRC del receptor no está en `RECEIVER_NRCS` |
| `DUPLICATE` | Ya registrado, o repetido en la misma carga |
| `INTERNAL_ERROR` | Error inesperado al guardar (queda en el log del servidor) |

| `code` (advertencia) | Causa |
|---|---|
| `MH_OBSERVATIONS` | Hacienda lo recibió con observaciones |
| `TOTALS_MISMATCH` | IVA, suma de líneas o total a pagar no cuadran (tolerancia $0.01) |
| `PENDING_LINK` | Nota de crédito cuyo crédito fiscal aún no está registrado |

Errores de la petición completa (`400`): sin archivos, campo distinto de `files`, más de 100 archivos o un archivo de más de 1 MB.

### `GET /api/v1/purchase-documents`

Listado paginado, del más reciente al más antiguo (por fecha de emisión). Sin líneas ni documentos relacionados.

| Query | Descripción |
|---|---|
| `type` | `CREDITO_FISCAL` o `NOTA_CREDITO` |
| `supplierId` | Id del proveedor |
| `from`, `to` | Rango de fecha de emisión |
| `receiverNrc` | NRC del receptor |
| `status` | `active`, `voided` o `all` (por defecto `all`) |
| `withWarnings` | `true`: solo los que tienen advertencias guardadas |
| `pendingLink` | `true`: solo notas de crédito pendientes de vincular |

```json
{
  "page": 1, "limit": 10, "total": 48, "next": "/api/v1/purchase-documents?page=2&limit=10", "prev": null,
  "data": [
    {
      "id": 33, "type": "CREDITO_FISCAL", "generationCode": "5ACA8B08-F23C-4160-A5CB-003CF566B82C",
      "controlNumber": "DTE-03-S002P097-202601000001060", "receptionStamp": "20266081297047E9442B915F302D028CFBB3JBYZ",
      "schemaVersion": 3, "issueDate": "2026-10-23", "issueTime": "10:48:46", "currency": "USD",
      "receiverNrc": "1317457", "operationCondition": 1,
      "totals": {
        "nonSubjectTotal": 0, "exemptTotal": 0, "taxedTotal": 31.63, "discountTotal": 0, "subtotal": 31.63,
        "ivaAmount": 4.11, "ivaPerceived": 0, "ivaWithheld": 0, "incomeTaxWithheld": 0,
        "operationTotal": 35.74, "total": 35.74
      },
      "supplier": { "id": 5, "name": "Productos Cárnicos SA de CV", "nit": "06141210830014" },
      "warnings": [],
      "pendingLinks": [],
      "voided": null,
      "importedBy": { "id": 1, "name": "Carlos" },
      "createdAt": "2026-10-24T02:38:58.137Z"
    }
  ]
}
```

- `operationCondition`: 1 contado, 2 crédito, 3 otro (informativo).
- `totals.total`: `operationTotal + ivaPerceived - ivaWithheld - incomeTaxWithheld`.
- `warnings`: `{ code, message }[]`, igual que en la importación. Aquí solo aparecen las que se guardan al importar: `MH_OBSERVATIONS` y `TOTALS_MISMATCH`. Ejemplo: `[{ "code": "MH_OBSERVATIONS", "message": "RECIBIDO CON OBSERVACIONES: [[resumen.totalDescu] Calculo incorrecto]" }]`.
- `pendingLinks`: `string[]` con los códigos de generación de los créditos fiscales que la nota de crédito modifica y que aún no están registrados. Ejemplo: `["14C892E4-85B7-4C46-8305-F25D8B89D00C"]`. Se calcula en cada consulta, así que se vacía solo al importar el crédito fiscal. Por eso `PENDING_LINK` no aparece en `warnings`: solo existe en la respuesta de la importación.
- `voided`: `null` si está activo; si no, `{ "voidedAt", "reason", "voidedBy": { "id", "name" } }`.

Los enlaces `next` y `prev` solo conservan `page` y `limit`, igual que en el resto de la API.

### `GET /api/v1/purchase-documents/:id`

El documento con todo su detalle: los campos del listado más `items`, `relatedDocuments` y `creditNotes`. El JSON original no se devuelve. `404` si no existe.

```json
{
  "id": 46, "type": "NOTA_CREDITO", "generationCode": "66AA7ED4-46C0-4505-A9D5-431FE329B714",
  "...": "mismos campos que en el listado",
  "items": [
    { "itemNumber": 1, "itemType": 2, "code": "050103098", "description": "DESCUENTO POR MERMA",
      "quantity": 1, "unitOfMeasure": 59, "unitPrice": 8.37, "discount": 0,
      "nonSubjectSale": 0, "exemptSale": 0, "taxedSale": 8.37,
      "relatedDocumentCode": "DCEEB382-7658-4572-9DE8-BB009A85C333" }
  ],
  "relatedDocuments": [
    { "relatedType": "03", "generationType": 2,
      "relatedDocumentNumber": "DCEEB382-7658-4572-9DE8-BB009A85C333", "relatedIssueDate": "2026-10-22",
      "document": { "id": 36, "generationCode": "DCEEB382-...", "controlNumber": "DTE-03-M001P001-000000000043121",
                    "issueDate": "2026-10-22", "total": 268.32, "voided": false } }
  ],
  "creditNotes": []
}
```

- `relatedDocuments` (notas de crédito): documentos que modifica. `document` es `null` si está pendiente de vincular o si es un documento físico (`generationType: 1`).
- `creditNotes` (créditos fiscales): notas de crédito que lo modifican.

### `PATCH /api/v1/purchase-documents/:id/void`

Anula el documento: deja de contar en los reportes. No anula nada en Hacienda; eso solo lo hace el emisor.

```json
{ "reason": "Factura duplicada por el proveedor" }
```

- `reason`: obligatorio, máximo 500 caracteres.

Respuesta:

```json
{
  "document": { "id": 36, "...": "detalle completo", "voided": { "voidedAt": "2026-10-24T02:39:49.037Z", "reason": "Factura duplicada por el proveedor", "voidedBy": { "id": 1, "name": "Carlos" } } },
  "warnings": [
    { "code": "HAS_CREDIT_NOTES", "message": "This crédito fiscal has 1 active credit note(s); they still count in reports unless voided too" }
  ]
}
```

`400` si ya estaba anulado o falta el motivo; `404` si no existe.

### `PATCH /api/v1/purchase-documents/:id/unvoid`

Reactiva un documento anulado y borra los datos de anulación. Sin body. Responde el detalle del documento. `400` si no estaba anulado; `404` si no existe.

---

## Reportes

Solo cuentan los documentos activos. Las notas de crédito se muestran aparte y restan en `net`. Las notas pendientes de vincular sí cuentan.

Todos aceptan estos filtros opcionales, y la respuesta devuelve los que se aplicaron (`null` si no):

| Query | Descripción |
|---|---|
| `receiverNrc` | NRC del receptor |
| `supplierId` | Solo las compras de ese proveedor. Si no compró en el periodo, los totales salen en cero (útil para la ficha del proveedor) |

Cada reporte usa estos bloques:

- `creditosFiscales` / `notasCredito`: `documents`, `taxed`, `exempt`, `nonSubject`, `iva`, `ivaPerceived`, `ivaWithheld`, `total`.
- `net`: créditos fiscales menos notas de crédito (los mismos montos, sin `documents`) más `ivaCredit` = `iva + ivaPerceived`.

### `GET /api/v1/purchase-reports/iva-summary`

Resumen de IVA por mes. Devuelve siempre los 12 meses (en cero los que no tienen compras).

| Query | Default | Descripción |
|---|---|---|
| `year` | Año en curso | Año del resumen |

```json
{
  "year": 2026,
  "receiverNrc": null,
  "supplierId": null,
  "months": [
    {
      "month": "2026-10",
      "creditosFiscales": { "documents": 38, "taxed": 11978.23, "exempt": 0, "nonSubject": 0, "iva": 1557.13, "ivaPerceived": 67.19, "ivaWithheld": 0, "total": 13602.55 },
      "notasCredito": { "documents": 11, "taxed": 153.36, "exempt": 0, "nonSubject": 0, "iva": 19.94, "ivaPerceived": 0, "ivaWithheld": 0, "total": 173.3 },
      "net": { "taxed": 11824.87, "exempt": 0, "nonSubject": 0, "iva": 1537.19, "ivaPerceived": 67.19, "ivaWithheld": 0, "total": 13429.25, "ivaCredit": 1604.38 }
    }
  ],
  "total": { "creditosFiscales": { "...": "..." }, "notasCredito": { "...": "..." }, "net": { "...": "..." } }
}
```

### `GET /api/v1/purchase-reports/summary`

Total de compras en un rango.

| Query | Default | Descripción |
|---|---|---|
| `from` | Primer día del mes de `to` | Fecha inicial |
| `to` | Hoy (zona `TIMEZONE`) | Fecha final |

La respuesta siempre incluye el `from` y `to` usados, también cuando se calcularon por defecto: el frontend puede llamar sin fechas en la primera carga y tomar el rango de la respuesta.

```json
{
  "from": "2026-10-01", "to": "2026-10-23", "receiverNrc": null, "supplierId": null,
  "creditosFiscales": { "documents": 38, "...": "..." },
  "notasCredito": { "documents": 11, "...": "..." },
  "net": { "total": 13429.25, "ivaCredit": 1604.38, "...": "..." }
}
```

### `GET /api/v1/purchase-reports/by-supplier`

Compras netas por proveedor en un rango (mismos `from` y `to` que `/summary`), de mayor a menor. Solo aparecen proveedores con compras en el rango.

```json
{
  "from": "2026-10-01", "to": "2026-10-31", "receiverNrc": null, "supplierId": null,
  "total": 13429.25,
  "suppliers": [
    { "supplierId": 1, "name": "Avicola Salvadoreña S.A.", "nit": "06141305710012",
      "creditosFiscales": 11, "notasCredito": 0,
      "taxed": 5438.02, "exempt": 0, "nonSubject": 0, "iva": 706.93, "ivaPerceived": 54.38, "ivaWithheld": 0,
      "total": 6199.33, "ivaCredit": 761.31, "percentage": 46.16 }
  ]
}
```

- `total`: total neto del rango.
- `percentage`: porcentaje del total neto que corresponde al proveedor.
