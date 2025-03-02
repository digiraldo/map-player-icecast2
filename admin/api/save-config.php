<?php
/**
 * API para guardar configuración
 * 
 * Este script recibe los datos de configuración y los guarda en el archivo stations.json.
 */

// Permitir CORS para peticiones AJAX
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json; charset=UTF-8");

// Para OPTIONS requests en CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("Access-Control-Allow-Headers: Content-Type");
    exit(0);
}

// Verificar que es una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'error' => true,
        'message' => 'La petición debe ser POST'
    ]);
    exit;
}

// Definir constantes
define('DATA_PATH', '../../data/');
define('STATIONS_FILE', DATA_PATH . 'stations.json');
define('BACKUP_DIR', DATA_PATH . 'backups/');

// Leer el cuerpo de la petición
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

// Verificar si es un JSON válido
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        'error' => true,
        'message' => 'Error al decodificar el JSON enviado: ' . json_last_error_msg()
    ]);
    exit;
}

// Verificar que la estructura del JSON es correcta
if (!isset($input['reproductor'])) {
    echo json_encode([
        'error' => true,
        'message' => 'Formato de datos incorrecto'
    ]);
    exit;
}

// Comprobar que el archivo original existe
if (!file_exists(STATIONS_FILE)) {
    echo json_encode([
        'error' => true,
        'message' => 'El archivo de configuración original no existe'
    ]);
    exit;
}

// Crear directorio de backups si no existe
if (!is_dir(BACKUP_DIR)) {
    if (!mkdir(BACKUP_DIR, 0755, true)) {
        echo json_encode([
            'error' => true,
            'message' => 'No se pudo crear el directorio de backups'
        ]);
        exit;
    }
}

// Hacer backup del archivo original
$backupFilename = BACKUP_DIR . 'stations_' . date('Y-m-d_H-i-s') . '.json';
if (!copy(STATIONS_FILE, $backupFilename)) {
    echo json_encode([
        'error' => true,
        'message' => 'Error al hacer backup de la configuración existente'
    ]);
    exit;
}

// Leer el archivo original para no perder datos
$originalContent = file_get_contents(STATIONS_FILE);
$originalConfig = json_decode($originalContent, true);

// Verificar el original
if (json_last_error() !== JSON_ERROR_NONE || !isset($originalConfig['reproductor'])) {
    echo json_encode([
        'error' => true,
        'message' => 'Error al leer la configuración original'
    ]);
    exit;
}

// Preservar las ciudades del archivo original si no están en la actualización
if (!isset($input['reproductor']['ciudades']) && isset($originalConfig['reproductor']['ciudades'])) {
    $input['reproductor']['ciudades'] = $originalConfig['reproductor']['ciudades'];
}

// Actualizar los cambios
$updatedConfig = $input;

// Convertir a JSON con formato legible
$jsonConfig = json_encode($updatedConfig, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

// Guardar en el archivo
if (file_put_contents(STATIONS_FILE, $jsonConfig) === false) {
    echo json_encode([
        'error' => true,
        'message' => 'Error al guardar la configuración'
    ]);
    exit;
}

// Respuesta exitosa
echo json_encode([
    'error' => false,
    'message' => 'Configuración guardada correctamente'
]);
