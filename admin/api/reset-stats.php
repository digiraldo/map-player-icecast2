<?php
/**
 * API para reiniciar las estadísticas
 */

// Permitir CORS para peticiones AJAX
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Content-Type: application/json; charset=UTF-8");

// Verificar que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido. Use POST para esta operación.'
    ]);
    exit;
}

// Ruta al archivo de estadísticas
define('CONFIG_PATH', '../../data/');
define('HISTORY_FILE', CONFIG_PATH . 'history.json');

// Verificar si existe el archivo
if (!file_exists(HISTORY_FILE)) {
    echo json_encode([
        'success' => true,
        'message' => 'No hay datos que reiniciar'
    ]);
    exit;
}

try {
    // Crear estructura básica vacía para estadísticas
    $emptyHistory = [
        'listeners' => [],
        'stations' => [],
        'created' => date('Y-m-d H:i:s'),
        'updated' => date('Y-m-d H:i:s')
    ];
    
    // Guardar archivo vacío
    if (file_put_contents(HISTORY_FILE, json_encode($emptyHistory, JSON_PRETTY_PRINT))) {
        echo json_encode([
            'success' => true,
            'message' => 'Estadísticas reiniciadas correctamente'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error al reiniciar las estadísticas'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
