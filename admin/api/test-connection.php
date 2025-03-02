<?php
/**
 * API para probar la conexión con el servidor Icecast
 * 
 * Este script prueba la conexión con un servidor Icecast utilizando la URL y el archivo de estado proporcionados.
 */

// Permitir CORS para peticiones AJAX
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json; charset=UTF-8");

// Verificar parámetros
if (!isset($_GET['url']) || empty($_GET['url'])) {
    echo json_encode([
        'error' => true,
        'message' => 'URL del servidor no especificada'
    ]);
    exit;
}

$url = $_GET['url'];
$statusFile = isset($_GET['status']) && !empty($_GET['status']) ? $_GET['status'] : 'status-json.xsl';

// Normalizar URLs
$url = rtrim($url, '/');
$statusFile = ltrim($statusFile, '/');
$fullUrl = "{$url}/{$statusFile}";

// Configurar cURL para la petición
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $fullUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CONNECTTIMEOUT => 5,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_SSL_VERIFYHOST => 0,
    CURLOPT_USERAGENT => 'MapPlayerJS/1.0',
]);

// Ejecutar la petición
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
$errno = curl_errno($ch);
curl_close($ch);

// Verificar la respuesta
if ($errno || $httpCode !== 200) {
    echo json_encode([
        'error' => true,
        'message' => $error ?: "Error HTTP: {$httpCode}",
        'code' => $errno ?: $httpCode
    ]);
    exit;
}

// Intentar decodificar la respuesta como JSON
$data = json_decode($response, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        'error' => true,
        'message' => 'El servidor no devolvió un JSON válido. Verifique la URL del archivo de estado.',
        'response' => substr($response, 0, 255) . (strlen($response) > 255 ? '...' : '')
    ]);
    exit;
}

// Verificar si la estructura es la esperada para un servidor Icecast
if (!isset($data['icestats'])) {
    echo json_encode([
        'error' => true,
        'message' => 'El servidor no parece ser un servidor Icecast válido',
        'response' => $data
    ]);
    exit;
}

// Extraer información relevante del servidor
$serverInfo = [
    'version' => $data['icestats']['server_id'] ?? 'Desconocido',
    'sources' => isset($data['icestats']['source']) ? 
        (isset($data['icestats']['source']['listenurl']) ? 1 : count($data['icestats']['source'])) : 0,
    'admin' => $data['icestats']['admin'] ?? 'No disponible',
    'host' => $data['icestats']['host'] ?? $url
];

// Respuesta exitosa
echo json_encode([
    'error' => false,
    'message' => 'Conexión exitosa',
    'server' => $serverInfo
]);
