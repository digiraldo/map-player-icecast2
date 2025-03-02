<?php
/**
 * Funciones generales para el panel de administración
 */

/**
 * Lee el archivo de estaciones JSON
 * @return array Datos de las estaciones
 */
function getStationsData() {
    if (!file_exists(STATIONS_FILE)) {
        return ['error' => 'El archivo de estaciones no existe'];
    }
    
    $data = file_get_contents(STATIONS_FILE);
    $stations = json_decode($data, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        return ['error' => 'Error al decodificar el archivo JSON: ' . json_last_error_msg()];
    }
    
    return $stations;
}

/**
 * Guarda los datos de las estaciones en el archivo JSON
 * @param array $data Datos a guardar
 * @return bool|string True si se guardó correctamente, mensaje de error en caso contrario
 */
function saveStationsData($data) {
    // Crear backup antes de guardar
    createBackup(STATIONS_FILE);
    
    // Guardar los datos formateados para legibilidad
    $jsonData = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        return 'Error al codificar los datos JSON: ' . json_last_error_msg();
    }
    
    $result = file_put_contents(STATIONS_FILE, $jsonData);
    
    if ($result === false) {
        return 'Error al escribir en el archivo. Verifique los permisos.';
    }
    
    return true;
}

/**
 * Crea una copia de seguridad de un archivo
 * @param string $filepath Ruta del archivo a respaldar
 * @return string|bool Ruta del backup creado o false si falló
 */
function createBackup($filepath) {
    if (!file_exists($filepath)) {
        return false;
    }
    
    // Asegurar que el directorio de backups existe
    if (!file_exists(BACKUPS_PATH)) {
        mkdir(BACKUPS_PATH, 0755, true);
    }
    
    $filename = pathinfo($filepath, PATHINFO_BASENAME);
    $timestamp = date('Ymd_His');
    $backupPath = BACKUPS_PATH . "/{$filename}.{$timestamp}.bak";
    
    if (copy($filepath, $backupPath)) {
        return $backupPath;
    }
    
    return false;
}

/**
 * Obtiene la lista de copias de seguridad disponibles
 * @param string $type Tipo de backup (stations, config)
 * @return array Lista de archivos de backup
 */
function getBackupsList($type = 'stations') {
    $pattern = BACKUPS_PATH . '/' . ($type === 'stations' ? 'stations' : 'config') . '.json.*.bak';
    $files = glob($pattern);
    
    $backups = [];
    foreach ($files as $file) {
        $filename = basename($file);
        $timestamp = preg_replace('/^.*\.(\d{8}_\d{6})\.bak$/', '$1', $filename);
        $date = DateTime::createFromFormat('Ymd_His', $timestamp);
        
        if ($date) {
            $backups[] = [
                'file' => $filename,
                'path' => $file,
                'timestamp' => $timestamp,
                'date' => $date->format('d/m/Y H:i:s'),
                'size' => formatFileSize(filesize($file))
            ];
        }
    }
    
    // Ordenar por fecha (más reciente primero)
    usort($backups, function($a, $b) {
        return strcmp($b['timestamp'], $a['timestamp']);
    });
    
    return $backups;
}

/**
 * Formatea el tamaño de un archivo en una unidad legible
 * @param int $bytes Tamaño en bytes
 * @return string Tamaño formateado
 */
function formatFileSize($bytes) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    
    $bytes /= pow(1024, $pow);
    
    return round($bytes, 2) . ' ' . $units[$pow];
}

/**
 * Verifica el estado de una fuente Icecast
 * @param string $url URL completa del stream Icecast
 * @return array Estado de la fuente
 */
function checkIcecastSource($url, $timeout = 3) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, $timeout);
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_HEADER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    
    curl_close($ch);
    
    return [
        'online' => ($httpCode >= 200 && $httpCode < 300),
        'code' => $httpCode,
        'error' => $error
    ];
}

/**
 * Genera un mensaje de alerta HTML Bootstrap
 * @param string $message Mensaje a mostrar
 * @param string $type Tipo de alerta (success, danger, warning, info)
 * @param bool $dismissible Si la alerta puede cerrarse
 * @return string HTML de la alerta
 */
function alert($message, $type = 'info', $dismissible = true) {
    $icons = [
        'success' => 'check-circle',
        'danger' => 'exclamation-circle',
        'warning' => 'exclamation-triangle',
        'info' => 'info-circle'
    ];
    
    $icon = isset($icons[$type]) ? $icons[$type] : 'info-circle';
    $dismissibleClass = $dismissible ? 'alert-dismissible fade show' : '';
    $closeButton = $dismissible ? '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' : '';
    
    return "
    <div class=\"alert alert-{$type} {$dismissibleClass}\" role=\"alert\">
        <i class=\"fas fa-{$icon} me-2\"></i> {$message}
        {$closeButton}
    </div>";
}

/**
 * Obtiene información detallada de un servidor Icecast
 * @param string $baseUrl URL base del servidor Icecast (ej: https://radio.policia.gov.co:8080)
 * @param string $statusPath Ruta al archivo de estado (normalmente status-json.xsl)
 * @param int $timeout Tiempo de espera en segundos
 * @return array|false Datos del servidor o false si hay error
 */
function getIcecastServerInfo($baseUrl, $statusPath = 'status-json.xsl', $timeout = 5) {
    static $cache = []; // Caché para evitar consultas repetidas
    
    // Normalizar URLs
    $baseUrl = rtrim($baseUrl, '/');
    $statusPath = ltrim($statusPath, '/');
    $fullUrl = "{$baseUrl}/{$statusPath}";
    
    // Revisar caché
    $cacheKey = md5($fullUrl);
    if (isset($cache[$cacheKey]) && $cache[$cacheKey]['timestamp'] > time() - 60) {
        return $cache[$cacheKey]['data'];
    }
    
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
        CURLOPT_USERAGENT => 'MapPlayerAdmin/1.0',
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $error = curl_error($ch);
    $errno = curl_errno($ch);
    
    curl_close($ch);
    
    // Verificar errores
    if ($errno || $httpCode !== 200) {
        $errorInfo = [
            'error' => true,
            'message' => $error ?: "Error HTTP: {$httpCode}",
            'code' => $errno ?: $httpCode
        ];
        
        // Guardar en caché el error por menos tiempo (30 segundos)
        $cache[$cacheKey] = [
            'timestamp' => time(),
            'data' => $errorInfo
        ];
        
        return $errorInfo;
    }
    
    // Intentar decodificar como JSON
    if (strpos($contentType, 'application/json') !== false || $statusPath === 'status-json.xsl') {
        $data = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            return [
                'error' => true,
                'message' => 'Error al decodificar JSON: ' . json_last_error_msg(),
                'response' => substr($response, 0, 255) . (strlen($response) > 255 ? '...' : '')
            ];
        }
        
        // Guardar en caché
        $cache[$cacheKey] = [
            'timestamp' => time(),
            'data' => $data
        ];
        
        return $data;
    }
    
    // Si no es JSON, podría ser XML (status.xsl)
    if (strpos($contentType, 'text/xml') !== false || strpos($contentType, 'application/xml') !== false) {
        // Implementar parser XML si es necesario
        return [
            'error' => true,
            'message' => 'Formato XML no soportado actualmente',
            'contentType' => $contentType
        ];
    }
    
    return [
        'error' => true,
        'message' => 'Formato de respuesta no reconocido',
        'contentType' => $contentType,
        'response' => substr($response, 0, 255) . (strlen($response) > 255 ? '...' : '')
    ];
}

/**
 * Verifica el estado de una estación específica
 * @param string $baseUrl URL base del servidor Icecast
 * @param string $mountPoint Punto de montaje (ej: 'apartado')
 * @param string $statusPath Ruta al archivo de estado
 * @return array Información de la estación
 */
function checkStationStatus($baseUrl, $mountPoint, $statusPath = 'status-json.xsl') {
    $serverInfo = getIcecastServerInfo($baseUrl, $statusPath);
    
    if (isset($serverInfo['error']) && $serverInfo['error']) {
        return [
            'online' => false,
            'error' => true,
            'message' => $serverInfo['message'] ?? 'Error desconocido al obtener información del servidor'
        ];
    }
    
    // Buscar el mountpoint específico
    $mountPoint = '/' . ltrim($mountPoint, '/');
    
    if (isset($serverInfo['icestats']['source'])) {
        $sources = $serverInfo['icestats']['source'];
        
        // Asegurar que sources sea un array de arrays
        if (isset($sources['listenurl'])) {
            $sources = [$sources]; // Si solo hay una fuente, convertirla en array
        }
        
        foreach ($sources as $source) {
            if (isset($source['mount']) && $source['mount'] === $mountPoint) {
                return [
                    'online' => true,
                    'listeners' => $source['listeners'] ?? 0,
                    'description' => $source['server_description'] ?? '',
                    'title' => $source['title'] ?? '',
                    'bitrate' => $source['bitrate'] ?? '',
                    'genre' => $source['genre'] ?? '',
                    'listenurl' => $source['listenurl'] ?? '',
                    'server_type' => $source['server_type'] ?? '',
                    'server_name' => $source['server_name'] ?? '',
                    'stream_start' => $source['stream_start'] ?? '',
                    'raw' => $source
                ];
            }
        }
    }
    
    // Si llegamos aquí, la estación no está en línea
    return [
        'online' => false,
        'error' => false,
        'message' => 'La estación no está transmitiendo actualmente'
    ];
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
        return ['error' => 'URL base del servidor no configurada'];
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
    foreach ($stations['reproductor']['ciudades'] as $index => $station) {
        $serverUrl = $station['serverUrl'] ?? '';
        if (!empty($serverUrl)) {
            // Buscar en la información del servidor ya obtenida
            $mountPoint = '/' . ltrim($serverUrl, '/');
            $stationInfo = ['online' => false, 'name' => $station['name'] ?? '', 'serverUrl' => $serverUrl];
            
            if (isset($serverInfo['icestats']['source'])) {
                foreach ($sources as $source) {
                    // Normalizar valores para comparación
                    $sourceMount = isset($source['mount']) ? strtolower(trim($source['mount'])) : '';
                    $sourceServerUrl = isset($source['server_url']) ? strtolower(trim($source['server_url'])) : '';
                    $normalizedMountPoint = strtolower(trim($mountPoint));
                    $normalizedServerUrl = strtolower(trim($serverUrl));
                    
                    // Comparación más robusta: verificar mount, server_url y listenurl
                    if (
                        $sourceMount === $normalizedMountPoint || 
                        $sourceServerUrl === $normalizedServerUrl || 
                        (isset($source['listenurl']) && strpos(strtolower($source['listenurl']), $normalizedServerUrl) !== false)
                    ) {
                        $stationInfo = [
                            'online' => true,
                            'name' => $station['name'] ?? '',
                            'serverUrl' => $serverUrl,
                            'listeners' => $source['listeners'] ?? 0,
                            'description' => $source['server_description'] ?? '',
                            'title' => $source['title'] ?? '',
                            'bitrate' => $source['bitrate'] ?? '',
                            'genre' => $source['genre'] ?? '',
                            'listenurl' => $source['listenurl'] ?? '',
                            // Añadir los valores exactos para depuración
                            'debug' => [
                                'source_mount' => $source['mount'] ?? null,
                                'source_server_url' => $source['server_url'] ?? null,
                                'mount_point' => $mountPoint,
                                'normalized_mount_point' => $normalizedMountPoint,
                                'normalized_server_url' => $normalizedServerUrl
                            ]
                        ];
                        break;
                    }
                }
            }
            
            $results[] = $stationInfo;
        }
    }
    
    return [
        'error' => false,
        'total' => count($results),
        'online' => count(array_filter($results, function($station) { return $station['online'] ?? false; })),
        'offline' => count(array_filter($results, function($station) { return !($station['online'] ?? false); })),
        'totalSources' => $totalSources, // Nuevo campo con el número total de fuentes
        'stations' => $results,
        'server' => [
            'version' => $serverInfo['icestats']['server_id'] ?? 'Desconocido',
            'admin' => $serverInfo['icestats']['admin'] ?? 'Desconocido',
            'host' => $serverInfo['icestats']['host'] ?? 'Desconocido',
            'location' => $serverInfo['icestats']['location'] ?? 'Desconocido',
        ]
    ];
}

/**
 * Analiza y compara las emisoras entre stations.json y el servidor Icecast
 * @return array Resultado del análisis con coincidencias y discrepancias
 */
function analyzeStationsMapping() {
    $stations = getStationsData();
    if (isset($stations['error'])) {
        return [
            'error' => true,
            'message' => $stations['error']
        ];
    }
    
    $baseUrl = $stations['reproductor']['hostUrl'] ?? '';
    $statusPath = $stations['reproductor']['statusUrl'] ?? 'status-json.xsl';
    
    if (empty($baseUrl)) {
        return [
            'error' => true,
            'message' => 'URL base del servidor no configurada'
        ];
    }
    
    // Obtener datos del servidor Icecast
    $icecastInfo = getIcecastServerInfo($baseUrl, $statusPath);
    
    if (isset($icecastInfo['error']) && $icecastInfo['error']) {
        return [
            'error' => true,
            'message' => $icecastInfo['message'] ?? 'Error al conectar con el servidor',
        ];
    }
    
    // Extraer fuentes de Icecast
    $icecastSources = [];
    if (isset($icecastInfo['icestats']['source'])) {
        $sources = $icecastInfo['icestats']['source'];
        
        // Normalizar a array de arrays si solo hay una fuente
        if (isset($sources['listenurl'])) {
            $sources = [$sources];
        }
        
        foreach ($sources as $source) {
            // Normalizar el mountpoint eliminando la barra al inicio
            $mountPoint = isset($source['mount']) ? ltrim($source['mount'], '/') : '';
            $serverUrl = $source['server_url'] ?? $mountPoint;
            
            // Almacenar ambos identificadores para la comparación
            $icecastSources[$mountPoint] = [
                'mount' => $mountPoint,
                'server_url' => $serverUrl, 
                'server_name' => $source['server_name'] ?? '',
                'description' => $source['server_description'] ?? '',
                'listeners' => $source['listeners'] ?? 0,
                'listenurl' => $source['listenurl'] ?? '',
                'bitrate' => $source['bitrate'] ?? $source['ice-bitrate'] ?? 0,
                'raw' => $source
            ];
        }
    }
    
    // Analizar emisoras del archivo stations.json
    $configStations = [];
    $matchedStations = [];
    $unmatchedStations = [];
    $unmatchedSources = $icecastSources; // Inicialmente todas las fuentes están sin coincidir
    
    foreach ($stations['reproductor']['ciudades'] as $station) {
        $serverUrl = $station['serverUrl'] ?? '';
        if (empty($serverUrl)) continue;
        
        // Normalizar el serverUrl
        $serverUrl = strtolower(trim($serverUrl));
        
        $configStations[$serverUrl] = [
            'serverUrl' => $serverUrl,
            'name' => $station['name'] ?? '',
            'frecuencia' => $station['frecuencia'] ?? '',
            'cx' => $station['cx'] ?? '',
            'cy' => $station['cy'] ?? ''
        ];
        
        $matched = false;
        
        // Buscar coincidencia en las fuentes de Icecast (primero por mount point)
        if (isset($icecastSources[$serverUrl])) {
            $matchedStations[$serverUrl] = [
                'config' => $configStations[$serverUrl],
                'icecast' => $icecastSources[$serverUrl],
                'matchType' => 'direct',
                'online' => true
            ];
            $matched = true;
            // Quitar de la lista de no coincidentes
            unset($unmatchedSources[$serverUrl]);
        } else {
            // Buscar coincidencia por server_url (a veces difiere del mount point)
            foreach ($icecastSources as $mount => $source) {
                $sourceServerUrl = strtolower($source['server_url']);
                
                if ($sourceServerUrl === $serverUrl) {
                    $matchedStations[$serverUrl] = [
                        'config' => $configStations[$serverUrl],
                        'icecast' => $source,
                        'matchType' => 'server_url',
                        'online' => true
                    ];
                    $matched = true;
                    // Quitar de la lista de no coincidentes
                    unset($unmatchedSources[$mount]);
                    break;
                }
            }
        }
        
        // Si no se encontró coincidencia
        if (!$matched) {
            $unmatchedStations[$serverUrl] = [
                'config' => $configStations[$serverUrl],
                'online' => false
            ];
        }
    }
    
    // Calcular estadísticas
    $totalConfig = count($configStations);
    $totalIcecast = count($icecastSources);
    $totalMatched = count($matchedStations);
    $totalUnmatchedConfig = count($unmatchedStations);
    $totalUnmatchedIcecast = count($unmatchedSources);
    
    return [
        'error' => false,
        'stats' => [
            'totalConfig' => $totalConfig,
            'totalIcecast' => $totalIcecast,
            'totalMatched' => $totalMatched,
            'totalUnmatchedConfig' => $totalUnmatchedConfig,
            'totalUnmatchedIcecast' => $totalUnmatchedIcecast,
            'matchPercentage' => $totalConfig > 0 ? round(($totalMatched / $totalConfig) * 100) : 0
        ],
        'matched' => $matchedStations,
        'unmatchedConfig' => $unmatchedStations,
        'unmatchedIcecast' => $unmatchedSources,
        'configStations' => $configStations,
        'icecastSources' => $icecastSources
    ];
}

/**
 * Sugiere correcciones para problemas de mapeo de estaciones
 * @param array $analysis Resultado del análisis de analyzeStationsMapping()
 * @return array Sugerencias de corrección
 */
function suggestStationsMappingFixes($analysis) {
    if (isset($analysis['error']) && $analysis['error']) {
        return $analysis;
    }
    
    $suggestions = [];
    
    // Buscar posibles coincidencias por nombres similares
    foreach ($analysis['unmatchedConfig'] as $configServerUrl => $unmatchedStation) {
        $stationName = strtolower($unmatchedStation['config']['name']);
        $bestMatch = null;
        $bestScore = 0;
        
        foreach ($analysis['unmatchedIcecast'] as $icecastMount => $icecastSource) {
            $sourceName = strtolower($icecastSource['server_name']);
            $sourceUrl = strtolower($icecastSource['server_url']);
            
            // Calcular similitud entre nombres
            $nameScore = similar_text($stationName, $sourceName, $percent);
            
            // También verificar similitud con server_url
            $urlScore = similar_text($configServerUrl, $sourceUrl, $urlPercent);
            $urlScore2 = similar_text($configServerUrl, $icecastMount, $urlPercent2);
            
            // Usar el mejor score de las comparaciones
            $finalScore = max($percent, $urlPercent, $urlPercent2);
            
            // Si es una buena coincidencia
            if ($finalScore > 70 && $finalScore > $bestScore) {
                $bestMatch = $icecastSource;
                $bestScore = $finalScore;
            }
        }
        
        if ($bestMatch !== null) {
            $suggestions[$configServerUrl] = [
                'config' => $unmatchedStation['config'],
                'icecast' => $bestMatch,
                'score' => $bestScore,
                'action' => 'update',
                'suggestion' => "Actualizar '{$configServerUrl}' para que coincida con '{$bestMatch['mount']}'"
            ];
        }
    }
    
    // Identificar estaciones en Icecast que no están en la configuración
    foreach ($analysis['unmatchedIcecast'] as $icecastMount => $icecastSource) {
        if (!isset($suggestions[$icecastMount])) {
            $suggestions[$icecastMount] = [
                'icecast' => $icecastSource,
                'action' => 'add',
                'suggestion' => "Añadir '{$icecastMount}' a stations.json"
            ];
        }
    }
    
    return [
        'error' => false,
        'suggestions' => $suggestions
    ];
}
