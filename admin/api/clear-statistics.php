<?php
/**
 * Script para borrar datos de estadísticas
 * 
 * Este script permite borrar todos los datos de estadísticas o filtrar 
 * por antiguedad u otros criterios
 */

// Definir constantes
define('DATA_PATH', '../../data/');
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

// Tipo de limpieza (all = todo, older_than = más antiguos que X días)
$type = isset($_GET['type']) ? $_GET['type'] : 'all';
$days = isset($_GET['days']) ? (int)$_GET['days'] : 90;

// Respuesta por defecto
$response = [
    'error' => false,
    'message' => 'Operación completada',
    'records_deleted' => 0
];

try {
    // Verificar si existe la base de datos
    if (!file_exists(STATS_DB)) {
        throw new Exception("Base de datos de estadísticas no encontrada");
    }
    
    // Conectar a la base de datos
    $pdo = new PDO('sqlite:' . STATS_DB);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Preparar consulta según el tipo de limpieza
    switch ($type) {
        case 'older_than':
            $cutoffDate = time() - ($days * 86400); // Días a segundos
            $query = "DELETE FROM listener_stats WHERE timestamp < :cutoff";
            $stmt = $pdo->prepare($query);
            $stmt->bindParam(':cutoff', $cutoffDate, PDO::PARAM_INT);
            break;
            
        case 'all':
        default:
            $query = "DELETE FROM listener_stats";
            $stmt = $pdo->prepare($query);
            break;
    }
    
    // Ejecutar la consulta
    $stmt->execute();
    
    // Obtener número de registros eliminados
    $response['records_deleted'] = $stmt->rowCount();
    $response['message'] = "Se han eliminado {$response['records_deleted']} registros.";
    
} catch (Exception $e) {
    $response['error'] = true;
    $response['message'] = $e->getMessage();
}

// Devolver respuesta como JSON
header('Content-Type: application/json');
echo json_encode($response);
