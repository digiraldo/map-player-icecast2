<?php
/**
 * Script para crear la estructura de directorios y archivos necesarios
 * 
 * Este script crea los directorios y archivos necesarios para el funcionamiento
 * de la aplicación, incluyendo la base de datos de estadísticas.
 */

// Definir constantes
define('DATA_PATH', '../../data/');
define('STATS_PATH', DATA_PATH . 'stats/');
define('CONFIG_FILE', DATA_PATH . 'stations.json');
define('STATS_DB', DATA_PATH . 'stats.db');

// Verificación de seguridad
$secretKey = isset($_GET['key']) ? $_GET['key'] : '';
$validKey = 'f8b4j9v2m3n7k8l1'; // Esta clave debería estar en un archivo de configuración

if ($secretKey !== $validKey) {
    header('HTTP/1.1 403 Forbidden');
    header('Content-Type: application/json');
    echo json_encode(['error' => true, 'message' => 'Acceso denegado']);
    exit;
}

// Respuesta por defecto
$response = [
    'error' => false,
    'message' => 'Estructura de datos creada correctamente',
    'created' => []
];

try {
    // Verificar si existe PDO y la extensión SQLite
    if (!extension_loaded('pdo')) {
        throw new Exception("La extensión PDO no está habilitada en el servidor");
    }
    
    if (!extension_loaded('pdo_sqlite')) {
        throw new Exception("La extensión PDO_SQLite no está habilitada en el servidor");
    }
    
    // Crear directorio de datos si no existe
    if (!file_exists(DATA_PATH)) {
        if (mkdir(DATA_PATH, 0755, true)) {
            $response['created'][] = 'Directorio de datos principal';
        } else {
            throw new Exception("No se pudo crear el directorio de datos");
        }
    }
    
    // Crear subdirectorio de estadísticas si no existe
    if (!file_exists(STATS_PATH)) {
        if (mkdir(STATS_PATH, 0755, true)) {
            $response['created'][] = 'Subdirectorio de estadísticas';
        } else {
            throw new Exception("No se pudo crear el subdirectorio de estadísticas");
        }
    }
    
    // Crear base de datos SQLite si no existe
    if (!file_exists(STATS_DB)) {
        try {
            $pdo = new PDO('sqlite:' . STATS_DB);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // Crear la tabla de estadísticas
            $pdo->exec(
                "CREATE TABLE IF NOT EXISTS listener_stats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp INTEGER NOT NULL,
                    station_id TEXT NOT NULL,
                    station_name TEXT NOT NULL,
                    listeners INTEGER NOT NULL DEFAULT 0,
                    peak_listeners INTEGER NOT NULL DEFAULT 0,
                    avg_time INTEGER NOT NULL DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                CREATE INDEX IF NOT EXISTS idx_timestamp ON listener_stats(timestamp);
                CREATE INDEX IF NOT EXISTS idx_station_id ON listener_stats(station_id);
                CREATE INDEX IF NOT EXISTS idx_listeners ON listener_stats(listeners);"
            );
            
            $response['created'][] = 'Base de datos de estadísticas';
        } catch (PDOException $e) {
            throw new Exception("Error al crear la base de datos SQLite: " . $e->getMessage());
        }
    }
    
    // Verificar permisos de escritura
    if (!is_writable(DATA_PATH)) {
        $response['warning'] = "El directorio de datos no tiene permisos de escritura";
    }
    
    if (!is_writable(STATS_PATH)) {
        $response['warning'] = "El directorio de estadísticas no tiene permisos de escritura";
    }
    
    // Contar registros si la base de datos existe
    if (file_exists(STATS_DB)) {
        try {
            $pdo = new PDO('sqlite:' . STATS_DB);
            $count = $pdo->query("SELECT COUNT(*) FROM listener_stats")->fetchColumn();
            $response['stats_count'] = (int)$count;
        } catch (PDOException $e) {
            $response['warning'] = "No se pudo contar los registros: " . $e->getMessage();
        }
    }
    
} catch (Exception $e) {
    $response['error'] = true;
    $response['message'] = $e->getMessage();
}

// Devolver respuesta como JSON
header('Content-Type: application/json');
echo json_encode($response);
