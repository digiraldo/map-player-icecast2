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

// Obtener el contenido de la solicitud
$raw_data = file_get_contents('php://input');
log_message("Datos recibidos (longitud): " . strlen($raw_data));

if (empty($raw_data)) {
    log_message("Error: No se recibieron datos");
    header('HTTP/1.1 400 Bad Request');
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'No se recibieron datos']);
    exit;
}

// Decodificar el JSON
$data = json_decode($raw_data, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    log_message("Error al decodificar JSON: " . json_last_error_msg());
    header('HTTP/1.1 400 Bad Request');
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Datos JSON inválidos: ' . json_last_error_msg()]);
    exit;
}

// Verificar la estructura de datos esperada
if (!isset($data['data'])) {
    log_message("Error: Estructura de datos incorrecta - falta 'data'");
    header('HTTP/1.1 400 Bad Request');
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Estructura de datos incorrecta']);
    exit;
}

// Obtener los datos a guardar y verificar que sean un string válido
$stations_data = $data['data'];
log_message("Contenido de data: " . substr($stations_data, 0, 100) . "...");

// Ruta al archivo stations.json
$file_path = __DIR__ . '/data/stations.json';
log_message("Ruta del archivo: $file_path");

// Verificar si el archivo existe
if (!file_exists($file_path)) {
    log_message("Error: El archivo $file_path no existe");
    header('HTTP/1.1 500 Internal Server Error');
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'El archivo no existe']);
    exit;
}

// Verificar permisos de escritura
if (!is_writable($file_path)) {
    log_message("Error: El archivo $file_path no tiene permisos de escritura");
    header('HTTP/1.1 500 Internal Server Error');
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'El archivo no tiene permisos de escritura']);
    exit;
}

// Guardar backup
$backup_file = $file_path . '.bak';
if (!copy($file_path, $backup_file)) {
    log_message("Advertencia: No se pudo crear copia de seguridad");
}

// Guardar los datos en el archivo
try {
    $result = file_put_contents($file_path, $stations_data);
    if ($result === false) {
        log_message("Error al escribir en el archivo: " . var_export(error_get_last(), true));
        header('HTTP/1.1 500 Internal Server Error');
        header('Content-Type: application/json');
        echo json_encode(['status' => 'error', 'message' => 'Error al guardar los datos']);
    } else {
        log_message("Éxito: Se escribieron $result bytes en el archivo");
        header('Content-Type: application/json');
        echo json_encode(['status' => 'success', 'message' => 'Datos guardados correctamente', 'bytes' => $result]);
    }
} catch (Exception $e) {
    log_message("Excepción: " . $e->getMessage());
    header('HTTP/1.1 500 Internal Server Error');
    header('Content-Type: application/json');
    echo json_encode(['status' => 'error', 'message' => 'Excepción al guardar: ' . $e->getMessage()]);
}
?>
