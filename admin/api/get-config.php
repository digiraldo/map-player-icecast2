<?php
/**
 * API para obtener configuración
 * 
 * Este script lee el archivo de configuración stations.json y devuelve los datos en formato JSON.
 */

// Permitir CORS para peticiones AJAX
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json; charset=UTF-8");

// Definir constantes
define('DATA_PATH', '../../data/');
define('STATIONS_FILE', DATA_PATH . 'stations.json');
define('BACKUP_DIR', DATA_PATH . 'backups/');

// Asegurarse de que existe el directorio de datos y backups
if (!is_dir(DATA_PATH)) {
    mkdir(DATA_PATH, 0755, true);
}

if (!is_dir(BACKUP_DIR)) {
    mkdir(BACKUP_DIR, 0755, true);
}

// Comprobar que el archivo existe
if (!file_exists(STATIONS_FILE)) {
    echo json_encode([
        'error' => true,
        'message' => 'El archivo de configuración no existe'
    ]);
    exit;
}

// Leer el archivo de configuración
$configContent = file_get_contents(STATIONS_FILE);

// Verificar si se ha leído correctamente
if ($configContent === false) {
    echo json_encode([
        'error' => true,
        'message' => 'Error al leer el archivo de configuración'
    ]);
    exit;
}

// Decodificar el JSON
$config = json_decode($configContent, true);

// Verificar si es un JSON válido
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        'error' => true,
        'message' => 'Error al decodificar el archivo JSON: ' . json_last_error_msg()
    ]);
    exit;
}

// Enviar la configuración
echo json_encode($config);
