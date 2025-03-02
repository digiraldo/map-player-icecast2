<?php
/**
 * API de depuración para el servidor Icecast
 * Devuelve datos sin procesar del servidor para depuración
 */

// Incluir archivos necesarios
require_once '../includes/config.php';
require_once '../includes/functions.php';
require_once '../includes/auth.php';

// Verificar autenticación (comentar durante depuración si es necesario)
if (!isAuthenticated()) {
    header('HTTP/1.1 401 Unauthorized');
    echo json_encode(['error' => 'No autenticado']);
    exit;
}

// Establecer encabezados para JSON
header('Content-Type: application/json');

// Obtener datos de las estaciones
$stations = getStationsData();
$hostUrl = $stations['reproductor']['hostUrl'] ?? '';
$statusUrl = $stations['reproductor']['statusUrl'] ?? 'status-json.xsl';

// Si no hay URL configurada, devolver error
if (empty($hostUrl)) {
    echo json_encode([
        'error' => true,
        'message' => 'URL del servidor Icecast no configurada',
        'time' => date('Y-m-d H:i:s')
    ]);
    exit;
}

// Obtener información sin procesar del servidor
$rawInfo = getIcecastServerInfo($hostUrl, $statusUrl);

// Devolver respuesta
echo json_encode([
    'error' => false,
    'time' => date('Y-m-d H:i:s'),
    'request' => [
        'hostUrl' => $hostUrl,
        'statusUrl' => $statusUrl,
        'fullUrl' => rtrim($hostUrl, '/') . '/' . ltrim($statusUrl, '/')
    ],
    'rawData' => $rawInfo
]);
