<?php
header('Content-Type: application/json');

// Cargar los datos de estaciones
$stations_file = __DIR__ . '/data/stations.json';
$stations_data = json_decode(file_get_contents($stations_file), true);

// Obtener la URL del servidor de status
$host_url = $stations_data['reproductor']['hostUrl'] ?? '';
$status_url = $stations_data['reproductor']['statusUrl'] ?? '';
$status_url_completa = "{$host_url}/{$status_url}";

// Intentar obtener datos del servidor Icecast
$icecast_data = null;
$icecast_error = null;

try {
    $icecast_response = @file_get_contents($status_url_completa);
    if ($icecast_response !== false) {
        $icecast_data = json_decode($icecast_response, true);
    } else {
        $icecast_error = "No se pudo conectar con el servidor Icecast";
    }
} catch (Exception $e) {
    $icecast_error = $e->getMessage();
}

// Comparar estaciones configuradas con estaciones activas en el servidor
$stations_comparison = [];
$active_sources = [];

if ($icecast_data && isset($icecast_data['icestats']['source'])) {
    $sources = is_array($icecast_data['icestats']['source']) 
        ? $icecast_data['icestats']['source'] 
        : [$icecast_data['icestats']['source']];
    
    foreach ($sources as $source) {
        $server_url = $source['server_url'] ?? '';
        $active_sources[] = $server_url;
    }
}

// Analizar cada ciudad configurada
foreach ($stations_data['reproductor']['ciudades'] as $ciudad) {
    $server_url = $ciudad['serverUrl'] ?? '';
    $name = $ciudad['name'] ?? '';
    
    // Buscar coincidencia exacta
    $found = in_array($server_url, $active_sources);
    $matching_source = $found ? $server_url : null;
    
    $stations_comparison[] = [
        'name' => $name,
        'configured_url' => $server_url,
        'found_in_icecast' => $found,
        'matching_source' => $matching_source,
        'exact_match' => $found
    ];
}

// Construir respuesta
$response = [
    'timestamp' => date('Y-m-d H:i:s'),
    'status_url' => $status_url_completa,
    'icecast_connection' => $icecast_error ? 'error' : 'success',
    'error' => $icecast_error,
    'active_sources_count' => count($active_sources),
    'configured_stations_count' => count($stations_data['reproductor']['ciudades']), // Ya usa el recuento dinámico
    'stations_comparison' => $stations_comparison,
    'active_sources' => $active_sources,
    'note' => 'Solo se muestran como activas las estaciones con coincidencia exacta entre serverUrl y server_url'
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>
