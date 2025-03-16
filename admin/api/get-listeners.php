<?php
/**
 * API para obtener datos de oyentes en tiempo real
 * 
 * Este script obtiene información del servidor Icecast sobre las estaciones y sus oyentes,
 * la compara con la configuración y devuelve los datos estructurados.
 */

// Establecer zona horaria a Colombia (UTC-5)
date_default_timezone_set('America/Bogota');

// Permitir CORS para peticiones AJAX
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json; charset=UTF-8");

// Definir constantes
define('DATA_PATH', '../../data/');
define('STATIONS_FILE', DATA_PATH . 'stations.json');
define('CACHE_FILE', DATA_PATH . 'listeners_cache.json');
define('CACHE_LIFETIME', 1800); // 30 minutos en segundos

// Función para escribir en el log
function api_log($message) {
    $dir = __DIR__ . '/../logs';
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    $logFile = $dir . '/api_listeners.log';
    $date = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$date] $message\n", FILE_APPEND);
}

/**
 * Lee el archivo de estaciones JSON
 * @return array Datos de las estaciones
 */
function getStationsData() {
    if (!file_exists(STATIONS_FILE)) {
        return ['error' => true, 'message' => 'El archivo de estaciones no existe'];
    }
    
    $data = file_get_contents(STATIONS_FILE);
    $stations = json_decode($data, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        return ['error' => true, 'message' => 'Error al decodificar el archivo JSON: ' . json_last_error_msg()];
    }
    
    return $stations;
}

/**
 * Guarda una copia en caché de los datos de oyentes
 * @param array $data Los datos a guardar en caché
 * @return bool Éxito de la operación
 */
function saveListenersCache($data) {
    if (!is_dir(dirname(CACHE_FILE))) {
        mkdir(dirname(CACHE_FILE), 0755, true);
    }
    
    $cache = [
        'timestamp' => time(),
        'data' => $data
    ];
    
    return file_put_contents(CACHE_FILE, json_encode($cache, JSON_PRETTY_PRINT)) !== false;
}

/**
 * Obtiene datos de oyentes desde caché si están disponibles y vigentes
 * @return array|null Datos de caché o null si no están disponibles
 */
function getListenersCache() {
    if (!file_exists(CACHE_FILE)) {
        return null;
    }
    
    $cache = json_decode(file_get_contents(CACHE_FILE), true);
    if (!is_array($cache) || !isset($cache['timestamp']) || !isset($cache['data'])) {
        return null;
    }
    
    // Verificar si la caché es válida (no ha expirado)
    if (time() - $cache['timestamp'] > CACHE_LIFETIME) {
        return null;
    }
    
    return $cache['data'];
}

/**
 * Obtiene información detallada de un servidor Icecast
 * @param string $baseUrl URL base del servidor Icecast (ej: https://radio.policia.gov.co:8080)
 * @param string $statusPath Ruta al archivo de estado (normalmente status-json.xsl)
 * @param int $timeout Tiempo de espera en segundos
 * @return array|false Datos del servidor o array con error
 */
function getIcecastServerInfo($baseUrl, $statusPath = 'status-json.xsl', $timeout = 15) {
    // Normalizar URLs
    $baseUrl = rtrim($baseUrl, '/');
    $statusPath = ltrim($statusPath, '/');
    $fullUrl = "{$baseUrl}/{$statusPath}";
    
    api_log("Intentando conectar a: " . $fullUrl . " con timeout de " . $timeout . "s");
    
    // Configurar la solicitud curl
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $fullUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => $timeout,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => 0,
        CURLOPT_USERAGENT => 'MapPlayerJS/1.0',
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $error = curl_error($ch);
    $errno = curl_errno($ch);
    
    curl_close($ch);
    
    // Verificar errores
    if ($errno || $httpCode !== 200) {
        api_log("Error al conectar con Icecast: $error (código: $errno, HTTP: $httpCode)");
        return [
            'error' => true,
            'message' => $error ?: "Error HTTP: {$httpCode}",
            'code' => $errno ?: $httpCode
        ];
    }
    
    // Intentar decodificar como JSON
    $data = json_decode($response, true);
        
    if (json_last_error() !== JSON_ERROR_NONE) {
        api_log("Error al decodificar respuesta JSON: " . json_last_error_msg());
        return [
            'error' => true,
            'message' => 'Error al decodificar JSON: ' . json_last_error_msg(),
            'response' => substr($response, 0, 255) . (strlen($response) > 255 ? '...' : '')
        ];
    }
    
    api_log("Conexión exitosa a Icecast, datos obtenidos correctamente");
    return $data;
}

/**
 * Obtiene el estado de todas las estaciones
 * @return array Estado de todas las estaciones
 */
function getAllStationsStatus() {
    $stations = getStationsData();
    if (isset($stations['error'])) {
        api_log("Error al obtener datos de estaciones: " . $stations['message']);
        return $stations;
    }
    
    $results = [];
    $baseUrl = $stations['reproductor']['hostUrl'] ?? '';
    $statusPath = $stations['reproductor']['statusUrl'] ?? 'status-json.xsl';
    
    if (empty($baseUrl)) {
        api_log("URL base del servidor no configurada");
        return ['error' => true, 'message' => 'URL base del servidor no configurada'];
    }
    
    // Intentar obtener datos del servidor
    api_log("Obteniendo información del servidor Icecast: " . $baseUrl);
    $serverInfo = getIcecastServerInfo($baseUrl, $statusPath);
    
    // Si hay error, intentar usar caché
    if (isset($serverInfo['error']) && $serverInfo['error']) {
        api_log("Error al obtener datos del servidor, intentando usar caché");
        $cachedData = getListenersCache();
        
        if ($cachedData) {
            api_log("Usando datos de caché (de hace " . round((time() - $cachedData['cache_timestamp'])/60) . " minutos)");
            
            // Marcar que estamos usando caché
            $cachedData['using_cache'] = true;
            $cachedData['cache_error'] = $serverInfo['message'] ?? 'Error de conexión con el servidor';
            
            return $cachedData;
        }
        
        // No hay caché disponible
        api_log("No hay caché disponible, devolviendo error");
        return [
            'error' => true,
            'message' => $serverInfo['message'] ?? 'Error al conectar con el servidor',
            'stations' => []
        ];
    }
    
    // Para depuración - guardar la respuesta completa del servidor
    file_put_contents(DATA_PATH . 'debug_icecast_response.json', json_encode($serverInfo, JSON_PRETTY_PRINT));
    
    // Contar el número total de sources en el servidor Icecast
    $totalSources = 0;
    $sources = [];
    if (isset($serverInfo['icestats']['source'])) {
        if (isset($serverInfo['icestats']['source']['listenurl'])) {
            $sources = [$serverInfo['icestats']['source']];
            $totalSources = 1;
        } else {
            $sources = $serverInfo['icestats']['source'];
            $totalSources = count($sources);
        }
    }
    
    // Procesar cada estación
    foreach ($stations['reproductor']['ciudades'] as $station) {
        $serverUrl = $station['serverUrl'] ?? '';
        if (!empty($serverUrl)) {
            // Buscar en la información del servidor ya obtenida
            $mountPoint = '/' . ltrim($serverUrl, '/');
            
            // Construir URL de escucha correcta usando hostUrl de la configuración
            $correctListenUrl = rtrim($baseUrl, '/') . '/' . ltrim($serverUrl, '/');
            
            $stationInfo = [
                'online' => false, 
                'name' => $station['name'] ?? '', 
                'serverUrl' => $serverUrl,
                'frecuencia' => $station['frecuencia'] ?? '',
                'listenurl' => $correctListenUrl  // URL de escucha correcta construida manualmente
            ];
            
            if (isset($serverInfo['icestats']['source'])) {
                foreach ($sources as $source) {
                    // Normalizar valores para comparación
                    $sourceMount = isset($source['mount']) ? strtolower(trim($source['mount'])) : '';
                    $sourceServerUrl = isset($source['server_url']) ? strtolower(trim($source['server_url'])) : '';
                    $normalizedMountPoint = strtolower(trim($mountPoint));
                    $normalizedServerUrl = strtolower(trim($serverUrl));
                    
                    // Comparación robusta
                    if (
                        $sourceMount === $normalizedMountPoint || 
                        $sourceServerUrl === $normalizedServerUrl || 
                        (isset($source['listenurl']) && strpos(strtolower($source['listenurl']), $normalizedServerUrl) !== false)
                    ) {
                        $stationInfo = [
                            'online' => true,
                            'name' => $station['name'] ?? '',
                            'serverUrl' => $serverUrl,
                            'frecuencia' => $station['frecuencia'] ?? '',
                            'listeners' => $source['listeners'] ?? 0,
                            'description' => $source['server_description'] ?? '',
                            'title' => $source['title'] ?? '',
                            'bitrate' => $source['bitrate'] ?? '',
                            'genre' => $source['genre'] ?? '',
                            'listenurl' => $correctListenUrl,  // Usamos nuestra URL construida correctamente
                        ];
                        
                        // Agregar ice-bitrate si existe
                        if (isset($source['ice-bitrate'])) {
                            $stationInfo['ice-bitrate'] = $source['ice-bitrate'];
                        }
                        
                        // Agregar audio_info si existe
                        if (isset($source['audio_info'])) {
                            $stationInfo['audio_info'] = $source['audio_info'];
                        }
                        
                        // Agregar cualquier campo relevante con "bit" en su nombre
                        foreach ($source as $key => $value) {
                            if (strpos(strtolower($key), 'bit') !== false && !isset($stationInfo[$key])) {
                                $stationInfo[$key] = $value;
                            }
                        }
                        
                        break;
                    }
                }
            }
            
            $results[] = $stationInfo;
        }
    }
    
    // Contar estaciones online y offline
    $onlineStations = count(array_filter($results, function($station) { 
        return $station['online'] ?? false; 
    }));
    
    $offlineStations = count($results) - $onlineStations;
    
    // Calcular porcentaje de disponibilidad
    $availabilityPercentage = count($results) > 0 
        ? round(($onlineStations / count($results)) * 100) 
        : 0;
    
    // Calcular total de oyentes
    $totalListeners = 0;
    foreach ($results as $station) {
        if ($station['online'] ?? false) {
            $totalListeners += $station['listeners'] ?? 0;
        }
    }
    
    // Ordenar estaciones por oyentes para obtener top
    $topStations = $results;
    usort($topStations, function($a, $b) {
        return ($b['listeners'] ?? 0) - ($a['listeners'] ?? 0);
    });
    $topStations = array_slice($topStations, 0, 5); // Solo las 5 mejores

    // Construir respuesta final
    $response = [
        'error' => false,
        'hostUrl' => $baseUrl, // Añadir hostUrl a la respuesta para uso en la interfaz
        'stats' => [
            'total' => count($results),
            'online' => $onlineStations,
            'offline' => $offlineStations,
            'totalSources' => $totalSources,
            'totalListeners' => $totalListeners,
            'availabilityPercentage' => $availabilityPercentage,
            'time' => date('H:i:s'),  // Hora de Colombia
            'lastUpdate' => date('Y-m-d H:i:s')  // Fecha/hora de Colombia
        ],
        'server' => [
            'version' => $serverInfo['icestats']['server_id'] ?? 'Desconocido',
            'host' => $serverInfo['icestats']['host'] ?? $baseUrl,
            'admin' => $serverInfo['icestats']['admin'] ?? 'No disponible',
            'location' => $serverInfo['icestats']['location'] ?? 'No disponible'
        ],
        'stations' => $results,
        'top' => $topStations,
        'cache_timestamp' => time() // Marca de tiempo para la caché
    ];
    
    // Guardar en caché para uso futuro
    saveListenersCache($response);
    
    return $response;
}

// Ejecutar y devolver resultados
$stationsStatus = getAllStationsStatus();
echo json_encode($stationsStatus);