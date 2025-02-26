<?php
// Asegurar que siempre se envía como JSON
header('Content-Type: application/json');

// Prevenir que PHP muestre errores como HTML
ini_set('display_errors', 0);

try {
    // Recibir los datos JSON
    $json_data = file_get_contents('php://input');
    
    // Verificar que se recibieron datos
    if (empty($json_data)) {
        throw new Exception("No se recibieron datos");
    }
    
    $data = json_decode($json_data, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception("Error decodificando JSON: " . json_last_error_msg());
    }
    
    // Validar estructura básica de datos
    if (!isset($data['reproductor'])) {
        throw new Exception("Formato de datos incorrecto: falta el objeto 'reproductor'");
    }
    
    // Ruta al archivo stations.json (ruta absoluta para evitar problemas)
    $file_path = __DIR__ . '/stations.json';
    
    // Guardar los datos en el archivo
    $result = file_put_contents($file_path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    if ($result === false) {
        throw new Exception("Error al escribir en el archivo stations.json. Verifique permisos.");
    }
    
    echo json_encode(['success' => true, 'message' => "Datos guardados correctamente ($result bytes escritos)"]);

} catch (Exception $e) {
    // Siempre devolver JSON, nunca mensajes de error en formato HTML
    echo json_encode([
        'success' => false, 
        'message' => $e->getMessage()
    ]);
    exit;
}
?>