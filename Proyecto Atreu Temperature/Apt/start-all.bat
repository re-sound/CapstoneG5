@echo off
echo ========================================
echo    INICIANDO PROYECTO ATREU COMPLETO
echo ========================================
echo.
echo Iniciando servicios:
echo - Backend Real (Puerto 3000)
echo - Simulador Backend (Puerto 3001) 
echo - Frontend React (Puerto 5173)
echo.
echo ========================================

REM Cambiar al directorio base
cd /d "%~dp0"

REM Crear ventanas separadas para cada servicio
echo Iniciando Backend Real...
start "Atreu Backend Real" cmd /k "cd atreu-temperature\server && npm run dev:real"

echo Iniciando Simulador Backend...  
start "Atreu Simulador" cmd /k "cd atreu-temperature\server && npm run dev:sim-real"

echo Iniciando Frontend...
start "Atreu Frontend" cmd /k "cd atreu-temperature && npm run dev"

echo.
echo ========================================
echo   TODOS LOS SERVICIOS INICIADOS
echo ========================================
echo.
echo Se han abierto 3 ventanas de terminal:
echo 1. Backend Real (puerto 3000)
echo 2. Simulador Backend (puerto 3001)
echo 3. Frontend React (puerto 5173)
echo.
echo Para detener todos los servicios, cierra las ventanas de terminal.
echo.
pause