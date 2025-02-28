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
    $found = false;
    $matching_source = null;
    
    // Buscar esta ciudad en las fuentes activas
    foreach ($active_sources as $source_url) {
        if ($server_url === $source_url || 
            strpos($source_url, $server_url) !== false || 
            strpos($source_url, strtolower($name)) !== false) {
            $found = true;
            $matching_source = $source_url;
            break;
        }
    }
    
    $stations_comparison[] = [
        'name' => $name,
        'configured_url' => $server_url,
        'found_in_icecast' => $found,
        'matching_source' => $matching_source,
        'exact_match' => $server_url === $matching_source
    ];
}

// Construir respuesta
$response = [
    'timestamp' => date('Y-m-d H:i:s'),
    'status_url' => $status_url_completa,
    'icecast_connection' => $icecast_error ? 'error' : 'success',
    'error' => $icecast_error,
    'active_sources_count' => count($active_sources),
    'configured_stations_count' => count($stations_data['reproductor']['ciudades']),
    'stations_comparison' => $stations_comparison,
    'active_sources' => $active_sources
];

echo json_encode($response, JSON_PRETTY_PRINT);
?>
