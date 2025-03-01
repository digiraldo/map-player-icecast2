@echo off
setlocal EnableDelayedExpansion
chcp 65001 > nul
mode con cols=90 lines=30
title MAP PLAYER ICECAST2 - Modo Visualización

REM Configuración de colores
set "BLUE=[94m"
set "GREEN=[92m"
set "RED=[91m"
set "YELLOW=[93m"
set "CYAN=[96m"
set "WHITE=[97m"
set "BOLD=[1m"
set "RESET=[0m"
set "BG_BLUE=[44m"
set "BG_GREEN=[42m"
set "BG_YELLOW=[43m"

REM Aseguramos estar en el directorio correcto
cd /d "%~dp0" || (
    echo %RED%ERROR: No se pudo acceder al directorio del script%RESET%
    pause
    goto :EOF
)

REM Limpiamos la pantalla y mostramos título
cls
echo.
echo %BG_BLUE%%WHITE%%BOLD%                                                                                %RESET%
echo %BG_BLUE%%WHITE%%BOLD%                       MAP PLAYER ICECAST2 - MODO VISUAL                        %RESET%
echo %BG_BLUE%%WHITE%%BOLD%                                                                                %RESET%
echo.
echo %BG_YELLOW%%WHITE%%BOLD%                           SOLO PARA VISUALIZACIÓN                            %RESET%
echo.

REM Creamos el archivo de registro
set "logfile=%CD%\view_log.txt"
echo ┌─%CYAN% Iniciando servidor de visualización %RESET%────────────────────────────────────────┐
echo │ Hora: %WHITE%%TIME% %DATE%%RESET%
echo │ Log: %WHITE%%logfile%%RESET%
echo └───────────────────────────────────────────────────────────────────────────┘
echo.
echo [%date% %time%] Iniciando servidor de visualización > %logfile%

REM Variables para búsqueda de servidor
set "SERVER_FOUND=0"
set "SERVER_TYPE="
set "SERVER_CMD="
set "PORT=8080"

echo %BLUE%┌─ Paso 1: Buscando servidores disponibles ─────────────────────────────────────┐%RESET%

REM Comprobar Python
echo │ %YELLOW%Comprobando si Python está disponible...%RESET%
where python >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo │ %GREEN%[✓] Python encontrado%RESET%
    
    REM Verificar versión para saber si es Python 2 o 3
    for /f "tokens=2" %%a in ('python --version 2^>^&1') do set "PY_VER=%%a"
    echo │ %CYAN%   Versión: %PY_VER%%RESET%
    
    if "!PY_VER:~0,1!"=="3" (
        echo │ %GREEN%[✓] Usando Python 3 http.server%RESET%
        set "SERVER_TYPE=Python"
        set "SERVER_CMD=python -m http.server %PORT%"
        set "SERVER_FOUND=1"
        goto :SERVER_FOUND
    ) else (
        echo │ %GREEN%[✓] Usando Python 2 SimpleHTTPServer%RESET%
        set "SERVER_TYPE=Python"
        set "SERVER_CMD=python -m SimpleHTTPServer %PORT%"
        set "SERVER_FOUND=1"
        goto :SERVER_FOUND
    )
)

REM Comprobar Node.js
echo │ %YELLOW%Comprobando si Node.js está disponible...%RESET%
where node >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo │ %GREEN%[✓] Node.js encontrado%RESET%
    
    REM Crear un pequeño archivo de servidor HTTP temporal
    echo var http = require('http'); > temp_server.js
    echo var fs = require('fs'); >> temp_server.js
    echo var path = require('path'); >> temp_server.js
    echo var port = %PORT%; >> temp_server.js
    echo var types = { >> temp_server.js
    echo   '.html': 'text/html', >> temp_server.js
    echo   '.js': 'application/javascript', >> temp_server.js
    echo   '.css': 'text/css', >> temp_server.js
    echo   '.json': 'application/json', >> temp_server.js
    echo   '.png': 'image/png', >> temp_server.js
    echo   '.jpg': 'image/jpeg', >> temp_server.js
    echo   '.svg': 'image/svg+xml' >> temp_server.js
    echo }; >> temp_server.js
    echo http.createServer(function(req, res) { >> temp_server.js
    echo   console.log('Solicitud: ' + req.url); >> temp_server.js
    echo   var filePath = '.' + req.url; >> temp_server.js
    echo   if (filePath == './') { >> temp_server.js
    echo     filePath = './index.html'; >> temp_server.js
    echo   } >> temp_server.js
    echo   var extname = String(path.extname(filePath)).toLowerCase(); >> temp_server.js
    echo   var contentType = types[extname] || 'application/octet-stream'; >> temp_server.js
    echo   fs.readFile(filePath, function(error, content) { >> temp_server.js
    echo     if (error) { >> temp_server.js
    echo       if(error.code == 'ENOENT') { >> temp_server.js
    echo         fs.readFile('./404.html', function(error, content) { >> temp_server.js
    echo           res.writeHead(404, { 'Content-Type': 'text/html' }); >> temp_server.js
    echo           res.end('Página no encontrada', 'utf-8'); >> temp_server.js
    echo         }); >> temp_server.js
    echo       } else { >> temp_server.js
    echo         res.writeHead(500); >> temp_server.js
    echo         res.end('Error interno del servidor: '+error.code); >> temp_server.js
    echo       } >> temp_server.js
    echo     } else { >> temp_server.js
    echo       res.writeHead(200, { 'Content-Type': contentType }); >> temp_server.js
    echo       res.end(content, 'utf-8'); >> temp_server.js
    echo     } >> temp_server.js
    echo   }); >> temp_server.js
    echo }).listen(port); >> temp_server.js
    echo console.log('Servidor en ejecución en http://localhost:' + port); >> temp_server.js
    
    set "SERVER_TYPE=Node.js"
    set "SERVER_CMD=node temp_server.js"
    set "SERVER_FOUND=1"
    goto :SERVER_FOUND
)

echo │ %RED%[✗] No se encontró ningún servidor compatible%RESET%
echo │
echo │ %WHITE%Para iniciar el servidor de visualización, necesita alguna de estas opciones:%RESET%
echo │
echo │ %YELLOW%[1] Instalar Python (https://www.python.org/downloads/)
echo │ [2] Instalar Node.js (https://nodejs.org/)
echo │ [3] Ver archivo index.html directamente en el navegador%RESET%
echo %BLUE%└───────────────────────────────────────────────────────────────────────────┘%RESET%
echo.

set /p OPTION=%WHITE%Seleccione una opción (1-3): %RESET%

if "%OPTION%"=="3" (
    echo.
    echo %YELLOW%Abriendo index.html directamente en el navegador...%RESET%
    start "" "index.html"
    echo %RED%NOTA: Algunas funciones pueden no estar disponibles al abrir el archivo directamente.%RESET%
    echo.
    goto :END_SCRIPT
)

goto :END_SCRIPT

:SERVER_FOUND
echo %BLUE%└───────────────────────────────────────────────────────────────────────────┘%RESET%
echo.

REM Modificar el index.html temporalmente para modo visualización
echo %YELLOW%Creando página para modo visualización (solo lectura)...%RESET%

set "temp_file=index_view.html"
copy index.html %temp_file% >nul
echo ^<div style="position: fixed; top: 0; left: 0; right: 0; background-color: #ffc107; color: #000; text-align: center; padding: 2px; font-size: 11px; z-index: 9999;"^>MODO VISUALIZACIÓN - SOLO LECTURA^</div^>^<script^>window.addEventListener('DOMContentLoaded', function() { const infoCard = document.getElementById('infoCard'); if(infoCard) { const currentTop = parseInt(infoCard.style.top || '20', 10); infoCard.style.top = (currentTop + 10) + 'px'; } });^</script^> >> %temp_file%

REM Añadir referencia al nuevo archivo JavaScript para modo visualización
powershell -Command "(Get-Content %temp_file%) -replace '(</body>)', '<script src=\"js/visualization-mode.js\"></script>$1' | Set-Content %temp_file%"

REM NO eliminar botón editar del archivo, ahora lo usaremos para editar configuración local
REM powershell -Command "(Get-Content %temp_file%) -replace '^.*id=\"editButton\".*$', '' | Set-Content %temp_file%"

echo %BG_GREEN%%WHITE%%BOLD%                          INICIANDO SERVIDOR VISUAL                             %RESET%
echo.
echo %GREEN%┌─ Información del servidor ────────────────────────────────────────────────┐%RESET%
echo │ %WHITE%Dirección: %CYAN%http://localhost:%PORT%%RESET%
echo │ %WHITE%Modo: %CYAN%VISUALIZACIÓN (SOLO LECTURA)%RESET%
echo │ %WHITE%Servidor: %CYAN%%SERVER_TYPE%%RESET%
echo │ %WHITE%Comando: %CYAN%%SERVER_CMD%%RESET%
echo │
echo │ %YELLOW%El servidor está funcionando. Pulse CTRL+C para detenerlo.%RESET%
echo │
echo │ %RED%ADVERTENCIA: Este modo no permite modificar el archivo stations.json.%RESET%
echo │ %RED%             Para editar, use el script original start_server.bat.%RESET%
echo %GREEN%└───────────────────────────────────────────────────────────────────────────┘%RESET%

REM Abrir navegador
start "" "http://localhost:%PORT%/%temp_file%"

REM Iniciar el servidor
echo [%date% %time%] Iniciando servidor %SERVER_TYPE% en puerto %PORT% >> %logfile%
%SERVER_CMD%

REM Limpiar archivos temporales al finalizar
if "%SERVER_TYPE%"=="Node.js" (
    del temp_server.js >nul 2>&1
)
if exist "%temp_file%" (
    del %temp_file% >nul 2>&1
)

echo.
echo %RED%┌─ Servidor detenido ────────────────────────────────────────────────────────┐%RESET%
echo │ %WHITE%El servidor ha sido detenido.%RESET%
echo │ %WHITE%Hora: %CYAN%%TIME%%RESET%
echo %RED%└───────────────────────────────────────────────────────────────────────────┘%RESET%
echo.

:END_SCRIPT
echo %YELLOW%Presione cualquier tecla para salir...%RESET%
pause > nul
