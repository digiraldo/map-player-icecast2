<?php
/**
 * API para limpiar datos de estadísticas
 */

// Configurar salida como JSON
header('Content-Type: application/json');

// Verificar la clave API
$apiKey = $_GET['key'] ?? '';
$validKey = 'f8b4j9v2m3n7k8l1';

if ($apiKey !== $validKey) {
    echo json_encode(['error' => true, 'message' => 'Clave de API inválida']);
    exit;
}

// Ruta al archivo de historial
define('DATA_PATH', __DIR__ . '/../../data/');
define('HISTORY_FILE', DATA_PATH . 'history.json');

try {
    // Verificar que el archivo existe
    if (!file_exists(HISTORY_FILE)) {
        echo json_encode(['error' => false, 'message' => 'No hay datos que borrar']);
        exit;
    }
    
    // Crear estructura vacía para el archivo
    $emptyData = [
        'listeners' => [],
        'stations' => [],
        'updated' => date('Y-m-d H:i:s'),
        'cleared' => date('Y-m-d H:i:s')
    ];
    
    // Guardar archivo vacío
    if (file_put_contents(HISTORY_FILE, json_encode($emptyData, JSON_PRETTY_PRINT))) {
        echo json_encode([
            'error' => false, 
            'message' => 'Datos borrados correctamente',
            'date' => date('Y-m-d H:i:s')
        ]);
    } else {
        throw new Exception("Error al escribir en el archivo de historial");
    }
    
} catch (Exception $e) {
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage()
    ]);
}
