<#
.SYNOPSIS
  Crea un backup (pg_dump) de una base de datos Postgres en la carpeta backups/ del proyecto.

.DESCRIPTION
  Solo LEE la base de datos: no modifica nada en el servidor.
  Usa Docker para no tener que instalar las herramientas de Postgres, y elige
  automáticamente la versión de pg_dump que corresponde al servidor.

  La URL de la base de datos se toma, en este orden, de:
    1. El parámetro -DatabaseUrl
    2. La variable de entorno BACKUP_DATABASE_URL
    3. El archivo backups/.database-url (ignorado por git)
    4. Se pide por consola (sin mostrarla en pantalla)

  En Railway usa la DATABASE_PUBLIC_URL del servicio Postgres
  (la URL ".railway.internal" solo funciona dentro de Railway).

.EXAMPLE
  .\scripts\backup-db.ps1
  Crea backups/prod-2026-10-23_1530.dump

.EXAMPLE
  .\scripts\backup-db.ps1 -Name staging -DatabaseUrl "postgresql://..."
  Crea backups/staging-2026-10-23_1530.dump
#>
param(
  [string]$DatabaseUrl,
  [string]$Name = 'prod'
)

# 'Continue': en Windows PowerShell 5.1, 'Stop' corta el script con cualquier aviso que docker o
# pg_dump escriban en stderr. Los errores se detectan con $LASTEXITCODE después de cada comando.
$ErrorActionPreference = 'Continue'

$root = Split-Path $PSScriptRoot -Parent
$backupDir = Join-Path $root 'backups'
$urlFile = Join-Path $backupDir '.database-url'
New-Item -ItemType Directory -Force $backupDir | Out-Null

function Fail($message) {
  Write-Host "ERROR: $message" -ForegroundColor Red
  exit 1
}

# --- 1. URL de la base de datos ---
if (-not $DatabaseUrl) { $DatabaseUrl = $env:BACKUP_DATABASE_URL }
if (-not $DatabaseUrl -and (Test-Path $urlFile)) { $DatabaseUrl = (Get-Content $urlFile -Raw).Trim() }
if (-not $DatabaseUrl) {
  $secure = Read-Host 'URL de la base de datos (DATABASE_PUBLIC_URL)' -AsSecureString
  $DatabaseUrl = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure))
}
if ($DatabaseUrl -notmatch '^postgres(ql)?://') { Fail 'La URL debe empezar con postgresql://' }

# Se muestra solo el servidor y la base, nunca el usuario ni la contraseña
$uri = [uri]$DatabaseUrl
$target = "$($uri.Host):$($uri.Port)$($uri.AbsolutePath)"
if ($uri.Host -like '*.railway.internal') {
  Fail 'Esa es la URL privada de Railway: usa la DATABASE_PUBLIC_URL del servicio Postgres.'
}

# --- 2. Docker ---
docker info *> $null
if ($LASTEXITCODE -ne 0) { Fail 'Docker no está corriendo. Abre Docker Desktop y vuelve a intentarlo.' }

# --- 3. Versión del servidor: pg_dump debe ser de la misma versión mayor (o más nueva) ---
Write-Host "Conectando a $target ..."
$versionNum = docker run --rm postgres:17 psql $DatabaseUrl -tAc 'SHOW server_version_num'
if ($LASTEXITCODE -ne 0) { Fail "No se pudo conectar a $target. Revisa la URL." }
$major = [int][math]::Floor([int]$versionNum.Trim() / 10000)
Write-Host "Servidor Postgres $major"

# --- 4. Backup ---
$file = "$Name-$(Get-Date -Format 'yyyy-MM-dd_HHmm').dump"
Write-Host "Creando backups/$file ..."
docker run --rm -v "${backupDir}:/backup" "postgres:$major" `
  pg_dump $DatabaseUrl --format=custom --no-owner --no-acl --file "/backup/$file"
if ($LASTEXITCODE -ne 0) { Fail 'pg_dump falló.' }

# --- 5. Verificación: el archivo se puede leer y trae las tablas ---
$tables = docker run --rm -v "${backupDir}:/backup" "postgres:$major" pg_restore --list "/backup/$file" |
  Select-String 'TABLE DATA'
if ($LASTEXITCODE -ne 0 -or -not $tables) { Fail "El backup backups/$file no es válido." }

$bytes = (Get-Item (Join-Path $backupDir $file)).Length
$size = if ($bytes -ge 1MB) { '{0:N1} MB' -f ($bytes / 1MB) } else { '{0:N0} KB' -f ($bytes / 1KB) }
Write-Host ''
Write-Host "Backup listo: backups/$file ($size, $($tables.Count) tablas con datos)" -ForegroundColor Green
Write-Host 'Contiene datos personales: no lo compartas ni lo subas a ningún repositorio.'
