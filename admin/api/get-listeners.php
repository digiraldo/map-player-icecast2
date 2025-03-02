<?php
/**
 * API para obtener datos de oyentes en tiempo real
 * Devuelve solo la información mínima necesaria para actualizar los contadores
 */

require_once '../includes/config.php';
require_once '../includes/functions.php';
require_once '../includes/auth.php';

// Verificar autenticación (opcional, según nivel de seguridad requerido)
if (!isAuthenticated()) {
    header('HTTP/1.1 401 Unauthorized');
    echo json_encode(['error' => 'No autenticado']);
    exit;
}

// Configurar encabezados para AJAX
header('Content-Type: application/json');

// Obtener información actualizada
$stationsStatus = getAllStationsStatus();

// Si hay error, devolverlo
if (isset($stationsStatus['error']) && $stationsStatus['error']) {
    echo json_encode([
        'error' => true,
        'message' => $stationsStatus['message'] ?? 'Error al obtener datos'
    ]);
    exit;
}

// Calcular el total de oyentes
$totalListeners = 0;
$stations = $stationsStatus['stations'] ?? [];
foreach ($stations as $station) {
    $totalListeners += isset($station['listeners']) ? intval($station['listeners']) : 0;
}

// Calcular el porcentaje de disponibilidad
$availabilityPercentage = ($stationsStatus['total'] > 0)
    ? round(($stationsStatus['online'] / $stationsStatus['total']) * 100)
    : 0;

// Obtener las estadísticas principales
$stats = [
    'total' => $stationsStatus['total'] ?? 0,
    'online' => $stationsStatus['online'] ?? 0,
    'offline' => $stationsStatus['offline'] ?? 0,
    'totalSources' => $stationsStatus['totalSources'] ?? 0,
    'totalListeners' => $totalListeners,
    'availabilityPercentage' => $availabilityPercentage,  // Añadir el porcentaje de disponibilidad
    'time' => date('H:i:s'),
    'lastUpdate' => date('d/m/Y H:i:s')
];

// Preparar información de oyentes por estación
$stations = $stationsStatus['stations'] ?? [];
$listeners = [];

foreach ($stations as $station) {
    $listeners[$station['serverUrl']] = [
        'online' => $station['online'] ?? false,
        'listeners' => $station['listeners'] ?? 0,
        'name' => $station['name'] ?? ''
    ];
}

// Ordenar las estaciones por oyentes para obtener el top 5
usort($stations, function($a, $b) {
    return ($b['listeners'] ?? 0) - ($a['listeners'] ?? 0);
});
$topStations = array_slice($stations, 0, 5);

$top = [];
foreach ($topStations as $station) {
    $top[] = [
        'name' => $station['name'] ?? 'Sin nombre',
        'online' => $station['online'] ?? false,
        'listeners' => $station['listeners'] ?? 0,
        'serverUrl' => $station['serverUrl'] ?? ''
    ];
}

// Devolver datos
echo json_encode([
    'error' => false,
    'stats' => $stats,
    'listeners' => $listeners,
    'top' => $top
]);
