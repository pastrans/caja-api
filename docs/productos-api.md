# Productos de compras: análisis de precios

Endpoints para seguir el precio de los productos que se compran a los proveedores, a partir de las líneas de los créditos fiscales importados ([compras-api.md](./compras-api.md)). No hay catálogo de productos: se deducen de los DTE.

- **Auth:** `Authorization: Bearer <token>` de un usuario `ADMIN` (otro rol recibe 403).
- **Periodo:** `months` = últimos N meses hasta hoy (zona `TIMEZONE`), entero de 1 a 120; `all` = todo el historial. Por defecto `12`. La respuesta trae `from` y `to` aplicados.
- **Montos y precios:** en dólares, sin IVA. Los precios unitarios vienen con 4 decimales.

## Cómo se arma el análisis

- **Qué líneas cuentan:** solo créditos fiscales activos. No cuentan las notas de crédito, los documentos anulados, las líneas sin cantidad ni las bonificaciones. Se toma como bonificación (producto regalado) la línea rotulada `(BONIFICACIÓN) ...`, la de monto 0 y la de precio unitario de $0.01 o menos.
- **Qué es un producto:** proveedor + unidad de medida + código. El código y el nombre se calculan al importar cada línea y se guardan en ella (`productRef`, `productName`; `ProductRefHelper`). Las reglas, en este orden:
  1. El código de la línea, en mayúsculas, si viene y no es `PLU:`.
  2. Si la descripción empieza con un número de 6 o más dígitos seguido de `|`, ese número. Es el formato de Avícola Salvadoreña, que manda el producto dentro de la descripción: `25003131|PLU:|ALIMIAU ADULTO 420 g|12 UN|...` o el formato anterior `43002523 |  | SALCHICHA DE POL PICANT FRANKS 400 g 12U | 10.`. El nombre es el tercer campo (o el segundo si el tercero viene vacío).
  3. Si no hay código: el texto antes del primer `|`, en mayúsculas y con espacios normalizados. Hernández Hermanos agrega a veces el código de barras después (`CHORIZO BARBACOA 454 g 8U| 7410031421379|`). Si el proveedor cambia la redacción, cuenta como otro producto (ver [Hallazgos](#hallazgos-en-los-datos-de-los-proveedores)).
  - Se identifica con `key` = `supplierId:unitOfMeasure:código`, por ejemplo `2:59:25003131`. El código puede traer espacios, `/` o `:`, así que se envía siempre en la query (`encodeURIComponent`).
- **Precio de una compra:** precio de lista menos el descuento de la línea: (cantidad × precio unitario − descuento) / cantidad. No se usa el monto de la línea porque viene redondeado a centavos y, en cantidades chicas, mueve el precio (12 × $0.75 se factura como $9.01 y daría $0.7508). Si el producto viene en varias líneas del mismo DTE, se calcula un solo precio por documento, ponderado por cantidad. El gasto (`spent`, `amount`) sí es el monto facturado.
- **Devoluciones:** las líneas de nota de crédito activas con el código de un producto se relacionan con la compra que modifican (por el código de generación de la línea y el código del producto, sin mirar la unidad: Avícola devuelve con unidad 99 o 59 lo facturado por libra). La merma no tiene código de un producto comprado y no se relaciona con ninguna compra; queda fuera del precio.
  - **Devolución** (casi todas: mismo precio de la compra, con margen de 0.1 %): no cambia el precio; resta de la cantidad y del gasto.
  - **Rebaja de precio** (misma cantidad, precio menor): baja el precio de esa compra y resta del gasto.
  - Si una nota devuelve más de lo que se compró en esa línea, se limita a lo comprado.
- **Variación** (`changePct`): última compra vs. primera compra del periodo, en %.
- **Tendencia** (`trend`): regresión lineal del precio de cada compra contra la fecha.
  - `pctPerMonth`: pendiente en % del precio promedio por mes. `slopePerMonth`: lo mismo en dólares.
  - `r2` (0 a 1): qué tanto siguen los precios la línea. Con valores bajos el precio sube y baja mucho y la tendencia es poco confiable.
  - `direction`: `up` si sube 0.5 %/mes o más, `down` si baja 0.5 %/mes o más, `flat` en otro caso.
  - `startPrice` y `endPrice`: valor de la línea en la primera y la última compra (para dibujarla).
  - Es `null` con menos de 4 compras o si entre la primera y la última hay menos de 60 días.

## `GET /api/v1/purchase-products`

Productos comprados en el periodo, con sus estadísticas de precio. Paginado con `page` y `limit` (máximo 100).

| Query | Default | Descripción |
|---|---|---|
| `months` | `12` | Periodo (ver arriba) |
| `supplierId` | | Solo los productos de ese proveedor |
| `search` | | Busca en nombre, código y proveedor, sin distinguir mayúsculas ni acentos |
| `sort` | `spent` | `spent` (gasto), `change` (variación), `trend` (tendencia), `recent` (última compra), `name` |
| `order` | `asc` para `name`, `desc` para el resto | `asc` o `desc`. Con `sort=trend`, los productos sin tendencia van al final |

```json
{
  "months": 12, "from": "2025-11-13", "to": "2026-11-13", "supplierId": null,
  "summary": { "products": 226, "rising": 38, "falling": 6, "flat": 86, "insufficient": 96 },
  "page": 1, "limit": 10, "total": 226, "next": "/api/v1/purchase-products?page=2&limit=10", "prev": null,
  "data": [
    {
      "key": "3:36:030202004", "supplierId": 3, "supplierName": "AVICOLA CAMPESTRE S.A. DE C.V.",
      "ref": "030202004", "name": "PECHUGA SIN ALA 1/4", "unitOfMeasure": 36,
      "purchases": 203, "quantity": 44526.79, "spent": 72288.62,
      "avgPrice": 1.6235, "minPrice": 1.425, "maxPrice": 1.708,
      "firstDate": "2025-11-13", "firstPrice": 1.425, "lastDate": "2026-10-24", "lastPrice": 1.5487,
      "previousPrice": 1.6106, "changePct": 8.68, "lastChangePct": -3.85,
      "trend": { "pctPerMonth": 0.75, "slopePerMonth": 0.0122, "r2": 0.4, "direction": "up", "startPrice": 1.5587, "endPrice": 1.6965 }
    }
  ]
}
```

- `summary` cuenta todos los productos que cumplen los filtros, no solo los de la página. `insufficient` = sin tendencia.
- `quantity` y `spent` son netos de las notas de crédito sobre sus compras. `returnedQuantity` (solo devoluciones), `returnedAmount` (devoluciones y rebajas) y `returns` (número de líneas de nota de crédito) dicen cuánto se descontó.
- `unitOfMeasure`: código del catálogo de Hacienda (CAT-014). En los datos actuales: `59` unidad, `36` libra, `99` otra.
- `name`: el nombre de la compra más reciente.
- La tendencia resume todo el periodo y puede no coincidir con la última compra: en el ejemplo la línea termina en $1.6965, pero la última compra salió más barata ($1.5487, −3.85 % respecto a la anterior).
- `next` y `prev` solo conservan `page` y `limit`, igual que en el resto de la API.

## `GET /api/v1/purchase-products/history?key=`

Historial de precios de un producto. Acepta `months` (por defecto `12`). `404` si el producto no tiene compras en el periodo; `400` si `key` no tiene la forma `supplierId:unitOfMeasure:código`.

```json
{
  "months": 6, "from": "2026-05-13", "to": "2026-11-13",
  "product": { "...": "mismo formato que un elemento del listado" },
  "points": [
    { "date": "2026-05-13", "documentId": 536, "controlNumber": "DTE-03-M001P001-000000000018500",
      "quantity": 218, "amount": 356.9, "unitPrice": 1.6372 }
  ],
  "monthly": [
    { "month": "2026-05", "purchases": 11, "quantity": 2401, "spent": 3930.84, "avgPrice": 1.6372, "minPrice": 1.6372, "maxPrice": 1.6372 }
  ],
  "projection": [
    { "date": "2026-11-23", "price": 1.6754 },
    { "date": "2026-12-24", "price": 1.6803 },
    { "date": "2027-01-23", "price": 1.6851 }
  ]
}
```

- `points`: una compra por documento, de la más antigua a la más reciente. `quantity` y `amount` son los de la factura; `unitPrice` ya trae las rebajas. `returnStatus` es `none`, `partial` o `total` (se devolvió toda la cantidad), con `returnedQuantity`, `returnedAmount` y `returns`: `[{ "date", "documentId", "controlNumber", "type": "return" | "price", "quantity", "amount" }]`, donde `documentId` es la nota de crédito.
- `monthly`: `quantity` y `spent` netos, y `returnedAmount` del mes (por la fecha de la compra).
- `monthly`: solo los meses con compras. `avgPrice` es el promedio ponderado por la cantidad comprada.
- `projection`: precio estimado 1, 2 y 3 meses después de la última compra si la tendencia sigue igual. Vacío si `trend` es `null`. Es una extrapolación lineal, no un pronóstico.
- Si `key` es una variante, responde con su producto principal (`product.key` es la del principal).
- `variants`: variantes unidas al producto, cada una con su historial propio completo (no solo el del periodo): `key`, `ref`, `name`, `unitOfMeasure`, `purchases`, `firstDate`, `lastDate`, `lastPrice`, `createdAt` y `createdBy` (nombre de quien la unió).

## `GET /api/v1/purchase-products/returns`

Devoluciones de productos de un periodo, **por la fecha de la nota de crédito** (para la página del proveedor). Mismos parámetros que los reportes de compras: `from` y `to` (sin fechas, el mes en curso; la respuesta trae el rango aplicado) y `supplierId` opcional. Usa la misma relación entre nota de crédito y compra que el análisis de precios, así que la merma no cuenta.

```json
{
  "from": "2025-11-01", "to": "2026-10-31", "supplierId": 3,
  "summary": { "amount": 164.88, "returns": 4, "priceReductions": 0, "creditNotes": 4, "products": 3,
               "purchasedAmount": 127191.74, "percentage": 0.13 },
  "products": [
    { "key": "3:36:030202007", "name": "PECHUGA TAMBOR CON PIEL", "ref": "030202007", "unitOfMeasure": 36,
      "returns": 2, "purchases": 2, "quantity": 38.61, "amount": 66.63, "percentage": 40.41 }
  ],
  "items": [
    { "date": "2026-09-11", "documentId": 186, "controlNumber": "DTE-05-M001P001-000000000015036",
      "purchaseDocumentId": 141, "purchaseControlNumber": "DTE-03-M001P001-000000000036676", "purchaseDate": "2026-09-11",
      "productKey": "3:36:030202007", "productName": "PECHUGA TAMBOR CON PIEL", "unitOfMeasure": 36,
      "type": "return", "quantity": 23.01, "amount": 39.71 }
  ]
}
```

- `summary.amount`: devoluciones y rebajas de producto, sin IVA. `purchasedAmount`: lo comprado en el periodo (líneas de créditos fiscales activos, sin IVA); `percentage` = `amount / purchasedAmount`.
- `products`: de mayor a menor monto devuelto, con el producto principal si es una variante. `percentage` es sobre el monto devuelto del periodo.
- `items`: de la más reciente a la más antigua. `documentId` es la nota de crédito y `purchaseDocumentId` la factura original. En las rebajas (`type: "price"`) `quantity` es 0.
- En todo el historial actual: 150 líneas, $9,475.42, el 1.3 % de lo comprado.

## Variantes: unir el mismo producto con otro nombre o código

Cuando un proveedor cambia el nombre o el código de un producto, el análisis lo ve como dos productos y su historial queda partido. Una variante se une a un producto principal **del mismo proveedor**: desde ese momento sus compras se cuentan como del principal en el listado, el historial y la tendencia. No se modifican los documentos y se puede deshacer.

- El principal nunca es a su vez una variante. Si se une un producto que ya tiene variantes, sus variantes pasan al nuevo principal; si se elige como principal una variante, se usa su principal.
- Se pueden unir productos con distinta unidad de medida, pero solo tiene sentido si el precio se refiere a lo mismo (el frontend pide confirmarlo).
- En el listado, `variants` dice cuántas variantes tiene unidas cada producto.

### `GET /api/v1/purchase-products/suggestions`

Grupos de productos del mismo proveedor que parecen el mismo, sobre todo el historial. Acepta `supplierId`. Ordenados por número de compras, de mayor a menor.

```json
[
  {
    "supplierId": 4, "supplierName": "HERNANDEZ, HERMANOS SA DE CV",
    "signature": "CHORIZO BARBACOA 454", "suggestedKey": "4:59:CHORIZO BARBACOA 454 G 8U", "sameUnit": true,
    "products": [
      { "key": "4:59:CHORIZO BARBACOA 454 G 8U", "ref": "CHORIZO BARBACOA 454 G 8U", "name": "CHORIZO BARBACOA 454 g 8U",
        "unitOfMeasure": 59, "purchases": 51, "firstDate": "2025-05-08", "lastDate": "2026-10-19", "lastPrice": 1.77 },
      { "key": "4:59:CHORIZO BARBACOA 454 G", "ref": "CHORIZO BARBACOA 454 G", "name": "CHORIZO BARBACOA 454 g",
        "unitOfMeasure": 59, "purchases": 12, "firstDate": "2025-01-03", "lastDate": "2025-04-21", "lastPrice": 1.5894 }
    ]
  }
]
```

- **Cómo se agrupan:** por el nombre normalizado (`signature`): sin acentos, en mayúsculas, sin la palabra `Descuento`, sin el empaque (`8U`, `24U`) y con los gramos como número (`454 G`, `454 g`, `454 GRAMOS` → `454`).
- `suggestedKey`: el principal sugerido, el producto con más compras.
- Con distinta unidad de medida solo se sugiere si el último precio es parecido (hasta 1.5 veces). Si no, es otra forma de vender el producto y se deja fuera: Avícola facturó un par de veces por bolsa (≈ $24) lo que siempre factura por libra (≈ $1.38). `sameUnit: false` avisa que el grupo mezcla unidades con precio parecido.
- No aparecen los productos ya unidos ni las sugerencias descartadas.

### `POST /api/v1/purchase-products/suggestions/dismiss`

Marca una sugerencia como "no son el mismo producto" para que no se vuelva a mostrar. Body: `{ "supplierId": 4, "signature": "CHORIZO BARBACOA 454" }`. Responde `204`.

### `GET /api/v1/purchase-products/merges`

Uniones guardadas, agrupadas por producto principal, de la más reciente a la más antigua. Acepta `supplierId`.

```json
[
  {
    "supplierId": 4, "supplierName": "HERNANDEZ, HERMANOS SA DE CV",
    "product": { "key": "4:59:CHORIZO BARBACOA 454 G 8U", "name": "CHORIZO BARBACOA 454 g 8U", "purchases": 51, "...": "..." },
    "variants": [
      { "key": "4:59:CHORIZO BARBACOA 454 G", "name": "CHORIZO BARBACOA 454 g", "purchases": 12, "...": "...",
        "createdAt": "2026-11-14T15:02:11.000Z", "createdBy": "Carlos" }
    ]
  }
]
```

`product` y cada variante traen su historial propio (sin sumar las variantes), con el mismo formato que en las sugerencias.

### `POST /api/v1/purchase-products/merges`

Une variantes a un producto principal. Body: `{ "targetKey": "4:59:CHORIZO BARBACOA 454 G 8U", "variantKeys": ["4:59:CHORIZO BARBACOA 454 G"] }` (hasta 50 variantes). Responde `{ "key": "<principal>", "variants": 1 }`.

`400` si una clave no tiene la forma `supplierId:unitOfMeasure:código`, si los productos son de distintos proveedores, si una variante es el mismo principal o si algún producto no tiene compras registradas.

### `DELETE /api/v1/purchase-products/merges?key=`

Separa una variante (`key`): vuelve a ser un producto propio con su historial. Responde `204`; `404` si ese producto no es una variante.

## Hallazgos en los datos de los proveedores

Revisión de la base local (13/11/2026): 2,716 documentos, 20,309 líneas y 7 proveedores, de noviembre 2023 a octubre 2026. Las historias de lo pendiente están en el [BACKLOG](./BACKLOG.md#-análisis-de-precios-de-productos).

### Ya resueltos en el cálculo

| Hallazgo | Evidencia | Cómo se maneja |
|---|---|---|
| Avícola Salvadoreña manda el código dentro de la descripción, en dos formatos | 11,050 líneas con código `PLU:` y 66 con el formato anterior sin código (`43002523 \|  \| SALCHICHA ...`) | Regla 2 del código. Quedan 102 productos; la salchicha picante, que estaba partida entre los dos formatos, junta 325 compras |
| Hernández Hermanos no manda código y a veces pega el código de barras en la descripción | `CHORIZO BARBACOA 454 g 8U` y `CHORIZO BARBACOA 454 g 8U\| 7410031421379\|` | Regla 3: se usa el texto antes del primer `\|` |
| Producto regalado sin rotular como bonificación | 19 líneas a $0 (pastas y salsas de San Valentín, `AMERICANO 140GR` de Productos Cárnicos) y **229 líneas a $0.01 en 173 facturas de Sello de Oro**, con el mismo código que la venta normal (la salchicha 400 g tiene 113 líneas a $0.01 y 124 a $1.15) | Se excluyen. Entre $0.02 y $0.10 hay una sola línea en toda la base, así que el corte en $0.01 no toca compras reales |
| El monto de la línea viene redondeado a centavos | 399 de 20,185 líneas (2 %) dan un precio que difiere más de 0.1 % del precio de lista | El precio sale del precio de lista menos el descuento, no del monto |

### Pendientes

**1. Hernández Hermanos renombra sus productos — se resuelve uniendo variantes (US-26, ver [Variantes](#variantes-unir-el-mismo-producto-con-otro-nombre-o-código)).** El mismo producto, al mismo precio, cambió de nombre con el tiempo, así que su historial queda partido justo donde cambió el nombre:

| Nombre | Desde | Hasta | Compras | Precio |
|---|---|---|---|---|
| CHORIZO BARBACOA 454 G | 03/01/2025 | 21/01/2025 | 3 | $1.59 |
| CHORIZO BARBACOA 454 g | 11/02/2025 | 21/04/2025 | 9 | $1.59 |
| CHORIZO BARBACOA 454 g 8U | 08/05/2025 | 19/10/2026 | 51 | $1.59 – $1.77 |

Las diferencias de mayúsculas ya se unen (las dos primeras filas cuentan como un producto con 12 compras), pero el cambio a `454 g 8U` lo parte en dos. Pasa lo mismo con el tocino (`200 GRS` → `200 g` → `200 g 8U`), la mortadela, la longaniza, la salchicha de pollo y la pechuga de pavo. Hernández aparece con 47 "productos" que son unos 20 reales.

Se eligió unirlos a mano, con sugerencias: normalizar los nombres automáticamente uniría de más (no sabe si `CHORIZO ARGENTINO 454 g 8U`, `CHORIZO ARGENTINO BANDEJA 454 g 8U` y `CHORIZO ARGENTINO SUPER 454 g` son el mismo producto). Las sugerencias encuentran 22 grupos: 9 de Hernández, 6 de Sello de Oro (cambió el código de productos como `PECHUGOSAS 310g` a inicios de 2024), 5 de San Valentín (mismo código con unidad 59 y 99, al mismo precio) y 2 de Avícola Salvadoreña.

**Avícola facturó por bolsa en enero y abril de 2026.** Algunos productos que siempre se facturan por libra (`ALA FRESCA BOLSA`, $1.38/lb) aparecen en esas facturas por unidad (bolsa de ≈ 16 lb a $24.19). Son productos distintos para el análisis y no se sugiere unirlos: mezclarían precios por libra con precios por bolsa.

**2. El código de Avícola depende del formato del texto — resuelto (US-27).** El código y el nombre se guardan en cada línea al importar (las líneas existentes se calcularon en la migración `20261115000000_add_item_product_ref`, con resultado idéntico al cálculo anterior en las 20,309 líneas). La importación avisa con `PRODUCT_FORMAT_CHANGED` si un proveedor que siempre manda el código en la descripción deja de hacerlo, y con `PRODUCT_UNIT_CHANGED` si un producto llega en una unidad inusual (el caso de Avícola facturando por bolsa).

**3. Las notas de crédito no se descuentan del precio (prioridad baja).** Equivalen al 3.65 % de las compras. La mayoría es `DESCUENTO POR MERMA` ($16,783), un descuento general que no corresponde a un producto. Una parte sí son devoluciones de producto: `POLLO EN 1/4 PECHUGA SIN ALA` ($6,004) y `POLLO EN 1/4 MUSLO` ($1,670), de Avícola Campestre. Para esos productos, el precio real pagado es algo menor que el que muestra el análisis.

**4. No se puede comparar el mismo producto entre proveedores (prioridad baja).** Cada proveedor usa sus propios códigos y nombres, así que la pechuga de Avícola Campestre y la de Sello de Oro son productos distintos para el sistema. Compararlas requiere un catálogo propio de productos al que se asignen los de cada proveedor.

**5. El historial de cada proveedor empieza en una fecha distinta (no requiere acción).** Están todas las facturas: cada historial empieza cuando se le empezó a comprar a ese proveedor. La tendencia necesita al menos 4 compras en 60 días; en los últimos 12 meses, 96 de 226 productos no llegan a ese mínimo porque se compran poco, y se muestran como "pocas compras":

| Proveedor | Primer documento | Documentos |
|---|---|---|
| Avícola Campestre | 09/01/2024 | 1,429 |
| Avícola Salvadoreña | 07/12/2024 | 567 |
| Sello de Oro | 09/11/2023 | 378 |
| Productos Cárnicos | 23/02/2024 | 246 |
| Hernández Hermanos | 03/01/2025 | 87 |
| San Valentín | 24/07/2025 | 8 |
| Bimbo | 05/05/2026 | 1 |

Al comparar periodos largos ("todo el historial") hay que tener en cuenta que, por ejemplo, Avícola Salvadoreña solo tiene datos desde diciembre 2024.
