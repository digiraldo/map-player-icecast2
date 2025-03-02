<?php
// Herramienta para depurar problemas de estaciones específicas

// Obtener el nombre de la estación de la URL
$stationName = isset($_GET['station']) ? $_GET['station'] : 'Bogotá';

// Buscar la estación en la configuración
$stations = getStationsData();
$targetStation = null;
$serverUrl = null;

foreach ($stations['reproductor']['ciudades'] as $station) {
    if (strcasecmp($station['name'], $stationName) === 0) {
        $targetStation = $station;
        $serverUrl = $station['serverUrl'] ?? '';
        break;
    }
}

// Obtener información del servidor Icecast
$baseUrl = $stations['reproductor']['hostUrl'] ?? '';
$statusPath = $stations['reproductor']['statusUrl'] ?? 'status-json.xsl';
$icecastInfo = getIcecastServerInfo($baseUrl, $statusPath);

// Extraer información de las fuentes
$sources = [];
if (!isset($icecastInfo['error']) && isset($icecastInfo['icestats']['source'])) {
    if (isset($icecastInfo['icestats']['source']['listenurl'])) {
        $sources = [$icecastInfo['icestats']['source']];
    } else {
        $sources = $icecastInfo['icestats']['source'];
    }
}

// Buscar la fuente correspondiente
$matchedSource = null;
$mountPoint = $serverUrl ? '/' . ltrim($serverUrl, '/') : null;

foreach ($sources as $source) {
    $sourceMount = $source['mount'] ?? '';
    $sourceServerUrl = $source['server_url'] ?? '';
    
    if (
        ($mountPoint && strcasecmp($sourceMount, $mountPoint) === 0) ||
        ($serverUrl && strcasecmp($sourceServerUrl, $serverUrl) === 0) ||
        (isset($source['listenurl']) && strpos(strtolower($source['listenurl']), strtolower($serverUrl)) !== false)
    ) {
        $matchedSource = $source;
        break;
    }
}
?>

<div class="card shadow mb-4">
    <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">Diagnóstico de Estación: <?php echo htmlspecialchars($stationName); ?></h6>
    </div>
    <div class="card-body">
        <?php if (!$targetStation): ?>
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                Estación no encontrada en la configuración.
            </div>
        <?php else: ?>
            <h5>Datos en la configuración (stations.json)</h5>
            <div class="table-responsive mb-4">
                <table class="table table-bordered">
                    <tr>
                        <th>Nombre:</th>
                        <td><?php echo htmlspecialchars($targetStation['name'] ?? 'N/A'); ?></td>
                    </tr>
                    <tr>
                        <th>serverUrl:</th>
                        <td><?php echo htmlspecialchars($targetStation['serverUrl'] ?? 'N/A'); ?></td>
                    </tr>
                    <tr>
                        <th>Frecuencia:</th>
                        <td><?php echo htmlspecialchars($targetStation['frecuencia'] ?? 'N/A'); ?></td>
                    </tr>
                    <tr>
                        <th>Mount Point esperado:</th>
                        <td><code><?php echo htmlspecialchars($mountPoint ?? 'N/A'); ?></code></td>
                    </tr>
                </table>
            </div>
            
            <?php if ($matchedSource): ?>
                <div class="alert alert-success mb-4">
                    <i class="fas fa-check-circle me-2"></i>
                    Se encontró una coincidencia en el servidor Icecast.
                </div>
                
                <h5>Datos en el servidor Icecast</h5>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <?php foreach ($matchedSource as $key => $value): ?>
                            <?php if (is_scalar($value) && $key !== 'listenurl'): ?>
                                <tr>
                                    <th><?php echo htmlspecialchars($key); ?>:</th>
                                    <td><?php echo htmlspecialchars($value); ?></td>
                                </tr>
                            <?php endif; ?>
                        <?php endforeach; ?>
                        <tr>
                            <th>URL de escucha:</th>
                            <td>
                                <a href="<?php echo htmlspecialchars($matchedSource['listenurl'] ?? '#'); ?>" target="_blank" class="btn btn-sm btn-success">
                                    <i class="fas fa-play me-1"></i> Reproducir
                                </a>
                                <code class="ms-2"><?php echo htmlspecialchars($matchedSource['listenurl'] ?? 'N/A'); ?></code>
                            </td>
                        </tr>
                    </table>
                </div>
            <?php else: ?>
                <div class="alert alert-danger mb-4">
                    <i class="fas fa-times-circle me-2"></i>
                    No se encontró ninguna fuente en el servidor Icecast que coincida con esta estación.
                </div>
                
                <h5>Todas las fuentes disponibles en Icecast</h5>
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>Mount</th>
                                <th>server_url</th>
                                <th>Nombre</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($sources as $source): ?>
                                <tr>
                                    <td><code><?php echo htmlspecialchars($source['mount'] ?? 'N/A'); ?></code></td>
                                    <td><code><?php echo htmlspecialchars($source['server_url'] ?? 'N/A'); ?></code></td>
                                    <td><?php echo htmlspecialchars($source['server_name'] ?? 'Sin nombre'); ?></td>
                                    <td>
                                        <?php if (isset($source['listenurl'])): ?>
                                            <a href="<?php echo htmlspecialchars($source['listenurl']); ?>" target="_blank" class="btn btn-sm btn-info">
                                                <i class="fas fa-play me-1"></i> Probar
                                            </a>
                                        <?php endif; ?>
                                    </td>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        <?php endif; ?>
    </div>
</div>

<div class="card shadow">
    <div class="card-header py-3">
        <h6 class="m-0 font-weight-bold text-primary">Soluciones posibles</h6>
    </div>
    <div class="card-body">
        <ol>
            <li>
                <strong>Si la estación muestra "offline" pero debería estar online:</strong>
                <p>Asegúrese de que el valor <code>serverUrl</code> coincida exactamente con <code>mount</code> o <code>server_url</code> en el servidor Icecast.</p>
                <p>Compare cuidadosamente mayúsculas/minúsculas, espacios y caracteres especiales.</p>
            </li>
            <li>
                <strong>Si el Mount Point esperado no coincide con ninguna fuente:</strong>
                <p>Vaya a la sección "Mapeo de Emisoras" para corregir automáticamente estas discrepancias.</p>
            </li>
        </ol>
        
        <div class="mt-3">
            <a href="index.php?module=stations-mapping" class="btn btn-primary">
                <i class="fas fa-exchange-alt me-1"></i> Ir a Mapeo de Emisoras
            </a>
            <a href="index.php?module=stations" class="btn btn-secondary ms-2">
                <i class="fas fa-list me-1"></i> Ver todas las estaciones
            </a>
        </div>
    </div>
</div>
