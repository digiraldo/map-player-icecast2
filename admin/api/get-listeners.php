<?php
/**
 * API para obtener datos de oyentes en tiempo real
 * 
 * Este script obtiene información del servidor Icecast sobre las estaciones y sus oyentes,
 * la compara con la configuración y devuelve los datos estructurados.
 */

// Permitir CORS para peticiones AJAX
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json; charset=UTF-8");

// Definir constantes
define('DATA_PATH', '../../data/');
define('STATIONS_FILE', DATA_PATH . 'stations.json');

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
 * Obtiene información detallada de un servidor Icecast
 * @param string $baseUrl URL base del servidor Icecast (ej: https://radio.policia.gov.co:8080)
 * @param string $statusPath Ruta al archivo de estado (normalmente status-json.xsl)
 * @param int $timeout Tiempo de espera en segundos
 * @return array|false Datos del servidor o array con error
 */
function getIcecastServerInfo($baseUrl, $statusPath = 'status-json.xsl', $timeout = 5) {
    // Normalizar URLs
    $baseUrl = rtrim($baseUrl, '/');
    $statusPath = ltrim($statusPath, '/');
    $fullUrl = "{$baseUrl}/{$statusPath}";
    
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
        return [
            'error' => true,
            'message' => $error ?: "Error HTTP: {$httpCode}",
            'code' => $errno ?: $httpCode
        ];
    }
    
    // Intentar decodificar como JSON
    $data = json_decode($response, true);
        
    if (json_last_error() !== JSON_ERROR_NONE) {
        return [
            'error' => true,
            'message' => 'Error al decodificar JSON: ' . json_last_error_msg(),
            'response' => substr($response, 0, 255) . (strlen($response) > 255 ? '...' : '')
        ];
    }
    
    return $data;
}

/**
 * Obtiene el estado de todas las estaciones
 * @return array Estado de todas las estaciones
 */
function getAllStationsStatus() {
    $stations = getStationsData();
    if (isset($stations['error'])) {
        return $stations;
    }
    
    $results = [];
    $baseUrl = $stations['reproductor']['hostUrl'] ?? '';
    $statusPath = $stations['reproductor']['statusUrl'] ?? 'status-json.xsl';
    
    if (empty($baseUrl)) {
        return ['error' => true, 'message' => 'URL base del servidor no configurada'];
    }
    
    // Obtener información de servidor una sola vez
    $serverInfo = getIcecastServerInfo($baseUrl, $statusPath);
    
    if (isset($serverInfo['error']) && $serverInfo['error']) {
        return [
            'error' => true,
            'message' => $serverInfo['message'] ?? 'Error al conectar con el servidor',
            'stations' => []
        ];
    }
    
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
    return [
        'error' => false,
        'hostUrl' => $baseUrl, // Añadir hostUrl a la respuesta para uso en la interfaz
        'stats' => [
            'total' => count($results),
            'online' => $onlineStations,
            'offline' => $offlineStations,
            'totalSources' => $totalSources,
            'totalListeners' => $totalListeners,
            'availabilityPercentage' => $availabilityPercentage,
            'time' => date('H:i:s'),
            'lastUpdate' => date('Y-m-d H:i:s')
        ],
        'server' => [
            'version' => $serverInfo['icestats']['server_id'] ?? 'Desconocido',
            'host' => $serverInfo['icestats']['host'] ?? $baseUrl,
            'admin' => $serverInfo['icestats']['admin'] ?? 'No disponible',
            'location' => $serverInfo['icestats']['location'] ?? 'No disponible'
        ],
        'stations' => $results,
        'top' => $topStations
    ];
}

// Ejecutar y devolver resultados
$stationsStatus = getAllStationsStatus();
echo json_encode($stationsStatus);