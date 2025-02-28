@echo off
setlocal EnableDelayedExpansion
chcp 65001 > nul
mode con cols=90 lines=30
title MAP PLAYER ICECAST2 - Servidor PHP

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
echo %BG_BLUE%%WHITE%%BOLD%                     MAP PLAYER ICECAST2 - SERVIDOR LOCAL                       %RESET%
echo %BG_BLUE%%WHITE%%BOLD%                                                                                %RESET%
echo.

REM Creamos el archivo de registro
set "logfile=%CD%\server_log.txt"
echo ┌─%CYAN% Iniciando servidor PHP %RESET%────────────────────────────────────────────────┐
echo │ Hora: %WHITE%%TIME% %DATE%%RESET%
echo │ Log: %WHITE%%logfile%%RESET%
echo └───────────────────────────────────────────────────────────────────────────┘
echo.
echo [%date% %time%] Iniciando servidor > %logfile%

REM Variables para búsqueda de PHP
set "PHP_FOUND=0"
set "PHP_PATH="

echo %BLUE%┌─ Paso 1: Verificando PHP ─────────────────────────────────────────────────┐%RESET%

REM Buscando PHP en PATH
echo │ %YELLOW%Buscando PHP en PATH del sistema...%RESET%
where php >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo │ %GREEN%[✓] PHP encontrado en PATH global%RESET%
    echo [%date% %time%] PHP encontrado en PATH >> %logfile%
    set "PHP_FOUND=1"
    set "PHP_PATH=php"
    goto :PHP_FOUND
)

echo │ %YELLOW%Buscando en ubicaciones habituales...%RESET%

REM Rutas a comprobar (común en entornos de desarrollo)
if exist "C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe" (
    echo │ %GREEN%[✓] PHP encontrado en Laragon%RESET%
    echo [%date% %time%] PHP encontrado en Laragon >> %logfile%
    set "PHP_FOUND=1"
    set "PHP_PATH=C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe"
    goto :PHP_FOUND
)

if exist "C:\xampp\php\php.exe" (
    echo │ %GREEN%[✓] PHP encontrado en XAMPP%RESET%
    echo [%date% %time%] PHP encontrado en XAMPP >> %logfile%
    set "PHP_FOUND=1"
    set "PHP_PATH=C:\xampp\php\php.exe"
    goto :PHP_FOUND
)

if exist "php-portable\php.exe" (
    echo │ %GREEN%[✓] PHP portable encontrado%RESET%
    echo [%date% %time%] PHP encontrado en carpeta portable >> %logfile%
    set "PHP_FOUND=1"
    set "PHP_PATH=php-portable\php.exe"
    goto :PHP_FOUND
)

echo │ %RED%[✗] No se encontró PHP instalado%RESET%
echo │
echo │ %WHITE%Se requiere PHP para ejecutar el servidor:
echo │
echo │ %YELLOW%[1] Instalar PHP (https://windows.php.net/)
echo │ [2] Instalar XAMPP (https://www.apachefriends.org/)
echo │ [3] Instalar Laragon (https://laragon.org/)
echo │ [4] Descargar PHP portable ahora%RESET%
echo %BLUE%└───────────────────────────────────────────────────────────────────────────┘%RESET%
echo.

set /p OPTION=%WHITE%Seleccione una opción (1-4): %RESET%

if "%OPTION%"=="4" (
    echo.
    echo %BLUE%┌─ Instalando PHP portable ─────────────────────────────────────────────────┐%RESET%
    echo │ %YELLOW%Creando directorio y descargando archivos...%RESET%
    echo [%date% %time%] Descargando PHP portable >> %logfile%
    
    REM Crear directorio si no existe
    if not exist "php-portable" mkdir php-portable 2>nul
    
    echo │ %YELLOW%Descargando PHP desde windows.php.net...%RESET%
    echo │ %CYAN%Progreso: [          ] 0%%%RESET%
    powershell -Command "& {try { $wc = New-Object System.Net.WebClient; $wc.DownloadFile('https://windows.php.net/downloads/releases/php-8.2.15-nts-Win32-vs16-x64.zip', 'php.zip'); } catch { exit 1 }}"
    
    if %ERRORLEVEL% NEQ 0 (
        echo │ %RED%[✗] Error: No se pudo descargar PHP%RESET%
        echo [%date% %time%] Error de descarga >> %logfile%
        goto :DOWNLOAD_FAILED
    ) else (
        echo │ %GREEN%[✓] Descarga completa%RESET%
    )
    
    echo │ %YELLOW%Extrayendo archivos PHP...%RESET%
    echo │ %CYAN%Progreso: [■■■■      ] 40%%%RESET%
    powershell -Command "& {try { Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('php.zip', 'php-portable'); } catch { exit 1 }}"
    
    if %ERRORLEVEL% NEQ 0 (
        echo │ %RED%[✗] Error: No se pudieron extraer los archivos%RESET%
        echo [%date% %time%] Error de extracción >> %logfile%
        if exist "php.zip" del php.zip
        goto :DOWNLOAD_FAILED
    ) else (
        echo │ %GREEN%[✓] Extracción completa%RESET%
    )
    
    echo │ %YELLOW%Configurando PHP...%RESET%
    echo │ %CYAN%Progreso: [■■■■■■■■  ] 80%%%RESET%
    copy php-portable\php.ini-development php-portable\php.ini >nul
    del php.zip
    
    echo │ %GREEN%[✓] PHP configurado correctamente%RESET%
    echo │ %CYAN%Progreso: [■■■■■■■■■■] 100%%%RESET%
    echo [%date% %time%] PHP portable instalado correctamente >> %logfile%
    set "PHP_FOUND=1"
    set "PHP_PATH=php-portable\php.exe"
    echo %BLUE%└───────────────────────────────────────────────────────────────────────────┘%RESET%
    echo.
    goto :PHP_FOUND
)

:DOWNLOAD_FAILED
echo %BLUE%└───────────────────────────────────────────────────────────────────────────┘%RESET%
echo.
echo %RED%No se pudo instalar PHP portable.%RESET%
echo %YELLOW%Por favor, instale PHP manualmente e inténtelo de nuevo.%RESET%
echo.
goto :END_SCRIPT

:PHP_FOUND
echo │ %CYAN%Versión de PHP: %RESET%
"%PHP_PATH%" -v | findstr /n PHP
echo %BLUE%└───────────────────────────────────────────────────────────────────────────┘%RESET%
echo.

REM Iniciando servidor web
echo %BG_GREEN%%WHITE%%BOLD%                           INICIANDO SERVIDOR WEB                              %RESET%
echo.
echo %GREEN%┌─ Información del servidor ────────────────────────────────────────────────┐%RESET%
echo │ %WHITE%Dirección: %CYAN%http://localhost:8000%RESET%
echo │ %WHITE%Directorio: %CYAN%%CD%%RESET%
echo │ %WHITE%PHP: %CYAN%%PHP_PATH%%RESET%
echo │
echo │ %YELLOW%El servidor está funcionando. Pulse CTRL+C para detenerlo.%RESET%
echo %GREEN%└───────────────────────────────────────────────────────────────────────────┘%RESET%
echo.

REM Iniciar el servidor PHP
echo [%date% %time%] Iniciando servidor PHP en puerto 8000 >> %logfile%
"%PHP_PATH%" -S localhost:8000 -t .
echo [%date% %time%] Servidor detenido con código %ERRORLEVEL% >> %logfile%

echo.
echo %RED%┌─ Servidor detenido ────────────────────────────────────────────────────────┐%RESET%
echo │ %WHITE%El servidor ha sido detenido.%RESET%
echo │ %WHITE%Hora: %CYAN%%TIME%%RESET%
echo %RED%└───────────────────────────────────────────────────────────────────────────┘%RESET%
echo.

:END_SCRIPT
echo %YELLOW%Presione cualquier tecla para salir...%RESET%
pause > nul