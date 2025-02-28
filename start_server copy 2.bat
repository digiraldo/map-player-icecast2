@echo on
SETLOCAL

REM =========================================
REM SCRIPT MEJORADO ANTI-CIERRE INESPERADO
REM =========================================

REM Captura errores y mantiene la consola abierta
cd /d "%~dp0" || (
    echo ERROR: No se pudo cambiar al directorio del script
    pause
    goto :EOF
)

echo.
echo *********************************************************
echo * INICIANDO SERVIDOR PHP - NO CIERRE ESTA VENTANA
echo *********************************************************
echo.

echo Creando archivo de registro...
set "logfile=%CD%\php_server_log.txt"
echo Hora de inicio: %date% %time% > %logfile%
echo.

echo Paso 1: Verificando PHP...
set PHP_FOUND=0

REM Métodos de verificación
echo Buscando PHP en PATH
where php >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo PHP encontrado en PATH del sistema
    echo PHP encontrado en PATH >> %logfile%
    set PHP_FOUND=1
    set PHP_PATH=php
    goto :START_SERVER
)

REM Búsqueda simple (evitando expresiones complejas)
echo Buscando en ubicaciones estándar...

REM Rutas potenciales
if exist "C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe" (
    echo PHP encontrado en Laragon
    set PHP_FOUND=1
    set PHP_PATH=C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe
    goto :START_SERVER
)

if exist "php-portable\php.exe" (
    echo PHP encontrado en carpeta portable
    set PHP_FOUND=1
    set PHP_PATH=php-portable\php.exe
    goto :START_SERVER
)

if exist "C:\xampp\php\php.exe" (
    echo PHP encontrado en XAMPP
    set PHP_FOUND=1
    set PHP_PATH=C:\xampp\php\php.exe
    goto :START_SERVER
)

:PHP_NOT_FOUND
echo.
echo *********************************************************
echo * ERROR: PHP NO ENCONTRADO
echo *********************************************************
echo.
echo Para resolver este problema:
echo 1. Instale PHP o Laragon/XAMPP
echo 2. Descargue PHP portable (S/N)?
echo.
set /p DOWNLOAD="> "

if /i "%DOWNLOAD%"=="S" (
    echo Descargando PHP portable...
    echo Intentando descargar PHP >> %logfile%
    
    md php-portable 2>nul
    
    echo Descargando con PowerShell...
    powershell -Command "& {try { $wc = New-Object System.Net.WebClient; $wc.DownloadFile('https://windows.php.net/downloads/releases/php-8.2.15-nts-Win32-vs16-x64.zip', 'php.zip'); Write-Output 'Descarga completa'; } catch { Write-Output $_.Exception.Message } }"
    
    if exist "php.zip" (
        echo Descomprimiendo...
        powershell -Command "& {try { Add-Type -AssemblyName System.IO.Compression.FileSystem; [System.IO.Compression.ZipFile]::ExtractToDirectory('php.zip', 'php-portable'); } catch { Write-Output $_.Exception.Message } }"
        
        if exist "php-portable\php.exe" (
            echo PHP portable instalado correctamente
            del php.zip
            set PHP_FOUND=1
            set PHP_PATH=php-portable\php.exe
            goto :START_SERVER
        ) else (
            echo ERROR: Falló la extracción de PHP
            if exist "php.zip" del php.zip
        )
    ) else (
        echo ERROR: Falló la descarga de PHP
    )
)

echo.
echo PHP no encontrado ni instalado.
echo Por favor, instale PHP manualmente o intente nuevamente.
echo.
goto :END_SCRIPT

:START_SERVER
echo.
echo *********************************************************
echo * INICIANDO SERVIDOR
echo * PHP: %PHP_PATH%
echo * URL: http://localhost:8000
echo *********************************************************
echo.

REM Intentar iniciar el servidor
echo Iniciando servidor web... >> %logfile%
"%PHP_PATH%" -S localhost:8000 -t .
echo Servidor detenido con código %ERRORLEVEL% >> %logfile%

echo.
echo *********************************************************
echo * SERVIDOR DETENIDO 
echo *********************************************************
echo.

:END_SCRIPT
echo Proceso finalizado. 
echo Presione CUALQUIER TECLA para salir...
REM DOBLE PAUSA: Esto asegura que incluso si hay algún error, la consola permanezca abierta
pause
pause