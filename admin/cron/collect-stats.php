<?php
/**
 * Script para recolectar estadísticas de oyentes
 * Este script está diseñado para ser ejecutado periódicamente por cron
 */

// Establecer zona horaria a Colombia
date_default_timezone_set('America/Bogota');

// Ruta a los archivos de datos
define('DATA_PATH', __DIR__ . '/../../data/');
define('CONFIG_FILE', DATA_PATH . 'stats-config.json');
define('HISTORY_FILE', DATA_PATH . 'history.json');

// Función para escribir en el log
function log_message($message) {
    $date = date('Y-m-d H:i:s');
    $logFile = __DIR__ . '/stats-collector.log';
    file_put_contents($logFile, "[$date] $message\n", FILE_APPEND);
}

// Verificar que exista el directorio de datos
if (!is_dir(DATA_PATH)) {
    if (!mkdir(DATA_PATH, 0755, true)) {
        log_message("ERROR: No se pudo crear el directorio de datos: " . DATA_PATH);
        echo "ERROR: No se pudo crear el directorio de datos\n";
        exit(1);
    }
}

// Verificar que la configuración existe o crear una predeterminada
if (!file_exists(CONFIG_FILE)) {
    $defaultConfig = [
        'enableStatsCollection' => true,
        'dataRetention' => 90,
        'collectIntervalMinutes' => 15
    ];
    
    file_put_contents(CONFIG_FILE, json_encode($defaultConfig, JSON_PRETTY_PRINT));
    log_message("Archivo de configuración creado con valores predeterminados");
}

// Leer configuración
$configContent = file_get_contents(CONFIG_FILE);
$config = json_decode($configContent, true);

// Verificar que la configuración es válida
if (json_last_error() !== JSON_ERROR_NONE) {
    log_message("ERROR: El archivo de configuración no es un JSON válido: " . json_last_error_msg());
    echo "ERROR: Configuración inválida\n";
    exit(1);
}

// Verificar que la recolección está habilitada
if (!isset($config['enableStatsCollection']) || !$config['enableStatsCollection']) {
    log_message("Recolección de estadísticas deshabilitada en configuración");
    echo "Recolección de estadísticas deshabilitada\n";
    exit(0);
}

// Obtener datos actuales de oyentes
$listenersData = get_listeners_data();

if (isset($listenersData['error']) && $listenersData['error']) {
    log_message("Error al obtener datos de oyentes: " . $listenersData['message']);
    echo "Error al obtener datos de oyentes: " . $listenersData['message'] . "\n";
    exit(1);
}

// Preparar datos para guardar
$timestamp = time();
$formattedDate = date('Y-m-d H:i:s');

$entry = [
    'timestamp' => $timestamp,
    'formatted_date' => $formattedDate,
    'count' => $listenersData['stats']['totalListeners'] ?? 0,
    'stations' => []
];

// Incluir datos por estación
if (isset($listenersData['stations']) && is_array($listenersData['stations'])) {
    foreach ($listenersData['stations'] as $station) {
        if ($station['online'] ?? false) {
            $entry['stations'][] = [
                'name' => $station['name'] ?? 'Desconocido',
                'url' => $station['serverUrl'] ?? '',
                'listeners' => $station['listeners'] ?? 0
            ];
        }
    }
}

// Leer historial existente
$history = [];
if (file_exists(HISTORY_FILE)) {
    $history = json_decode(file_get_contents(HISTORY_FILE), true);
    if (!is_array($history)) {
        $history = [];
    }
}

// Inicializar estructura si no existe
if (!isset($history['listeners'])) {
    $history['listeners'] = [];
}
if (!isset($history['stations'])) {
    $history['stations'] = [];
}

// Agregar nueva entrada al historial
$history['listeners'][] = $entry;
$history['updated'] = $formattedDate;

// Limitar según la retención configurada
$retentionDays = $config['dataRetention'] ?? 90;
$cutoffTimestamp = time() - ($retentionDays * 86400);

// Filtrar entradas antiguas
$history['listeners'] = array_filter($history['listeners'], function($item) use ($cutoffTimestamp) {
    return $item['timestamp'] >= $cutoffTimestamp;
});

// Agregar los datos por estación también (resumidos)
foreach ($entry['stations'] as $stationData) {
    if (!isset($history['stations'][$stationData['url']])) {
        $history['stations'][$stationData['url']] = [
            'name' => $stationData['name'],
            'data' => []
        ];
    }
    
    $history['stations'][$stationData['url']]['data'][] = [
        'timestamp' => $timestamp,
        'formatted_date' => $formattedDate,
        'listeners' => $stationData['listeners']
    ];
    
    // También aplicar retención a cada estación
    $history['stations'][$stationData['url']]['data'] = array_filter(
        $history['stations'][$stationData['url']]['data'], 
        function($item) use ($cutoffTimestamp) {
            return $item['timestamp'] >= $cutoffTimestamp;
        }
    );
}

// Guardar historial actualizado
if (file_put_contents(HISTORY_FILE, json_encode($history, JSON_PRETTY_PRINT))) {
    log_message("Datos guardados correctamente. Oyentes totales: " . $entry['count']);
    echo "Datos guardados correctamente\n";
} else {
    log_message("Error al guardar datos en el archivo de historial");
    echo "Error al guardar datos\n";
    exit(1);
}

/**
 * Obtiene datos actuales de oyentes
 */
function get_listeners_data() {
    $apiUrl = __DIR__ . '/../api/get-listeners.php';
    $baseUrl = '';
    $selfHost = '';
    
    // Detectar si se ejecuta en CLI o vía web
    $isCli = php_sapi_name() === 'cli';
    
    // Si el script se ejecuta desde CLI, necesitamos usar curl en lugar de include
    if ($isCli) {
        // Intentar detectar la URL base - esto puede requerir ajuste según tu servidor
        if (!empty($_SERVER['SERVER_NAME']) && !empty($_SERVER['REQUEST_SCHEME'])) {
            $baseUrl = $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['SERVER_NAME'];
            $selfHost = true;
        } else {
            // Si no podemos detectar, usamos localhost como fallback
            $baseUrl = 'http://localhost';
            $selfHost = false;
        }
        
        $fullUrl = $baseUrl . '/map-player-icecast2/admin/api/get-listeners.php';
        
        // Log el URL que estamos intentando
        log_message("Intentando acceder mediante cURL a: " . $fullUrl);
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $fullUrl,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_USERAGENT => 'StatsCollector/1.0',
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);
        
        if ($httpCode !== 200) {
            // Si localhost falló y no estamos en el host correcto, intentar IP alternativa
            if (!$selfHost && $httpCode === 0) {
                // Intentar con la IP interna común - puede requerir ajustes
                $fullUrl = 'http://127.0.0.1/map-player-icecast2/admin/api/get-listeners.php';
                log_message("Reintentando con IP alternativa: " . $fullUrl);
                
                $ch = curl_init();
                curl_setopt_array($ch, [
                    CURLOPT_URL => $fullUrl,
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_CONNECTTIMEOUT => 5,
                    CURLOPT_TIMEOUT => 10,
                    CURLOPT_FOLLOWLOCATION => true,
                    CURLOPT_SSL_VERIFYPEER => false,
                    CURLOPT_SSL_VERIFYHOST => 0,
                    CURLOPT_USERAGENT => 'StatsCollector/1.0',
                ]);
                
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $error = curl_error($ch);
                
                curl_close($ch);
            }
            
            if ($httpCode !== 200) {
                // Si aún falla, intentamos include directo como último recurso
                log_message("cURL falló, intentando include directo");
                
                if (file_exists($apiUrl)) {
                    ob_start();
                    include($apiUrl);
                    $response = ob_get_clean();
                } else {
                    return [
                        'error' => true, 
                        'message' => "No se pudo acceder a la API: HTTP $httpCode - $error. API no encontrada localmente."
                    ];
                }
            }
        }
        
        $data = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return [
                'error' => true, 
                'message' => 'Error al decodificar JSON: ' . json_last_error_msg()
            ];
        }
        
        return $data;
    }
    
    // Si se ejecuta vía web, podemos incluir directamente
    if (file_exists($apiUrl)) {
        ob_start();
        include($apiUrl);
        $output = ob_get_clean();
        
        $data = json_decode($output, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return [
                'error' => true, 
                'message' => 'Error al decodificar JSON: ' . json_last_error_msg()
            ];
        }
        
        return $data;
    } else {
        return [
            'error' => true, 
            'message' => "API no encontrada en: $apiUrl"
        ];
    }
}
