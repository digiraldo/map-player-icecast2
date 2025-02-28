<?php
header('Content-Type: text/plain');

$test_file = __DIR__ . '/data/test_write.txt';
$content = "Test write: " . date('Y-m-d H:i:s');

echo "Intentando escribir en: {$test_file}\n";

if (file_put_contents($test_file, $content)) {
    echo "Éxito: Archivo escrito correctamente\n";
} else {
    echo "Error: No se pudo escribir el archivo\n";
    echo "Error detalles: " . var_export(error_get_last(), true) . "\n";
}

echo "\nInformación sobre el archivo stations.json:\n";
$stations_json = __DIR__ . '/data/stations.json';
if (file_exists($stations_json)) {
    echo "El archivo stations.json existe\n";
    echo "Permisos: " . substr(sprintf('%o', fileperms($stations_json)), -4) . "\n";
    
    // Prueba directa de escritura en stations.json
    echo "\nProbando escritura directamente en stations.json:\n";
    // Primero hacer una copia de seguridad
    $backup_file = __DIR__ . '/data/stations.json.bak';
    if (copy($stations_json, $backup_file)) {
        echo "Copia de seguridad creada en: {$backup_file}\n";
        
        // Intentar escribir un cambio mínimo
        $json_content = file_get_contents($stations_json);
        $data = json_decode($json_content, true);
        $timestamp = date('Y-m-d H:i:s');
        $data['_test_timestamp'] = $timestamp; 
        
        $modified_content = json_encode($data, JSON_PRETTY_PRINT);
        if (file_put_contents($stations_json, $modified_content)) {
            echo "Éxito: Se modificó stations.json correctamente\n";
            echo "Se agregó marca de tiempo: {$timestamp}\n";
            
            // Restaurar el archivo original
            if (copy($backup_file, $stations_json)) {
                echo "Archivo stations.json restaurado desde la copia de seguridad\n";
            } else {
                echo "ERROR: No se pudo restaurar el archivo original\n";
            }
        } else {
            echo "ERROR: No se pudo escribir en stations.json\n";
            echo "Detalles: " . var_export(error_get_last(), true) . "\n";
        }
    } else {
        echo "ERROR: No se pudo crear copia de seguridad\n";
    }
} else {
    echo "El archivo stations.json no existe\n";
}
?>
