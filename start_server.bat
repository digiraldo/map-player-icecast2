@echo off
echo Iniciando servidor web temporal...
"C:\laragon\bin\php\php-8.1.10-Win32-vs16-x64\php.exe" -S localhost:8000 -t .
echo Servidor web temporal iniciado en http://localhost:8000
pause