<?php
header('Content-Type: application/json');

// Habilitar la visualización de errores para depuración
ini_set('display_errors', 1);
error_reporting(E_ALL);

error_log("Inicio de save_stations.php");

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $json_data = file_get_contents('php://input');
    $data = json_decode($json_data, true);
    
    if ($data && isset($data['data'])) {
        $stations_data = $data['data'];
        $file_path = '/C:/laragon/www/map-player-icecast2/data/stations.json';
        
        // Intentar guardar los datos en el archivo
        try {
            if (file_put_contents($file_path, $stations_data)) {
                echo json_encode(['status' => 'success', 'message' => 'Datos guardados']);
            } else {
                error_log("Error al guardar los datos en el archivo: " . var_export(error_get_last(), true));
                echo json_encode(['status' => 'error', 'message' => 'Error al guardar']);
            }
        } catch (Exception $e) {
            error_log("Excepción al guardar los datos: " . $e->getMessage());
            echo json_encode(['status' => 'error', 'message' => 'Excepción al guardar']);
        }
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Datos inválidos']);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Método no permitido']);
}

error_log("Fin de save_stations.php");
?>
