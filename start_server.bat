@echo off
echo Iniciando servidor web temporal...
php -S localhost:8000 -t .
echo Servidor web temporal iniciado en http://localhost:8000
pause