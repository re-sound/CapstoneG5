# Script para iniciar todo el proyecto Atreu
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    INICIANDO PROYECTO ATREU COMPLETO" -ForegroundColor Cyan  
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Iniciando servicios:" -ForegroundColor Yellow
Write-Host "- Backend Real (Puerto 3000)" -ForegroundColor Green
Write-Host "- Simulador Backend (Puerto 3001)" -ForegroundColor Green
Write-Host "- Frontend React (Puerto 5173)" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan

# Obtener el directorio del script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Función para abrir nuevas ventanas de PowerShell
function Start-NewPowerShell {
    param(
        [string]$Title,
        [string]$Command,
        [string]$WorkingDirectory
    )
    
    Start-Process powershell -ArgumentList @(
        "-NoExit", 
        "-Command", 
        "& { Set-Location '$WorkingDirectory'; $Host.UI.RawUI.WindowTitle = '$Title'; $Command }"
    )
}

Write-Host "Iniciando Backend Real..." -ForegroundColor Yellow
Start-NewPowerShell -Title "Atreu Backend Real" -Command "npm run dev:real" -WorkingDirectory "$scriptPath\atreu-temperature\server"

Start-Sleep -Seconds 2

Write-Host "Iniciando Simulador Backend..." -ForegroundColor Yellow  
Start-NewPowerShell -Title "Atreu Simulador" -Command "npm run dev:sim-real" -WorkingDirectory "$scriptPath\atreu-temperature\server"

Start-Sleep -Seconds 2

Write-Host "Iniciando Frontend..." -ForegroundColor Yellow
Start-NewPowerShell -Title "Atreu Frontend" -Command "npm run dev" -WorkingDirectory "$scriptPath\atreu-temperature"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TODOS LOS SERVICIOS INICIADOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Se han abierto 3 ventanas de PowerShell:" -ForegroundColor Yellow
Write-Host "1. Backend Real (puerto 3000)" -ForegroundColor White
Write-Host "2. Simulador Backend (puerto 3001)" -ForegroundColor White
Write-Host "3. Frontend React (puerto 5173)" -ForegroundColor White
Write-Host ""
Write-Host "Para detener todos los servicios, cierra las ventanas o presiona Ctrl+C en cada una." -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona cualquier tecla para continuar..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")