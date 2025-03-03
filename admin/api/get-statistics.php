<?php
/**
 * API para obtener estadísticas históricas de oyentes
 * 
 * Este script consulta la base de datos para obtener estadísticas
 * según los parámetros de rango de fechas y estación
 */

// Permitir CORS para peticiones AJAX
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json; charset=UTF-8");

// Definir constantes
define('DATA_PATH', '../../data/');
define('STATS_PATH', DATA_PATH . 'stats/');
define('CONFIG_FILE', DATA_PATH . 'stations.json');
define('STATS_DB', DATA_PATH . 'stats.db');

// Parámetros de solicitud
$range = isset($_GET['range']) ? $_GET['range'] : 'week';
$station = isset($_GET['station']) ? $_GET['station'] : 'all';
$start = isset($_GET['start']) ? $_GET['start'] : null;
$end = isset($_GET['end']) ? $_GET['end'] : null;

// Verificar si existe el directorio de estadísticas, si no, crearlo
if (!file_exists(STATS_PATH)) {
    mkdir(STATS_PATH, 0755, true);
}

// Inicializar respuesta
$response = [
    'error' => false,
    'range' => $range,
    'data' => [],
    'stations' => [],
    'listeners_trend' => [],
    'distribution' => [],
    'peak_hours' => [],
    'summary' => [
        'total_listeners' => 0,
        'avg_daily' => 0,
        'peak_listeners' => 0,
        'most_popular' => 'N/A'
    ]
];

try {
    // Verificar si la base de datos existe, si no, crearla
    $dbExists = file_exists(STATS_DB);
    $pdo = new PDO('sqlite:' . STATS_DB);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Si la base de datos no existía, crear la estructura
    if (!$dbExists) {
        $pdo->exec(
            "CREATE TABLE listener_stats (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp INTEGER NOT NULL,
                station_id TEXT NOT NULL,
                station_name TEXT NOT NULL,
                listeners INTEGER NOT NULL DEFAULT 0,
                peak_listeners INTEGER NOT NULL DEFAULT 0,
                avg_time INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE INDEX idx_timestamp ON listener_stats(timestamp);
            CREATE INDEX idx_station_id ON listener_stats(station_id);
            CREATE INDEX idx_listeners ON listener_stats(listeners);"
        );
        
        // Añadir algunos datos de ejemplo si la base de datos es nueva
        generateSampleData($pdo);
    }
    
    // Calcular fechas de inicio y fin según el rango
    $endDate = time();
    $startDate = calculateStartDate($range, $start, $end);
    
    // Consulta base para obtener datos
    $baseQuery = "SELECT * FROM listener_stats WHERE timestamp BETWEEN :start AND :end";
    $params = [':start' => $startDate, ':end' => $endDate];
    
    // Filtrar por estación si es necesario
    if ($station !== 'all') {
        $baseQuery .= " AND station_id = :station";
        $params[':station'] = $station;
    }
    
    // Ordenar resultados
    $baseQuery .= " ORDER BY timestamp DESC";
    
    // Ejecutar la consulta principal
    $stmt = $pdo->prepare($baseQuery);
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Asignar datos a la respuesta
    $response['data'] = $data;
    
    // Obtener lista de estaciones
    $stmtStations = $pdo->query("SELECT DISTINCT station_id, station_name FROM listener_stats");
    $stations = $stmtStations->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($stations as $station) {
        $response['stations'][] = [
            'id' => $station['station_id'],
            'name' => $station['station_name']
        ];
    }
    
    // Obtener tendencia de oyentes (agrupados por hora o día según el rango)
    $trendData = getTrendData($pdo, $range, $startDate, $endDate, $station);
    $response['listeners_trend'] = $trendData;
    
    // Obtener distribución por estación
    $distributionData = getDistributionData($pdo, $startDate, $endDate);
    $response['distribution'] = $distributionData;
    
    // Obtener horas pico
    $peakHoursData = getPeakHoursData($pdo, $startDate, $endDate, $station);
    $response['peak_hours'] = $peakHoursData;
    
    // Calcular resumen
    $summaryData = getSummaryData($pdo, $startDate, $endDate, $station);
    $response['summary'] = $summaryData;
    
} catch (Exception $e) {
    $response['error'] = true;
    $response['message'] = $e->getMessage();
}

// Devolver respuesta como JSON
echo json_encode($response);

/**
 * Calcula la fecha de inicio según el rango seleccionado
 * @param string $range Rango seleccionado
 * @param string $customStart Fecha de inicio personalizada
 * @param string $customEnd Fecha de fin personalizada
 * @return int Timestamp para la fecha de inicio
 */
function calculateStartDate($range, $customStart, $customEnd) {
    switch ($range) {
        case 'day':
            return strtotime('today');
        case 'week':
            return strtotime('-7 days');
        case 'month':
            return strtotime('-30 days');
        case 'custom':
            if ($customStart) {
                return strtotime($customStart);
            }
            // Si no hay fecha de inicio personalizada, usar 7 días por defecto
            return strtotime('-7 days');
        default:
            return strtotime('-7 days');
    }
}

/**
 * Obtiene datos para la gráfica de tendencia
 * @param PDO $pdo Conexión a la base de datos
 * @param string $range Rango de tiempo
 * @param int $startDate Timestamp de inicio
 * @param int $endDate Timestamp de fin
 * @param string $stationFilter ID de la estación para filtrar
 * @return array Datos formateados para la gráfica
 */
function getTrendData($pdo, $range, $startDate, $endDate, $stationFilter) {
    // Determinar el intervalo según el rango
    $interval = ($range === 'day') ? 'hour' : 'day';
    $groupBy = ($interval === 'hour') ? '%Y-%m-%d %H:00:00' : '%Y-%m-%d';
    
    // Crear la consulta SQL con GROUP BY para el intervalo adecuado
    $query = "
        SELECT 
            station_id,
            station_name,
            strftime('$groupBy', datetime(timestamp, 'unixepoch')) as interval_group,
            AVG(listeners) as avg_listeners,
            MAX(timestamp) as timestamp
        FROM 
            listener_stats 
        WHERE 
            timestamp BETWEEN :start AND :end
    ";
    
    // Filtrar por estación si es necesario
    if ($stationFilter !== 'all') {
        $query .= " AND station_id = :station";
    }
    
    $query .= " GROUP BY station_id, interval_group ORDER BY timestamp ASC";
    
    // Ejecutar la consulta
    $stmt = $pdo->prepare($query);
    $params = [':start' => $startDate, ':end' => $endDate];
    
    if ($stationFilter !== 'all') {
        $params[':station'] = $stationFilter;
    }
    
    $stmt->execute($params);
    $trendData = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Procesar datos para el formato que necesita la gráfica
    $result = [
        'labels' => [],
        'stations' => [],
        'total' => []
    ];
    
    // Crear una estructura para almacenar los datos por intervalo
    $intervalData = [];
    
    // Procesar cada registro
    foreach ($trendData as $row) {
        $timestamp = strtotime($row['interval_group']);
        
        // Añadir etiqueta si no existe
        if (!in_array($timestamp, $result['labels'])) {
            $intervalData[$timestamp] = ['total' => 0];
            $result['labels'][] = $timestamp;
        }
        
        // Si es la primera vez que vemos esta estación, inicializar
        if (!isset($result['stations'][$row['station_id']])) {
            $result['stations'][$row['station_id']] = [
                'name' => $row['station_name'],
                'data' => array_fill(0, count($result['labels']), 0)
            ];
        }
        
        // Buscar el índice correspondiente
        $index = array_search($timestamp, $result['labels']);
        
        // Actualizar el valor para esta estación y este intervalo
        $result['stations'][$row['station_id']]['data'][$index] = round($row['avg_listeners']);
        
        // Actualizar el total para este intervalo
        $intervalData[$timestamp]['total'] += round($row['avg_listeners']);
    }
    
    // Asegurar que todas las estaciones tengan valores para todos los intervalos
    foreach ($result['stations'] as $stationId => $stationData) {
        // Si hay menos datos que etiquetas, rellenar con ceros
        if (count($stationData['data']) < count($result['labels'])) {
            $result['stations'][$stationId]['data'] = array_pad(
                $stationData['data'], 
                count($result['labels']), 
                0
            );
        }
    }
    
    // Ordenar las etiquetas cronológicamente
    sort($result['labels']);
    
    // Actualizar los totales
    $result['total'] = array_map(function($t) use ($intervalData) {
        return $intervalData[$t]['total'];
    }, $result['labels']);
    
    return $result;
}

/**
 * Obtiene datos de distribución de oyentes por estación
 * @param PDO $pdo Conexión a la base de datos
 * @param int $startDate Timestamp de inicio
 * @param int $endDate Timestamp de fin
 * @return array Datos de distribución por estación
 */
function getDistributionData($pdo, $startDate, $endDate) {
    $query = "
        SELECT 
            station_id,
            station_name,
            AVG(listeners) as avg_listeners
        FROM 
            listener_stats 
        WHERE 
            timestamp BETWEEN :start AND :end
        GROUP BY 
            station_id
        ORDER BY 
            avg_listeners DESC
    ";
    
    $stmt = $pdo->prepare($query);
    $stmt->execute([':start' => $startDate, ':end' => $endDate]);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Formatear los datos para el gráfico
    $result = [];
    foreach ($data as $row) {
        $result[] = [
            'name' => $row['station_name'],
            'value' => round($row['avg_listeners'])
        ];
    }
    
    return $result;
}

/**
 * Obtiene datos de horas pico
 * @param PDO $pdo Conexión a la base de datos
 * @param int $startDate Timestamp de inicio
 * @param int $endDate Timestamp de fin
 * @param string $stationFilter ID de la estación para filtrar
 * @return array Datos de horas pico
 */
function getPeakHoursData($pdo, $startDate, $endDate, $stationFilter) {
    $query = "
        SELECT 
            strftime('%H', datetime(timestamp, 'unixepoch')) as hour,
            AVG(listeners) as avg_listeners
        FROM 
            listener_stats 
        WHERE 
            timestamp BETWEEN :start AND :end
    ";
    
    // Filtrar por estación si es necesario
    if ($stationFilter !== 'all') {
        $query .= " AND station_id = :station";
    }
    
    $query .= " GROUP BY hour ORDER BY hour";
    
    $stmt = $pdo->prepare($query);
    $params = [':start' => $startDate, ':end' => $endDate];
    
    if ($stationFilter !== 'all') {
        $params[':station'] = $stationFilter;
    }
    
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Formatear los datos para el gráfico
    $result = [];
    foreach ($data as $row) {
        $result[$row['hour']] = round($row['avg_listeners']);
    }
    
    return $result;
}

/**
 * Calcula datos de resumen
 * @param PDO $pdo Conexión a la base de datos
 * @param int $startDate Timestamp de inicio
 * @param int $endDate Timestamp de fin
 * @param string $stationFilter ID de la estación para filtrar
 * @return array Datos de resumen
 */
function getSummaryData($pdo, $startDate, $endDate, $stationFilter) {
    // Consulta para obtener total de oyentes (el último registro disponible)
    $queryTotal = "
        SELECT SUM(listeners) as total_listeners
        FROM listener_stats 
        WHERE timestamp = (
            SELECT MAX(timestamp) 
            FROM listener_stats 
            WHERE timestamp BETWEEN :start AND :end
        )
    ";
    
    // Consulta para obtener promedio diario
    $queryAvg = "
        SELECT AVG(daily_avg) as avg_daily
        FROM (
            SELECT 
                strftime('%Y-%m-%d', datetime(timestamp, 'unixepoch')) as day,
                AVG(listeners) as daily_avg
            FROM listener_stats 
            WHERE timestamp BETWEEN :start AND :end
    ";
    
    // Consulta para obtener pico máximo
    $queryPeak = "
        SELECT MAX(listeners) as peak_listeners
        FROM listener_stats 
        WHERE timestamp BETWEEN :start AND :end
    ";
    
    // Consulta para obtener estación más popular
    $queryPopular = "
        SELECT station_name, AVG(listeners) as avg_listeners
        FROM listener_stats 
        WHERE timestamp BETWEEN :start AND :end
    ";
    
    // Filtrar por estación si es necesario
    if ($stationFilter !== 'all') {
        $queryTotal .= " AND station_id = :station";
        $queryAvg .= " AND station_id = :station";
        $queryPeak .= " AND station_id = :station";
        $queryPopular .= " AND station_id = :station";
    }
    
    $queryAvg .= " GROUP BY day) subquery";
    $queryPopular .= " GROUP BY station_id ORDER BY avg_listeners DESC LIMIT 1";
    
    // Parámetros comunes
    $params = [':start' => $startDate, ':end' => $endDate];
    if ($stationFilter !== 'all') {
        $params[':station'] = $stationFilter;
    }
    
    // Ejecutar consultas
    $stmtTotal = $pdo->prepare($queryTotal);
    $stmtTotal->execute($params);
    $totalData = $stmtTotal->fetch(PDO::FETCH_ASSOC);
    
    $stmtAvg = $pdo->prepare($queryAvg);
    $stmtAvg->execute($params);
    $avgData = $stmtAvg->fetch(PDO::FETCH_ASSOC);
    
    $stmtPeak = $pdo->prepare($queryPeak);
    $stmtPeak->execute($params);
    $peakData = $stmtPeak->fetch(PDO::FETCH_ASSOC);
    
    $stmtPopular = $pdo->prepare($queryPopular);
    $stmtPopular->execute($params);
    $popularData = $stmtPopular->fetch(PDO::FETCH_ASSOC);
    
    // Construir resultado
    return [
        'total_listeners' => $totalData ? intval($totalData['total_listeners']) : 0,
        'avg_daily' => $avgData ? round($avgData['avg_daily']) : 0,
        'peak_listeners' => $peakData ? intval($peakData['peak_listeners']) : 0,
        'most_popular' => $popularData ? $popularData['station_name'] : 'N/A'
    ];
}

/**
 * Genera datos de ejemplo para las estadísticas
 * @param PDO $pdo Conexión a la base de datos
 */
function generateSampleData($pdo) {
    // Cargar configuración de estaciones
    if (!file_exists(CONFIG_FILE)) {
        return; // No hay configuración, no podemos generar datos
    }
    
    $config = json_decode(file_get_contents(CONFIG_FILE), true);
    if (!$config || !isset($config['reproductor']['ciudades'])) {
        return;
    }
    
    $stations = $config['reproductor']['ciudades'];
    $endDate = time();
    $startDate = strtotime('-30 days');
    
    // Preparar consulta de inserción
    $stmt = $pdo->prepare(
        "INSERT INTO listener_stats 
         (timestamp, station_id, station_name, listeners, peak_listeners, avg_time) 
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    
    // Generar datos para cada día entre las fechas
    for ($date = $startDate; $date <= $endDate; $date += 3600) { // Cada hora
        foreach ($stations as $station) {
            // Solo generar datos para algunas estaciones aleatoriamente
            if (rand(0, 10) > 7) continue;
            
            $listeners = rand(5, 100);
            $peakListeners = $listeners + rand(0, 50);
            $avgTime = rand(5, 60);
            
            $stmt->execute([
                $date,
                $station['serverUrl'],
                $station['name'],
                $listeners,
                $peakListeners,
                $avgTime
            ]);
        }
    }
}