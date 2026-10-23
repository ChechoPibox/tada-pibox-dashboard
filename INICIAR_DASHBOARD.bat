@echo off
title Dashboard TaDa PiBox
cd /d "%~dp0"

echo ======================================================
echo    INICIANDO SERVIDOR LOCAL - DASHBOARD TADA PIBOX
echo ======================================================
echo.
echo 1. Abriendo el Dashboard en tu navegador...
start http://localhost:8000

echo 2. Servidor activo en http://localhost:8000
echo.
echo NOTA: Deja esta ventana abierta mientras uses el Dashboard.
echo Cuando termines, solo cierra esta ventana con la X.
echo ======================================================
echo.

python -m http.server 8000
if %errorlevel% neq 0 (
    echo.
    echo Si el puerto 8000 estaba ocupado, intentando en el puerto 8080...
    start http://localhost:8080
    python -m http.server 8080
)
pause
