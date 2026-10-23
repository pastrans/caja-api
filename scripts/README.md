# Scripts de base de datos

Scripts de PowerShell para sacar backups de la base de datos de Railway y cargarlos en el Postgres local para hacer pruebas.

| Script | Qué hace | ¿Modifica algo? |
|---|---|---|
| `backup-db.ps1` | Crea un backup (`pg_dump`) en la carpeta `backups/` | No. Solo **lee** la base de datos. |
| `restore-local.ps1` | Carga un backup en el Postgres **local** de docker-compose | Sí, pero solo en una base **local**. Nunca escribe en Railway. |

> ⚠️ **Los backups contienen datos personales** (emails y contraseñas cifradas de los usuarios). La carpeta `backups/` está en `.gitignore`: no los subas a ningún repositorio ni los compartas.

---

## Requisitos

1. **Docker Desktop abierto.** Los scripts usan Docker para correr `pg_dump` y `pg_restore`, así que no hace falta instalar Postgres.
2. **Una terminal de PowerShell** abierta en la carpeta del proyecto:
   ```powershell
   cd C:\Users\epare\Documents\Proyectos\caja-api
   ```
   En VS Code: **Terminal → New Terminal**. Si se abre como `bash`, cámbiala a PowerShell con la flecha junto al **+**.
3. **Solo para restaurar:** el Postgres local levantado (`docker compose up -d postgres-db`).

---

## 1. Crear un backup

### a) Copia la URL de la base de datos

En Railway, en el entorno que quieras respaldar (por ejemplo **production**):
servicio **Postgres** → **Variables** → **`DATABASE_PUBLIC_URL`** → copiar.

> Usa la **`DATABASE_PUBLIC_URL`**. La `DATABASE_URL` (`...railway.internal`) solo funciona dentro de Railway.

### b) Ejecuta el script

```powershell
.\scripts\backup-db.ps1
```

Cuando pida la URL, pégala y presiona Enter. **No se ve mientras la pegas**: es a propósito, para que no quede en pantalla.

Al terminar verás algo así:

```
Conectando a xxxx.proxy.rlwy.net:12345/railway ...
Servidor Postgres 17
Creando backups/prod-2026-10-23_1610.dump ...

Backup listo: backups/prod-2026-10-23_1610.dump (85 KB, 8 tablas con datos)
```

El script detecta la versión de Postgres del servidor y usa el `pg_dump` que le corresponde. Al final comprueba que el archivo se pueda leer.

### Para no pegar la URL cada vez

Guárdala una sola vez en `backups/.database-url`, que también está ignorado por git:

```powershell
Set-Content -Path .\backups\.database-url -Value "PEGA_AQUI_LA_URL" -NoNewline
```

Desde entonces basta con `.\scripts\backup-db.ps1`.

El script busca la URL en este orden:
1. El parámetro `-DatabaseUrl`
2. La variable de entorno `BACKUP_DATABASE_URL`
3. El archivo `backups/.database-url`
4. Si no la encuentra, la pide por consola

### Backup de otro entorno (por ejemplo staging)

```powershell
.\scripts\backup-db.ps1 -Name staging -DatabaseUrl "URL_PUBLICA_DE_STAGING"
```

Crea `backups/staging-AAAA-MM-DD_HHMM.dump`. Si guardaste la URL de prod en `backups/.database-url`, pasa la de staging con `-DatabaseUrl` para no mezclarlas.

### Cuándo conviene hacer un backup

- Antes de un deploy a producción que incluya migraciones (`prisma/migrations`).
- Antes de borrar o corregir datos a mano.
- De forma periódica, por ejemplo una vez por semana.

> Los backups viven solo en tu computadora. Para tener una copia de seguridad de verdad, guarda también una copia fuera de ella (disco externo, almacenamiento en la nube privado, etc.).

---

## 2. Usar un backup para probar en local

### a) Restaura el backup

```powershell
.\scripts\restore-local.ps1
```

- Toma el backup **más reciente** de `backups/`.
- Lo carga en una base local **nueva** llamada `caja_backup`. Tu base de desarrollo (`CAJA`) no se toca.
- Si `caja_backup` ya existe, la borra y la vuelve a crear, pero antes te pide **escribir su nombre** para confirmar.

Al terminar verás algo así:

```
Backup restaurado en la base local 'caja_backup':
  Usuarios 4
  Empleados 7
  Cajas 23
  Ventas 53

Para usarla, en tu .env cambia SOLO el nombre de la base al final de POSTGRES_URL por 'caja_backup':
  postgresql://postgres:<tu contraseña>@127.0.0.1:5432/caja_backup
  (<tu contraseña> es la misma de POSTGRES_PASSWORD; no copies esta línea tal cual)
y reinicia npm run dev.
```

### b) Apunta tu `.env` a esa base

Cambia **solo el nombre de la base** al final de `POSTGRES_URL` y deja la contraseña como estaba. No copies la línea que muestra el script: la contraseña aparece oculta.

```
POSTGRES_URL=postgresql://postgres:<tu-password>@127.0.0.1:5432/caja_backup
```

Y comprueba que tengas:

```
SEND_EMAIL=false
```

> ⚠️ **Importante:** la base restaurada tiene los **emails reales** de los usuarios. Con `SEND_EMAIL=true`, un "olvidé mi contraseña" de prueba les mandaría un correo real.

### c) Reinicia la API

En la terminal donde corre la API: `Ctrl+C` y vuelve a ejecutar `npm run dev`.

> El `.env` solo se lee al arrancar. Si no reinicias, la API sigue conectada a la base anterior.

Los usuarios entran con **las mismas contraseñas que en producción**.

### d) Volver a tus datos de desarrollo

Regresa `POSTGRES_URL` a `.../CAJA` y reinicia `npm run dev`.

### Opciones de `restore-local.ps1`

```powershell
# Restaurar un backup específico (en vez del más reciente)
.\scripts\restore-local.ps1 -File .\backups\prod-2026-10-23_1610.dump

# Restaurar en una base con otro nombre
.\scripts\restore-local.ps1 -Database caja_prueba

# Reemplazar la base sin pedir confirmación
.\scripts\restore-local.ps1 -Force
```

> Evita restaurar sobre `CAJA` (tu base de desarrollo): perderías lo que tengas ahí. Si lo intentas, el script te avisa antes de borrarla.

---

## Ayuda de cada script

```powershell
Get-Help .\scripts\backup-db.ps1 -Detailed
Get-Help .\scripts\restore-local.ps1 -Detailed
```

---

## Solución de problemas

| Mensaje | Causa | Qué hacer |
|---|---|---|
| `Docker no está corriendo` | Docker Desktop está cerrado o arrancando | Ábrelo y espera a que diga **Running**. |
| `El contenedor postgres-db no está corriendo` | El Postgres local no está levantado (solo `restore-local.ps1`) | `docker compose up -d postgres-db` |
| `Esa es la URL privada de Railway` | Pegaste la `DATABASE_URL` (`.railway.internal`) | Usa la **`DATABASE_PUBLIC_URL`**. |
| `La URL debe empezar con postgresql://` | La URL está incompleta o no es de Postgres | Vuelve a copiarla completa desde Railway. |
| `No se pudo conectar a ...` | URL incorrecta, contraseña cambiada o sin internet | Copia de nuevo la `DATABASE_PUBLIC_URL`. Si usas `backups/.database-url`, actualízalo. |
| `No hay backups en backups/` | Todavía no has creado ninguno | Ejecuta primero `.\scripts\backup-db.ps1`. |
| `... no parece un backup válido` | El archivo está incompleto o no es un `.dump` de `pg_dump` | Crea un backup nuevo. |
| `pg_restore terminó con errores` | El backup no se pudo cargar completo (el script muestra el detalle) | Revisa el mensaje. Si el backup es muy viejo, puede no coincidir con el schema actual: crea uno nuevo. |
| `... cannot be loaded because running scripts is disabled on this system` | Windows no permite ejecutar scripts de PowerShell | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` y vuelve a intentarlo. |
| `P1000: Authentication failed ... credentials for postgres are not valid` (al correr `npm run dev`) | La contraseña de `POSTGRES_URL` en el `.env` es incorrecta. Lo típico: se copió la línea del script con `<tu contraseña>` o `****` | Pon en `POSTGRES_URL` la misma contraseña que `POSTGRES_PASSWORD`. Solo cambia el nombre de la base. |
| La API sigue mostrando los datos de antes | No se reinició después de cambiar el `.env` | `Ctrl+C` y `npm run dev`. |
| La primera ejecución tarda varios minutos | Docker descarga la imagen de Postgres de esa versión | Es normal; solo pasa la primera vez. |
| Aparece `NOTICE` o avisos de Docker en amarillo | Mensajes informativos | Puedes ignorarlos si el script termina con el mensaje en verde. |

---

## Cómo funcionan (por si hay que modificarlos)

- **Docker en lugar de instalar Postgres:** `pg_dump`, `pg_restore` y `psql` corren dentro de contenedores `postgres:<versión>` que se borran al terminar (`docker run --rm`).
- **Versiones:** `pg_dump` y `pg_restore` deben ser de la misma versión que el servidor que generó el backup, o más nuevos. `backup-db.ps1` consulta la versión del servidor y `restore-local.ps1` la lee del propio backup. Así, un backup de un Postgres más nuevo (por ejemplo el 17 de Railway) se puede cargar en el Postgres local (15).
- **Formato:** los backups usan el formato *custom* de `pg_dump` (`--format=custom`), con `--no-owner --no-acl` para que no dependan de los usuarios de Railway.
- **PowerShell 5.1:** el SQL que lleva comillas dobles se envía por stdin, porque Windows PowerShell 5.1 las elimina de los argumentos de programas externos. Los errores se detectan con `$LASTEXITCODE`, no con `$ErrorActionPreference = 'Stop'`.
