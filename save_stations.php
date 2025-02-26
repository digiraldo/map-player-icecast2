<?php
// filepath: /C:/laragon/www/map-player-icecast2/save_stations.php
<?php
    $data = json_decode(file_get_contents('php://input'), true);
    $file = 'data/stations.json';

    if (json_encode($data, JSON_PRETTY_PRINT)) {
        file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT));
        echo 'Datos guardados correctamente';
    } else {
        http_response_code(500);
        echo 'Error al guardar los datos';
    }
?>