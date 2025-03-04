<?php
/**
 * API para obtener estadísticas del servidor Icecast
 * 
 * Este script recopila estadísticas históricas y actuales del servidor Icecast
 * para mostrarlas en la sección de estadísticas del panel de administración.
 */

// Establecer zona horaria a Colombia (UTC-5)
date_default_timezone_set('America/Bogota');

// Permitir CORS para peticiones AJAX
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json; charset=UTF-8");

// Definir constantes
define('DATA_PATH', '../../data/');
define('STATS_FILE', DATA_PATH . 'statistics.json');
define('HISTORY_FILE', DATA_PATH . 'history.json');

/**
 * Lee el archivo de configuración de estaciones
 * @return array Datos de configuración
 */
function getStationsConfig() {
    $configFile = DATA_PATH . 'stations.json';
    
    if (!file_exists($configFile)) {
        return ['error' => true, 'message' => 'El archivo de configuración no existe'];
    }
    
    $data = file_get_contents($configFile);
    $config = json_decode($data, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        return ['error' => true, 'message' => 'Error al decodificar el archivo JSON: ' . json_last_error_msg()];
    }
    
    return $config;
}

/**
 * Obtiene las estadísticas actuales desde API de oyentes
 * @return array Datos de estadísticas actuales
 */
function getCurrentStats() {
    $listenersApiUrl = "./get-listeners.php"; // URL relativa a la API de oyentes
    
    // Usar cURL para hacer la petición
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $listenersApiUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_USERAGENT => 'MapPlayerJS/1.0',
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    $errno = curl_errno($ch);
    
    curl_close($ch);
    
    // Verificar errores
    if ($errno || $httpCode !== 200) {
        return [
            'error' => true,
            'message' => $error ?: "Error HTTP: {$httpCode}",
            'code' => $errno ?: $httpCode
        ];
    }
    
    // Decodificar respuesta JSON
    $data = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        return [
            'error' => true,
            'message' => 'Error al decodificar JSON de la API de oyentes: ' . json_last_error_msg(),
            'response' => substr($response, 0, 255) . (strlen($response) > 255 ? '...' : '')
        ];
    }
    
    return $data;
}

/**
 * Lee el archivo de estadísticas históricas
 * @return array Datos históricos
 */
function getHistoricalData() {
    if (!file_exists(HISTORY_FILE)) {
        // Si no existe, crear un archivo con estructura básica
        $emptyHistory = [
            'listeners' => [],
            'stations' => [],
            'created' => date('Y-m-d H:i:s'),
            'updated' => date('Y-m-d H:i:s')
        ];
        
        file_put_contents(HISTORY_FILE, json_encode($emptyHistory, JSON_PRETTY_PRINT));
        return $emptyHistory;
    }
    
    $data = file_get_contents(HISTORY_FILE);
    $history = json_decode($data, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        return [
            'error' => true,
            'message' => 'Error al decodificar el archivo de historia: ' . json_last_error_msg()
        ];
    }
    
    return $history;
}

/**
 * Calcula estadísticas generales
 * @param array $currentStats Estadísticas actuales
 * @param array $history Datos históricos
 * @return array Estadísticas calculadas
 */
function calculateStatistics($currentStats, $history) {
    $stats = [
        'current' => [
            'timestamp' => date('Y-m-d H:i:s'),  // Ahora usa zona horaria Colombia
            'listeners' => 0,
            'stations' => [
                'total' => 0,
                'online' => 0,
                'offline' => 0
            ]
        ],
        'historical' => [
            'listeners' => [
                'average' => 0,
                'max' => 0,
                'min' => 0
            ],
            'stations' => [
                'availability' => 0
            ]
        ],
        'trends' => [
            'listeners' => [
                'hourly' => [],
                'daily' => []
            ],
            'stations' => [
                'top' => []
            ]
        ]
    ];
    
    // Datos actuales
    if (!isset($currentStats['error']) || !$currentStats['error']) {
        $stats['current']['listeners'] = $currentStats['stats']['totalListeners'] ?? 0;
        $stats['current']['stations']['total'] = $currentStats['stats']['total'] ?? 0;
        $stats['current']['stations']['online'] = $currentStats['stats']['online'] ?? 0;
        $stats['current']['stations']['offline'] = $currentStats['stats']['offline'] ?? 0;
        
        // Top estaciones
        $stats['trends']['stations']['top'] = array_map(function($station) {
            return [
                'name' => $station['name'] ?? 'Desconocido',
                'frecuencia' => $station['frecuencia'] ?? 'N/A',
                'listeners' => $station['listeners'] ?? 0
            ];
        }, $currentStats['top'] ?? []);
    }
    
    // Datos históricos
    if (!isset($history['error']) && isset($history['listeners']) && count($history['listeners']) > 0) {
        $listeners = array_column($history['listeners'], 'count');
        
        $stats['historical']['listeners']['average'] = count($listeners) > 0 
            ? round(array_sum($listeners) / count($listeners)) : 0;
        $stats['historical']['listeners']['max'] = count($listeners) > 0 
            ? max($listeners) : 0;
        $stats['historical']['listeners']['min'] = count($listeners) > 0 
            ? min($listeners) : 0;
        
        // Últimos datos para tendencias - Ahora usando fechas colombianas
        $lastEntries = array_slice($history['listeners'], -24);
        $stats['trends']['listeners']['hourly'] = array_map(function($entry) {
            return [
                'time' => date('H:i', strtotime($entry['timestamp'])),  // Formateado con zona horaria Colombia
                'count' => $entry['count']
            ];
        }, $lastEntries);
        
        // Agrupar por día - Ahora usando fechas colombianas
        $dailyData = [];
        foreach ($history['listeners'] as $entry) {
            $day = date('Y-m-d', strtotime($entry['timestamp']));
            if (!isset($dailyData[$day])) {
                $dailyData[$day] = [];
            }
            $dailyData[$day][] = $entry['count'];
        }
        
        foreach ($dailyData as $day => $counts) {
            $stats['trends']['listeners']['daily'][] = [
                'date' => $day,  // Fecha en formato Colombia
                'count' => round(array_sum($counts) / count($counts))
            ];
        }
        
        // Limitar a últimos 30 días
        $stats['trends']['listeners']['daily'] = array_slice(
            $stats['trends']['listeners']['daily'], 
            -30
        );
    }
    
    return $stats;
}

// Obtener datos y calcular estadísticas
$currentStats = getCurrentStats();
$history = getHistoricalData();
$stats = calculateStatistics($currentStats, $history);

// Devolver resultados
echo json_encode([
    'error' => false,
    'timezone' => 'America/Bogota',  // Añadimos la zona horaria a la respuesta
    'serverTime' => date('Y-m-d H:i:s'),  // Hora actual del servidor en Colombia
    'stats' => $stats
]);