<?php
$file = __DIR__ . '/data/test.txt';
$result = file_put_contents($file, 'Prueba de escritura: ' . date('Y-m-d H:i:s'));

if ($result === false) {
    echo "Error: No se pudo escribir en el archivo. Verifica los permisos.";
} else {
    echo "¡Éxito! Se escribieron $result bytes en el archivo.";
}
?>