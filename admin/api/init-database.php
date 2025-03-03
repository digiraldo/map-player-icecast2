<?php
/**
 * Script para inicializar la base de datos de estadísticas
 * Este archivo crea la estructura de la base de datos y genera datos de ejemplo
 */

// Cabeceras para permitir solicitudes AJAX
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json; charset=UTF-8");

// Definir constantes
define('DATA_PATH', '../../data/');
define('STATS_DB', DATA_PATH . 'stats.db');

// Resultado inicial
$result = [
    'success' => false,
    'message' => '',
    'details' => []
];

try {
    // Verificar si existe el directorio de datos
    if (!file_exists(DATA_PATH)) {
        if (!mkdir(DATA_PATH, 0755, true)) {
            throw new Exception("No se pudo crear el directorio de datos");
        }
        $result['details'][] = "Directorio de datos creado";
    }
    
    // Verificar si la extensión PDO_SQLite está habilitada
    if (!extension_loaded('pdo_sqlite')) {
        throw new Exception("La extensión PDO_SQLite no está habilitada. Por favor, active esta extensión en su php.ini y reinicie el servidor web.");
    }
    
    // Crear o conectar a la base de datos
    $pdo = new PDO('sqlite:' . STATS_DB);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Crear la tabla de estadísticas si no existe
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS listener_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp INTEGER NOT NULL,
            station_id TEXT NOT NULL,
            station_name TEXT NOT NULL,
            listeners INTEGER NOT NULL DEFAULT 0,
            peak_listeners INTEGER NOT NULL DEFAULT 0,
            avg_time INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    $result['details'][] = "Tabla listener_stats creada o verificada";
    
    // Crear índices para mejorar el rendimiento
    $pdo->exec("
        CREATE INDEX IF NOT EXISTS idx_timestamp ON listener_stats(timestamp);
        CREATE INDEX IF NOT EXISTS idx_station_id ON listener_stats(station_id);
    ");
    $result['details'][] = "Índices creados o verificados";
    
    // Verificar si hay datos de ejemplo
    $count = $pdo->query("SELECT COUNT(*) FROM listener_stats")->fetchColumn();
    
    if ($count == 0) {
        // Generar datos de ejemplo si no hay datos
        $stations = [
            ['id' => 'station1', 'name' => 'Radio Ejemplo 1'],
            ['id' => 'station2', 'name' => 'Radio Ejemplo 2'],
            ['id' => 'station3', 'name' => 'Radio Ejemplo 3']
        ];
        
        $endTime = time();
        $startTime = $endTime - (7 * 24 * 60 * 60); // 7 días atrás
        
        $stmt = $pdo->prepare("
            INSERT INTO listener_stats 
            (timestamp, station_id, station_name, listeners, peak_listeners, avg_time) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        // Generar 100 registros de ejemplo
        $recordsGenerated = 0;
        for ($i = 0; $i < 100; $i++) {
            $station = $stations[array_rand($stations)];
            $timestamp = rand($startTime, $endTime);
            $listeners = rand(10, 200);
            $peakListeners = $listeners + rand(0, 50);
            $avgTime = rand(3, 30);
            
            try {
                $stmt->execute([
                    $timestamp,
                    $station['id'],
                    $station['name'],
                    $listeners,
                    $peakListeners,
                    $avgTime
                ]);
                $recordsGenerated++;
            } catch (Exception $e) {
                $result['details'][] = "Error en registro #$i: " . $e->getMessage();
            }
        }
        
        $result['details'][] = "Se generaron $recordsGenerated registros de ejemplo";
    } else {
        $result['details'][] = "Ya existen $count registros en la base de datos";
    }
    
    $result['success'] = true;
    $result['message'] = "Base de datos inicializada correctamente";
    
} catch (Exception $e) {
    $result['message'] = "Error: " . $e->getMessage();
}

// Devolver resultado como JSON
echo json_encode($result);
