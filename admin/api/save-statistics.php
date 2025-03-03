<?php
/**
 * Script para guardar estadísticas de oyentes
 * 
 * Este script captura periódicamente (mediante CRON o tareas programadas)
 * información sobre los oyentes de cada estación y la almacena en la base de datos
 */

// Definir constantes
define('DATA_PATH', '../../data/');
define('STATS_PATH', DATA_PATH . 'stats/');
define('CONFIG_FILE', DATA_PATH . 'stations.json');
define('STATS_DB', DATA_PATH . 'stats.db');

// Verificar si se ejecuta desde CLI o mediante petición web
$isCLI = (php_sapi_name() === 'cli');

// Si es petición web, verificar clave secreta o restricción
if (!$isCLI) {
    // Para evitar ejecuciones no autorizadas se puede implementar un sistema de tokens
    $secretKey = isset($_GET['key']) ? $_GET['key'] : '';
    $validKey = 'f8b4j9v2m3n7k8l1'; // Esta clave debería estar en un archivo de configuración
    
    if ($secretKey !== $validKey) {
        header('HTTP/1.1 403 Forbidden');
        echo "Acceso denegado";
        exit;
    }
}

try {
    // Verificar si existe el directorio de estadísticas, si no, crearlo
    if (!file_exists(STATS_PATH)) {
        mkdir(STATS_PATH, 0755, true);
    }
    
    // Verificar y crear base de datos si no existe
    $dbExists = file_exists(STATS_DB);
    $pdo = new PDO('sqlite:' . STATS_DB);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
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
    }
    
    // Cargar la configuración
    if (!file_exists(CONFIG_FILE)) {
        throw new Exception("Archivo de configuración no encontrado");
    }
    
    $config = json_decode(file_get_contents(CONFIG_FILE), true);
    if (!$config || !isset($config['reproductor'])) {
        throw new Exception("Configuración inválida");
    }
    
    // Obtener la URL base del servidor Icecast
    $hostUrl = $config['reproductor']['hostUrl'] ?? '';
    $statusUrl = $config['reproductor']['statusUrl'] ?? 'status-json.xsl';
    $stations = $config['reproductor']['ciudades'] ?? [];
    
    if (empty($hostUrl) || empty($stations)) {
        throw new Exception("Configuración insuficiente");
    }
    
    // Obtener datos de estado del servidor Icecast
    $statusFullUrl = rtrim($hostUrl, '/') . '/' . ltrim($statusUrl, '/');
    $jsonData = @file_get_contents($statusFullUrl);
    
    if ($jsonData === false) {
        throw new Exception("No se puede conectar con el servidor Icecast");
    }
    
    $icecastStatus = json_decode($jsonData, true);
    if (!$icecastStatus || !isset($icecastStatus['icestats'])) {
        throw new Exception("Respuesta inválida del servidor Icecast");
    }
    
    // Preparar consulta de inserción
    $stmt = $pdo->prepare(
        "INSERT INTO listener_stats 
         (timestamp, station_id, station_name, listeners, peak_listeners, avg_time) 
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    
    // Timestamp actual
    $now = time();
    $listenersCount = [];
    
    // Procesar fuentes (sources)
    $sources = $icecastStatus['icestats']['source'] ?? [];
    if (!is_array($sources)) {
        $sources = [$sources]; // Convertir a array si solo hay una fuente
    }
    
    foreach ($sources as $source) {
        // Extraer el ID de la estación del mountpoint
        $mountpoint = $source['mountpoint'] ?? '';
        $stationId = trim($mountpoint, '/');
        
        // Buscar la información de la estación
        $station = null;
        foreach ($stations as $s) {
            if ($s['serverUrl'] === $stationId) {
                $station = $s;
                break;
            }
        }
        
        // Si no encontramos la estación, pasar a la siguiente
        if (!$station) {
            continue;
        }
        
        // Datos a guardar
        $listeners = $source['listeners'] ?? 0;
        $peakListeners = $source['listener_peak'] ?? $listeners;
        
        // El tiempo promedio de escucha es un dato calculado (simulado para este ejemplo)
        // En una implementación real, esto podría venir del servidor Icecast o ser calculado
        $avgTime = rand(10, 30); // Entre 10 y 30 minutos
        
        // Registrar los datos en la base de datos
        $stmt->execute([
            $now,
            $stationId,
            $station['name'],
            $listeners,
            $peakListeners,
            $avgTime
        ]);
        
        $listenersCount[$stationId] = $listeners;
    }
    
    // También guardar datos para las estaciones que están offline
    foreach ($stations as $station) {
        $stationId = $station['serverUrl'];
        
        // Si ya procesamos esta estación, seguir a la siguiente
        if (isset($listenersCount[$stationId])) {
            continue;
        }
        
        // La estación está offline, guardar con 0 oyentes
        $stmt->execute([
            $now,
            $stationId,
            $station['name'],
            0, // Sin oyentes
            0, // Sin pico de oyentes
            0  // Sin tiempo promedio
        ]);
    }
    
    // Limpiar datos antiguos (opcional, mantener datos de los últimos 90 días)
    $cleanupDate = $now - (90 * 86400); // 90 días en segundos
    $cleanupStmt = $pdo->prepare("DELETE FROM listener_stats WHERE timestamp < ?");
    $cleanupStmt->execute([$cleanupDate]);
    
    // Respuesta
    $response = [
        'error' => false,
        'message' => 'Estadísticas guardadas correctamente',
        'timestamp' => $now,
        'date' => date('Y-m-d H:i:s', $now),
        'stations_processed' => count($listenersCount) + count($stations) - count($listenersCount)
    ];
    
    // Si es una petición web, devolver respuesta como JSON
    if (!$isCLI) {
        header('Content-Type: application/json');
        echo json_encode($response);
    } else {
        // Si es CLI, imprimir mensaje de éxito
        echo "Estadísticas guardadas correctamente\n";
        echo "Fecha: " . date('Y-m-d H:i:s', $now) . "\n";
        echo "Estaciones procesadas: " . $response['stations_processed'] . "\n";
    }
    
} catch (Exception $e) {
    $errorMsg = "Error: " . $e->getMessage();
    
    // Si es una petición web, devolver error como JSON
    if (!$isCLI) {
        header('Content-Type: application/json');
        echo json_encode(['error' => true, 'message' => $errorMsg]);
    } else {
        // Si es CLI, imprimir mensaje de error
        echo $errorMsg . "\n";
        exit(1); // Código de salida de error
    }
}