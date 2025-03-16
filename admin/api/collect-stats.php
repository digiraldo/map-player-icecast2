<?php
/**
 * Endpoint API para recolección de estadísticas
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

// Verificar la clave API
$apiKey = $_GET['key'] ?? '';
$validKey = 'f8b4j9v2m3n7k8l1';

if ($apiKey !== $validKey) {
    echo json_encode(['error' => true, 'message' => 'Clave de API inválida']);
    exit;
}

// Configurar variables para el script de recolección
$scriptPath = __DIR__ . '/../cron/collect-stats.php';
$response = [];

// Función para obtener datos de oyentes
function get_listeners_data_for_api() {
    $apiUrl = __DIR__ . '/get-listeners.php';
    
    if (!file_exists($apiUrl)) {
        return ['error' => true, 'message' => 'API de oyentes no encontrada en: ' . $apiUrl];
    }
    
    try {
        // Establecer un límite de tiempo de ejecución más alto para este script
        set_time_limit(60);
        
        ob_start();
        include($apiUrl);
        $output = ob_get_clean();
        
        $data = json_decode($output, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            return ['error' => true, 'message' => 'Error al decodificar JSON: ' . json_last_error_msg()];
        }
        
        // Verificar si los datos provienen de caché
        if (isset($data['using_cache']) && $data['using_cache']) {
            debug_log("AVISO: Usando datos de caché. Motivo: " . ($data['cache_error'] ?? 'Desconocido'));
        }
        
        return $data;
    } catch (Exception $e) {
        return ['error' => true, 'message' => 'Excepción al obtener datos: ' . $e->getMessage()];
    }
}

// Función para log de depuración
function debug_log($message) {
    $logFile = __DIR__ . '/../logs/api_debug.log';
    $dir = dirname($logFile);
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    $date = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$date] $message\n", FILE_APPEND);
}

try {
    debug_log("Iniciando recolección de estadísticas");
    
    // Verificar que el script existe
    if (!file_exists($scriptPath)) {
        throw new Exception("El archivo de script no existe en: $scriptPath");
    }
    
    // Establecer un límite de tiempo de ejecución más alto para este script
    set_time_limit(60);
    
    // Obtener los datos de oyentes antes de ejecutar
    debug_log("Obteniendo datos de oyentes iniciales");
    $listenersData = get_listeners_data_for_api();
    
    if (isset($listenersData['error']) && $listenersData['error']) {
        throw new Exception("Error al obtener datos de oyentes: " . $listenersData['message']);
    }
    
    debug_log("Preparando para ejecutar el script de recolección");
    
    // En lugar de incluir el script, usaremos exec para ejecutarlo como un proceso separado
    // Esto evita problemas de contexto, variables y funciones duplicadas
    $command = "php " . escapeshellarg($scriptPath) . " 2>&1";
    debug_log("Ejecutando comando: $command");
    
    $output = [];
    $returnCode = 0;
    exec($command, $output, $returnCode);
    
    $outputText = implode("\n", $output);
    debug_log("Script ejecutado. Código de retorno: $returnCode. Salida: " . substr($outputText, 0, 200));
    
    // Verificar si se ejecutó correctamente
    if ($returnCode === 0 && stripos($outputText, 'datos guardados correctamente') !== false) {
        // Obtener datos actualizados
        $listenersDataAfter = get_listeners_data_for_api();
        
        $response = [
            'error' => false,
            'message' => 'Estadísticas recolectadas correctamente',
            'date' => date('Y-m-d H:i:s'),
            'stations_processed' => isset($listenersDataAfter['stations']) ? count($listenersDataAfter['stations']) : 0,
            'listeners_count' => $listenersDataAfter['stats']['totalListeners'] ?? 0
        ];
        debug_log("Recolección completada con éxito");
    } else {
        throw new Exception("Error en la ejecución del script (código $returnCode): " . $outputText);
    }
    
} catch (Exception $e) {
    debug_log("ERROR: " . $e->getMessage());
    $response = [
        'error' => true,
        'message' => $e->getMessage()
    ];
}

// Devolver respuesta JSON
echo json_encode($response);