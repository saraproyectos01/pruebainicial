<#
.SYNOPSIS
    Script de push automatico Tanque (Anti-Choque) adaptado para pruebainicial.
.PARAMETER Mensaje
    Mensaje personalizado para el commit (opcional).
.EXAMPLE
    .\.scripts\gitpush.ps1
.EXAMPLE
    .\.scripts\gitpush.ps1 -Mensaje "Actualizacion de pruebas"
#>
param(
    [string]$Mensaje = ""
)

# 1. Asegurar ruta raiz del proyecto (GPS Interno)
Set-Location $PSScriptRoot
Set-Location ..

# 2. Localizar Git (PATH del sistema o GitHub Desktop)
$git = "git"
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    $desktopGit = Resolve-Path "$env:LOCALAPPDATA\GitHubDesktop\app-*\resources\app\git\cmd\git.exe" -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($desktopGit) {
        $git = $desktopGit.Path
    } else {
        Write-Host "[ERROR] No se encontro Git en el sistema ni en GitHub Desktop." -ForegroundColor Red
        exit 1
    }
}

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host " [TANQUE] REVISION Y PUSH AUTOMATICO" -ForegroundColor Cyan
Write-Host " Repositorio: $(Get-Location)" -ForegroundColor DarkGray
Write-Host "=================================================" -ForegroundColor Cyan

# 3. Verificar archivos vacios antes de agregar
$cambios = & $git status --porcelain
if ($cambios) {
    $emptyFiles = @()
    foreach ($line in ($cambios -split "`r?`n")) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        $file = $line.Substring(3).Trim()
        $file = $file.Trim('"')
        if (Test-Path $file) {
            $item = Get-Item $file
            if ($item.PSIsContainer -ne $true -and $item.Length -eq 0) {
                $emptyFiles += $file
            }
        }
    }

    if ($emptyFiles.Count -gt 0) {
        Write-Host ""
        Write-Host "[ADVERTENCIA] Se detectaron archivos VACIOS (0 bytes) modificados o nuevos:" -ForegroundColor Yellow
        foreach ($ef in $emptyFiles) {
            Write-Host "   -> $ef" -ForegroundColor Red
        }
        Write-Host ""
        $confirmacion = Read-Host "Deseas continuar con el push de estos archivos vacios? (S/N)"
        if ($confirmacion -notmatch "^[Ss]$") {
            Write-Host "Operacion cancelada. Por favor revisa tus archivos." -ForegroundColor Yellow
            exit
        }
    }
} else {
    Write-Host "[INFO] No se detectaron modificaciones en los archivos de trabajo." -ForegroundColor DarkCyan
}

# 4. Script Tanque (Anti-Choque)
& $git add -A

if ([string]::IsNullOrWhiteSpace($Mensaje)) {
    $msg = "Human Push $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
} else {
    $msg = $Mensaje
}

& $git commit -m "$msg" 2>$null

# Obtener rama actual (por defecto main)
$currentBranch = (& $git branch --show-current).Trim()
if (-not $currentBranch) {
    $currentBranch = "main"
}

# 5. Sincronizacion inteligente con remoto
$remoteBranchExists = & $git ls-remote --heads origin $currentBranch 2>$null

if ($remoteBranchExists) {
    Write-Host "[PULL] Sincronizando cambios con origin/$currentBranch..." -ForegroundColor Cyan
    & $git pull origin $currentBranch --rebase

    if ($LASTEXITCODE -ne 0) {
        Write-Host "[CONFLICTO] Conflicto detectado. Aplicando reparacion de Hierro..." -ForegroundColor Yellow
        & $git rebase --abort 2>$null
        & $git pull origin $currentBranch --no-rebase -X ours
        & $git add -A
        & $git commit -m "$msg (Conflict Resolved)" 2>$null
    }
} else {
    Write-Host "[INFO] Rama '$currentBranch' nueva en remoto. Saltando sincronizacion inicial..." -ForegroundColor DarkCyan
}

# 6. Push a GitHub
Write-Host "[PUSH] Subiendo cambios a origin/$currentBranch..." -ForegroundColor Cyan
& $git push -u origin $currentBranch
if ($LASTEXITCODE -eq 0) {
    Write-Host "[EXITO] Subida completada con exito!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Error al hacer push a origin/$currentBranch. Verifica credenciales o conexion." -ForegroundColor Red
}
