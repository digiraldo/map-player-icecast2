<?php
// Habilitar la visualización de errores
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Crear archivo de log dedicado
$log_file = __DIR__ . '/save_log.txt';
function log_message($message) {
    global $log_file;
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($log_file, "[$timestamp] $message" . PHP_EOL, FILE_APPEND);
}

log_message("Iniciando proceso de guardado");

// Asegurar que estamos recibiendo una solicitud POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    log_message("Error: Método no permitido - " . $_SERVER['REQUEST_METHOD']);
    header('HTTP/1.1 405 Method Not Allowed');
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
    exit;
}

// Recibir los datos JSON
$data = json_decode(file_get_contents('php://input'), true);

// Validar que se recibieron datos
if (!isset($data['data']) || empty($data['data'])) {
    log_message("Error: No se recibieron datos");
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'message' => 'No se recibieron datos']);
    exit;
}

// Obtener los datos a guardar y verificar que sean un string válido
$stations_data = $data['data'];
log_message("Contenido de data: " . substr($stations_data, 0, 100) . "...");

// Ruta al archivo JSON
$file = __DIR__ . '/data/stations.json';
log_message("Ruta del archivo: $file");

// Verificar si el archivo existe
if (!file_exists($file)) {
    log_message("Error: El archivo $file no existe");
    header('HTTP/1.1 500 Internal Server Error');
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'El archivo no existe']);
    exit;
}

// Verificar permisos de escritura
if (!is_writable($file)) {
    log_message("Error: El archivo $file no tiene permisos de escritura");
    header('HTTP/1.1 500 Internal Server Error');
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'El archivo no tiene permisos de escritura']);
    exit;
}

// Guardar backup
$backup_file = $file . '.bak';
if (!copy($file, $backup_file)) {
    log_message("Advertencia: No se pudo crear copia de seguridad");
}

// Intentar escribir los datos en el archivo
try {
    $result = file_put_contents($file, $stations_data);
    
    if ($result === false) {
        throw new Exception("No se pudo escribir en el archivo");
    }
    
    // Limpiar cualquier caché de opcode que pueda estar afectando
    if (function_exists('opcache_reset')) {
        opcache_reset();
    }
    
    log_message("Éxito: Se escribieron $result bytes en el archivo");
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'message' => 'Datos guardados correctamente']);
} catch (Exception $e) {
    log_message("Excepción: " . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false, 
        'message' => 'Error al guardar: ' . $e->getMessage(),
        'error_details' => error_get_last()
    ]);
}
?>
