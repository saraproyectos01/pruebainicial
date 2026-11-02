<#
.SYNOPSIS
    Script de push automatico a GitHub con revision de cambios locales.
.PARAMETER Mensaje
    Mensaje opcional para el commit. Si no se indica, se genera con fecha y hora.
.EXAMPLE
    .\auto_push.ps1
.EXAMPLE
    .\auto_push.ps1 -Mensaje "Actualizacion de componentes"
#>
param(
    [string]$Mensaje = ""
)

$ErrorActionPreference = "Stop"

# 1. Localizar Git ejecutable
$gitExe = "git"
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    $desktopGit = Resolve-Path "$env:LOCALAPPDATA\GitHubDesktop\app-*\resources\app\git\cmd\git.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($desktopGit) {
        $gitExe = $desktopGit.Path
    } else {
        Write-Error "No se encontro Git en el sistema ni en GitHub Desktop."
        exit 1
    }
}

$repoPath = $PSScriptRoot
Set-Location $repoPath

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  REVISION Y PUSH AUTOMATICO - GITHUB" -ForegroundColor Cyan
Write-Host "  Repositorio: $repoPath" -ForegroundColor DarkGray
Write-Host "=================================================" -ForegroundColor Cyan

# 2. Verificar estado de cambios
$statusOutput = & $gitExe status --porcelain
if (-not $statusOutput) {
    Write-Host "`n[OK] No hay cambios de archivos pendientes por commitear." -ForegroundColor Green
    
    # Revisar si hay commits locales pendientes de push
    $ahead = & $gitExe rev-list --count "@{u}..HEAD" 2>$null
    if ($LASTEXITCODE -eq 0 -and [int]$ahead -gt 0) {
        Write-Host "Hay $ahead commit(s) pendientes de subir. Enviando al remoto..." -ForegroundColor Yellow
        & $gitExe push
        Write-Host "[EXITO] Commits pendientes subidos correctamente." -ForegroundColor Green
    } else {
        Write-Host "El repositorio local esta al dia con GitHub." -ForegroundColor Green
    }
    exit 0
}

Write-Host "`n[CAMBIOS DETECTADOS]" -ForegroundColor Yellow
& $gitExe status --short

# 3. Preparar mensaje de commit
if ([string]::IsNullOrWhiteSpace($Mensaje)) {
    $timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    $Mensaje = "Auto-push: $timestamp"
}

Write-Host "`nMensaje de commit: '$Mensaje'" -ForegroundColor Cyan

# 4. Agregar cambios (git add)
Write-Host "Agregando archivos al staging..." -ForegroundColor DarkGray
& $gitExe add -A

# 5. Crear commit
Write-Host "Creando commit..." -ForegroundColor DarkGray
& $gitExe commit -m $Mensaje

# 6. Obtener la rama actual
$currentBranch = (& $gitExe branch --show-current).Trim()
if (-not $currentBranch) {
    $currentBranch = "main"
}

# 7. Push a GitHub
Write-Host "Haciendo push a origin/$currentBranch..." -ForegroundColor Yellow
& $gitExe push -u origin $currentBranch

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[EXITO] Cambios enviados correctamente a GitHub!" -ForegroundColor Green
} else {
    Write-Host "`n[ERROR] Ocurrio un problema al hacer push." -ForegroundColor Red
    exit 1
}
