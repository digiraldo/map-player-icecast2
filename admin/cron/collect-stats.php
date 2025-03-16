<?php
/**
 * Script para recolectar estadísticas de oyentes
 * Este script está diseñado para ser ejecutado periódicamente por cron
 */

// Establecer tiempo límite de ejecución más generoso
set_time_limit(60);

// Establecer zona horaria a Colombia
date_default_timezone_set('America/Bogota');

// Ruta a los archivos de datos
define('DATA_PATH', __DIR__ . '/../../data/');
define('CONFIG_FILE', DATA_PATH . 'stats-config.json');
define('HISTORY_FILE', DATA_PATH . 'history.json');

// Función para escribir en el log con más detalles
function log_message($message, $type = 'INFO') {
    $date = date('Y-m-d H:i:s');
    $logFile = __DIR__ . '/stats-collector.log';
    file_put_contents($logFile, "[$date] [$type] $message\n", FILE_APPEND);
}

// Verificar que exista el directorio de datos
if (!is_dir(DATA_PATH)) {
    if (!mkdir(DATA_PATH, 0755, true)) {
        log_message("ERROR: No se pudo crear el directorio de datos: " . DATA_PATH, "ERROR");
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
    log_message("Archivo de configuración creado con valores predeterminados", "INFO");
}

// Leer configuración
$configContent = file_get_contents(CONFIG_FILE);
$config = json_decode($configContent, true);

// Verificar que la configuración es válida
if (json_last_error() !== JSON_ERROR_NONE) {
    log_message("ERROR: El archivo de configuración no es un JSON válido: " . json_last_error_msg(), "ERROR");
    echo "ERROR: Configuración inválida\n";
    exit(1);
}

// Verificar que la recolección está habilitada
if (!isset($config['enableStatsCollection']) || !$config['enableStatsCollection']) {
    log_message("Recolección de estadísticas deshabilitada en configuración", "INFO");
    echo "Recolección de estadísticas deshabilitada\n";
    exit(0);
}

// Obtener datos actuales de oyentes
log_message("Iniciando recolección de estadísticas", "START");
$listenersData = get_listeners_data();

if (isset($listenersData['error']) && $listenersData['error']) {
    log_message("Error al obtener datos de oyentes: " . $listenersData['message'], "ERROR");
    echo "Error al obtener datos de oyentes: " . $listenersData['message'] . "\n";
    exit(1);
}

// Verificar integridad de los datos (nueva función)
function verify_data_integrity($data) {
    $issues = [];
    
    // Verificar que exista la información básica necesaria
    if (!isset($data['stats']) || !is_array($data['stats'])) {
        $issues[] = "Falta sección de estadísticas";
    } elseif (!isset($data['stats']['totalListeners'])) {
        $issues[] = "Falta conteo total de oyentes";
    }
    
    // Verificar que exista la información de estaciones
    if (!isset($data['stations']) || !is_array($data['stations'])) {
        $issues[] = "Falta sección de estaciones";
    } elseif (count($data['stations']) === 0) {
        $issues[] = "No hay estaciones para procesar";
    }
    
    // Verificar si hay datos de caché
    if (isset($data['using_cache']) && $data['using_cache']) {
        $issues[] = "Usando datos de caché: " . ($data['cache_error'] ?? "Sin razón especificada");
    }
    
    return $issues;
}

// Verificar integridad de datos
$dataIssues = verify_data_integrity($listenersData);
if (!empty($dataIssues)) {
    foreach ($dataIssues as $issue) {
        log_message("Advertencia de integridad de datos: $issue", "WARNING");
    }
}

// Registrar métricas relevantes
log_message(
    "Métricas obtenidas - Total estaciones: " . count($listenersData['stations']) . 
    ", Online: " . $listenersData['stats']['online'] . 
    ", Offline: " . $listenersData['stats']['offline'] . 
    ", Total oyentes: " . $listenersData['stats']['totalListeners'] . 
    ", Disponibilidad: " . $listenersData['stats']['availabilityPercentage'] . "%",
    "METRICS"
);

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
    log_message("Datos guardados correctamente. Oyentes totales: " . $entry['count'] . 
               ", Estaciones online: " . count($entry['stations']) . 
               ", Hora: " . $formattedDate, "SUCCESS");
    echo "Datos guardados correctamente\n";
} else {
    log_message("Error al guardar datos en el archivo de historial", "ERROR");
    echo "Error al guardar datos\n";
    exit(1);
}

// Agregar estadísticas sobre el tamaño y crecimiento del archivo
$filesize = filesize(HISTORY_FILE);
$filesizeMB = round($filesize / 1048576, 2); // Convertir a MB
log_message("Tamaño del archivo de historial: $filesizeMB MB", "INFO");

// Si el archivo supera cierto tamaño, registrar una advertencia
if ($filesizeMB > 50) {
    log_message("El archivo de historial está creciendo demasiado ($filesizeMB MB). " .
                "Considere reducir el período de retención de datos.", "WARNING");
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
        log_message("Intentando acceder mediante cURL a: " . $fullUrl, "INFO");
        
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $fullUrl,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 15,  // Aumentado a 15 segundos
            CURLOPT_TIMEOUT => 30,         // Aumentado a 30 segundos
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_USERAGENT => 'StatsCollector/1.0',
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);
        
        // Si falla, intentar con diferentes URLs locales
        if ($httpCode !== 200) {
            $alternativeUrls = [
                'http://127.0.0.1/map-player-icecast2/admin/api/get-listeners.php',
                'http://localhost/map-player-icecast2/admin/api/get-listeners.php',
                'http://[::1]/map-player-icecast2/admin/api/get-listeners.php'
            ];
            
            foreach ($alternativeUrls as $altUrl) {
                if ($httpCode === 200) break; // Si ya tuvimos éxito, salir del ciclo
                
                log_message("Reintentando con URL alternativa: " . $altUrl, "INFO");
                
                $ch = curl_init();
                curl_setopt_array($ch, [
                    CURLOPT_URL => $altUrl,
                    CURLOPT_RETURNTRANSFER => true,
                    CURLOPT_CONNECTTIMEOUT => 15,
                    CURLOPT_TIMEOUT => 30,
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
            
            // Si aún falla, intentar include directo como último recurso
            if ($httpCode !== 200) {
                log_message("Todas las conexiones cURL fallaron, intentando include directo", "ERROR");
                
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
        
        // Verificar si estamos usando datos de caché
        if (isset($data['using_cache']) && $data['using_cache']) {
            log_message("NOTA: Usando datos de caché debido a: " . ($data['cache_error'] ?? 'Razón desconocida'), "INFO");
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
