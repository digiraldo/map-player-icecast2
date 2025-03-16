<?php
/**
 * API para limpiar datos de estadísticas
 */

// Capturar errores de PHP para evitar que se muestren como HTML
ini_set('display_errors', 0);
error_reporting(E_ALL);

// Configurar manejo de errores personalizado
set_error_handler(function($errno, $errstr, $errfile, $errline) {
    $logFile = __DIR__ . '/../logs/api_errors.log';
    $dir = dirname($logFile);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    
    $date = date('Y-m-d H:i:s');
    $message = "[$date] Error $errno: $errstr in $errfile on line $errline\n";
    file_put_contents($logFile, $message, FILE_APPEND);
    
    return true; // Prevenir manejo estándar de errores
});

// Establecer zona horaria a Colombia
date_default_timezone_set('America/Bogota');

// Configurar salida como JSON y evitar cualquier salida HTML
header('Content-Type: application/json');

// Función para log de depuración
function debug_log($message) {
    $logFile = __DIR__ . '/../logs/api_debug.log';
    $dir = dirname($logFile);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    $date = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$date] CLEAR-STATS: $message\n", FILE_APPEND);
}

debug_log("Iniciando limpieza de estadísticas");

// Verificar la clave API
$apiKey = $_GET['key'] ?? '';
$validKey = 'f8b4j9v2m3n7k8l1';

if ($apiKey !== $validKey) {
    echo json_encode(['error' => true, 'message' => 'Clave de API inválida']);
    exit;
}

// Ruta al archivo de historial
define('DATA_PATH', __DIR__ . '/../../data/');
define('HISTORY_FILE', DATA_PATH . 'history.json');

try {
    // Verificar que el directorio existe
    if (!is_dir(DATA_PATH)) {
        if (!mkdir(DATA_PATH, 0755, true)) {
            throw new Exception("No se pudo crear el directorio de datos");
        }
        debug_log("Directorio de datos creado");
    }
    
    // Verificar que el archivo existe
    if (!file_exists(HISTORY_FILE)) {
        debug_log("No hay archivo de historial para borrar");
        echo json_encode(['error' => false, 'message' => 'No hay datos que borrar']);
        exit;
    }
    
    // Crear estructura vacía para el archivo
    $emptyData = [
        'listeners' => [],
        'stations' => [],
        'updated' => date('Y-m-d H:i:s'),
        'cleared' => date('Y-m-d H:i:s')
    ];
    
    // Guardar archivo vacío
    if (file_put_contents(HISTORY_FILE, json_encode($emptyData, JSON_PRETTY_PRINT))) {
        debug_log("Datos borrados correctamente");
        echo json_encode([
            'error' => false, 
            'message' => 'Datos borrados correctamente',
            'date' => date('Y-m-d H:i:s')
        ]);
    } else {
        throw new Exception("Error al escribir en el archivo de historial");
    }
    
} catch (Exception $e) {
    debug_log("ERROR: " . $e->getMessage());
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage()
    ]);
}
