<#
.SYNOPSIS
  Restaura un backup de backups/ en el Postgres LOCAL de docker-compose, para hacer pruebas.

.DESCRIPTION
  Solo puede escribir en el contenedor local "postgres-db" de docker-compose:
  nunca se conecta a Railway ni a otro servidor.

  Por defecto restaura en una base aparte (caja_backup), así tu base de desarrollo
  no se toca. La base destino se BORRA y se vuelve a crear con el contenido del backup.

  Para usarla, cambia en tu .env la base de POSTGRES_URL por la restaurada
  (el script te muestra la URL exacta) y reinicia `npm run dev`.

.EXAMPLE
  .\scripts\restore-local.ps1
  Restaura el backup más reciente en la base local caja_backup.

.EXAMPLE
  .\scripts\restore-local.ps1 -File backups\prod-2026-10-23_1530.dump -Database caja_prueba
#>
param(
  [string]$File,
  [string]$Database = 'caja_backup',
  [switch]$Force
)

# 'Continue': en Windows PowerShell 5.1, 'Stop' corta el script con cualquier aviso que docker o
# pg_dump escriban en stderr. Los errores se detectan con $LASTEXITCODE después de cada comando.
$ErrorActionPreference = 'Continue'

$root = Split-Path $PSScriptRoot -Parent
$backupDir = Join-Path $root 'backups'

function Fail($message) {
  Write-Host "ERROR: $message" -ForegroundColor Red
  exit 1
}

# Lee una variable del .env del proyecto
function Get-EnvValue($key, $default) {
  $envFile = Join-Path $root '.env'
  if (Test-Path $envFile) {
    $line = Get-Content $envFile | Where-Object { $_ -match "^\s*$key\s*=" } | Select-Object -First 1
    if ($line) { return ($line -split '=', 2)[1].Trim() }
  }
  return $default
}

# --- 1. Backup a restaurar (por defecto, el más reciente) ---
if ($File) {
  $dump = Get-Item $File -ErrorAction SilentlyContinue
  if (-not $dump) { Fail "No existe el archivo $File" }
} else {
  $dump = Get-ChildItem $backupDir -Filter '*.dump' -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending | Select-Object -First 1
  if (-not $dump) { Fail 'No hay backups en backups/. Crea uno con .\scripts\backup-db.ps1' }
}
if ($Database -notmatch '^[A-Za-z0-9_]+$') { Fail 'El nombre de la base solo puede tener letras, números y _' }

# --- 2. Contenedor local de Postgres (docker-compose) ---
docker info *> $null
if ($LASTEXITCODE -ne 0) { Fail 'Docker no está corriendo. Abre Docker Desktop y vuelve a intentarlo.' }

Push-Location $root
try { $container = docker compose ps -q postgres-db 2>$null } finally { Pop-Location }
if (-not $container) { Fail 'El contenedor postgres-db no está corriendo. Ejecuta: docker compose up -d postgres-db' }

$user = Get-EnvValue 'POSTGRES_USER' 'postgres'
$password = Get-EnvValue 'POSTGRES_PASSWORD' ''
$port = Get-EnvValue 'POSTGRES_PORT' '5432'

# --- 3. Confirmación si la base ya existe ---
$exists = docker exec $container psql -U $user -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$Database'"
if ($exists -and -not $Force) {
  $devDb = ([uri](Get-EnvValue 'POSTGRES_URL' 'postgresql://x@localhost/x')).AbsolutePath.TrimStart('/')
  if ($devDb -eq $Database) {
    Write-Host "ATENCIÓN: '$Database' es la base que usa tu .env (POSTGRES_URL)." -ForegroundColor Yellow
  }
  Write-Host "La base local '$Database' ya existe y se va a BORRAR para restaurar el backup." -ForegroundColor Yellow
  $answer = Read-Host "Escribe '$Database' para continuar"
  if ($answer -ne $Database) { Write-Host 'Cancelado.'; exit 0 }
}

# --- 4. Versión del backup: pg_restore debe ser igual o más nuevo que el pg_dump que lo creó ---
$header = docker run --rm -v "$($dump.DirectoryName):/backup" postgres:17 pg_restore --list "/backup/$($dump.Name)" |
  Select-String 'Dumped by pg_dump version: (\d+)'
if (-not $header) { Fail "$($dump.Name) no parece un backup válido." }
$major = [int]$header.Matches[0].Groups[1].Value

# --- 5. Borrar, crear y restaurar ---
Write-Host "Restaurando $($dump.Name) en la base local '$Database' ..."
# El SQL va por stdin: Windows PowerShell 5.1 quita las comillas dobles de los argumentos de programas externos
"SET client_min_messages = warning;`nDROP DATABASE IF EXISTS `"$Database`" WITH (FORCE);`nCREATE DATABASE `"$Database`";" |
  docker exec -i $container psql -U $user -d postgres -q -v ON_ERROR_STOP=1
if ($LASTEXITCODE -ne 0) { Fail 'No se pudo crear la base local.' }

# pg_restore corre en un contenedor aparte (de la versión del backup) y se conecta al Postgres local
$localUrl = "postgresql://${user}:${password}@host.docker.internal:${port}/$Database"
$output = docker run --rm -v "$($dump.DirectoryName):/backup" "postgres:$major" `
  pg_restore --no-owner --no-acl -d $localUrl "/backup/$($dump.Name)" 2>&1
$errors = $output | Where-Object { $_ -match 'error:' }

# Un backup de un Postgres más nuevo trae parámetros que el Postgres local (15) no conoce;
# ese error es inofensivo, cualquier otro se muestra
$realErrors = $errors | Where-Object { $_ -notmatch 'unrecognized configuration parameter "transaction_timeout"' }
if ($realErrors) {
  $output | ForEach-Object { Write-Host $_ }
  Fail 'pg_restore terminó con errores.'
}

# --- 6. Verificación ---
$counts = @"
SELECT 'Usuarios', count(*) FROM "User"
UNION ALL SELECT 'Empleados', count(*) FROM "Employee"
UNION ALL SELECT 'Cajas', count(*) FROM "CashRegisterRecord"
UNION ALL SELECT 'Ventas', count(*) FROM "TransactionRecord";
"@ | docker exec -i $container psql -U $user -d $Database -tA -F ' '
if ($LASTEXITCODE -ne 0) { Fail 'La base se restauró, pero no se pudieron contar los registros.' }
Write-Host ''
Write-Host "Backup restaurado en la base local '$Database':" -ForegroundColor Green
$counts | ForEach-Object { Write-Host "  $_" }
Write-Host ''
Write-Host "Para usarla, en tu .env cambia SOLO el nombre de la base al final de POSTGRES_URL por '$Database':"
Write-Host "  postgresql://${user}:<tu contraseña>@127.0.0.1:${port}/$Database"
Write-Host '  (<tu contraseña> es la misma de POSTGRES_PASSWORD; no copies esta línea tal cual)'
Write-Host 'y reinicia npm run dev.'
