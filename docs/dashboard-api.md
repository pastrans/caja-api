# Dashboard API

Endpoints de solo lectura para el dashboard de ventas del frontend.

- **Base:** `/api/v1/dashboard`
- **Auth:** `Authorization: Bearer <token>` de un usuario con rol `ADMIN` (cualquier otro rol recibe 403).
- **Ventas:** se cuentan todas las transacciones (`TransactionRecord`) por `amountToCharge`, estén en una caja abierta o cerrada.
- **Zona horaria:** días, semanas y meses se calculan en la zona `TIMEZONE` del `.env` (por defecto `America/Mexico_City`). Las semanas empiezan en lunes.
- **Fechas:** `from` y `to` usan el formato `YYYY-MM-DD` y son inclusivas.

---

## `GET /summary`

Totales del periodo en curso: hoy, semana actual, mes actual y año actual.

```json
{
  "timezone": "America/Mexico_City",
  "generatedAt": "2026-10-22T17:51:42.485Z",
  "today": { "total": 101.1, "count": 7, "averageTicket": 14.44 },
  "week":  { "total": 101.1, "count": 7, "averageTicket": 14.44 },
  "month": { "total": 151.6, "count": 8, "averageTicket": 18.95 },
  "year":  { "total": 461.6, "count": 11, "averageTicket": 41.96 }
}
```

- `total`: monto vendido.
- `count`: número de ventas.
- `averageTicket`: `total / count`, o `0` si no hay ventas.

---

## `GET /sales-by-employee`

Ventas por empleado en un rango, ordenadas de mayor a menor. Incluye a los empleados activos aunque no tengan ventas, y a los inactivos solo si vendieron en el rango.

| Query  | Requerido | Default | Descripción |
|--------|-----------|---------|-------------|
| `from` | No | Primer día del mes de `to` | Fecha inicial |
| `to`   | No | Hoy | Fecha final |

Ejemplo: `GET /api/v1/dashboard/sales-by-employee?from=2026-09-01&to=2026-09-30`

```json
{
  "from": "2026-09-01",
  "to": "2026-09-30",
  "total": 300,
  "count": 2,
  "employees": [
    { "employeeId": 1, "name": "Maria", "available": true, "total": 300, "count": 2, "averageTicket": 150, "percentage": 100 },
    { "employeeId": 3, "name": "flor", "available": true, "total": 0, "count": 0, "averageTicket": 0, "percentage": 0 }
  ]
}
```

- `percentage`: porcentaje del total vendido en el rango.

---

## `GET /sales-over-time`

Serie de ventas para gráficas. Devuelve un punto por periodo, incluidos los periodos sin ventas (en `0`).

| Query        | Requerido | Default | Descripción |
|--------------|-----------|---------|-------------|
| `from`       | No | Primer día del mes de `to` | Fecha inicial |
| `to`         | No | Hoy | Fecha final |
| `groupBy`    | No | `day` | `day`, `week` o `month` |
| `employeeId` | No | — | Filtra las ventas de un empleado |

- `period` es la fecha de inicio del periodo: el día, el lunes de la semana o el día 1 del mes. Con `week` o `month`, el primer periodo puede empezar antes de `from`, pero solo suma ventas dentro del rango.
- Con `groupBy=day` el rango máximo es de 366 días.

Ejemplo: `GET /api/v1/dashboard/sales-over-time?from=2026-10-19&groupBy=day&employeeId=2`

```json
{
  "from": "2026-10-19",
  "to": "2026-10-22",
  "groupBy": "day",
  "employeeId": 2,
  "total": 53,
  "count": 2,
  "data": [
    { "period": "2026-10-19", "total": 0, "count": 0 },
    { "period": "2026-10-20", "total": 0, "count": 0 },
    { "period": "2026-10-21", "total": 0, "count": 0 },
    { "period": "2026-10-22", "total": 53, "count": 2 }
  ]
}
```

---

## Errores

Responden `400 { "error": "..." }` cuando:
- `from` o `to` no son fechas válidas.
- `from` es posterior a `to`.
- `groupBy` no es válido.
- `employeeId` no es un entero positivo.
- El rango excede 366 días con `groupBy=day`.
