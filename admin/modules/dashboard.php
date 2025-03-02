<?php
// Obtener información de todas las estaciones
$stationsStatus = getAllStationsStatus();
$error = isset($stationsStatus['error']) && $stationsStatus['error'];

// Obtener estadísticas generales
$totalStations = $stationsStatus['total'] ?? 0;
$onlineStations = $stationsStatus['online'] ?? 0;
$offlineStations = $stationsStatus['offline'] ?? 0;
$onlinePercentage = $totalStations > 0 ? round(($onlineStations / $totalStations) * 100) : 0;
$serverInfo = $stationsStatus['server'] ?? [];

// Obtener el número total de sources en el servidor Icecast
$totalSources = $stationsStatus['totalSources'] ?? 0;

// Calcular el total de oyentes
$totalListeners = 0;
$stations = $stationsStatus['stations'] ?? [];
foreach ($stations as $station) {
    $totalListeners += isset($station['listeners']) ? intval($station['listeners']) : 0;
}

// Obtener estaciones con más oyentes
usort($stations, function($a, $b) {
    return ($b['listeners'] ?? 0) - ($a['listeners'] ?? 0);
});
$topStations = array_slice($stations, 0, 5); // Top 5 estaciones
?>

<!-- Primera fila de tarjetas -->
<div class="row mb-4">
    <!-- Primera tarjeta: Estaciones Online con información reorganizada -->
    <div class="col-xl-3 col-md-6">
        <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                            Estaciones Online</div>
                        <div class="h5 mb-0 font-weight-bold text-gray-800">
                            <span id="online-stations-count"><?php echo $onlineStations; ?></span>
                        </div>
                        
                        <!-- Añadir información sobre estaciones offline -->
                        <div class="text-xs text-muted mt-2">
                            <div class="mb-1">
                                <i class="fas fa-times-circle text-danger me-1"></i>
                                <span class="font-weight-bold">Offline:</span> 
                                <span id="offline-stations-count"><?php echo $offlineStations; ?></span>
                            </div>
                            <div>
                                <i class="fas fa-broadcast-tower text-primary me-1"></i>
                                <span class="font-weight-bold">Sources:</span> 
                                <span id="total-sources-count"><?php echo $totalSources; ?></span>
                            </div>
                        </div>
                        
                        <!-- Indicador de última actualización -->
                        <div class="text-xs text-muted mt-2">
                            <span id="last-update-time">Actualizado: <?php echo date('H:i:s'); ?></span>
                        </div>
                    </div>
                    <div class="col-auto">
                        <div class="position-relative">
                            <i class="fas fa-signal fa-2x text-success"></i>
                            <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success" id="online-badge">
                                <?php echo $totalSources; ?>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Segunda tarjeta: Total de oyentes (sin cambios) -->
    <div class="col-xl-3 col-md-6">
        <div class="card border-left-info shadow h-100 py-2">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                            Total Oyentes</div>
                        <div class="h5 mb-0 font-weight-bold text-gray-800">
                            <span id="total-listeners-count"><?php echo $totalListeners; ?></span>
                        </div>
                        <div class="text-xs text-muted mt-2">
                            <span class="font-weight-bold">En todas las emisoras</span>
                        </div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-headphones fa-2x text-info"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Tercera tarjeta: Mover el Total de Estaciones aquí -->
    <div class="col-xl-3 col-md-6">
        <div class="card border-left-warning shadow h-100 py-2">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                            Total Estaciones</div>
                        <div class="h5 mb-0 font-weight-bold text-gray-800"><?php echo $totalStations; ?></div>
                        
                        <!-- Añadir el indicador de disponibilidad -->
                        <div class="row no-gutters align-items-center mt-2">
                            <div class="col">
                                <div class="progress progress-sm mr-2">
                                    <div class="progress-bar bg-warning" role="progressbar" 
                                         style="width: <?php echo $onlinePercentage; ?>%"
                                         aria-valuenow="<?php echo $onlinePercentage; ?>" 
                                         aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                            </div>
                            <div class="col-auto ms-2">
                                <div class="text-xs text-muted">
                                    <span id="availability-percentage"><?php echo $onlinePercentage; ?>%</span> disponibles
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-broadcast-tower fa-2x text-warning"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Cuarta tarjeta: Añadir una nueva tarjeta con información extra -->
    <div class="col-xl-3 col-md-6">
        <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                            Estado del Servidor</div>
                        <div class="h5 mb-0 font-weight-bold text-gray-800">
                            <span class="badge bg-success">Conectado</span>
                        </div>
                        <div class="text-xs text-muted mt-2">
                            <div>
                                <span class="font-weight-bold">Versión:</span> 
                                <span><?php echo htmlspecialchars($serverInfo['version'] ?? 'No disponible'); ?></span>
                            </div>
                            <div>
                                <span class="font-weight-bold">Host:</span> 
                                <span><?php echo htmlspecialchars($serverInfo['host'] ?? 'No disponible'); ?></span>
                            </div>
                        </div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-server fa-2x text-primary"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Información del servidor y estaciones más populares -->
<div class="row">
    <!-- Información del servidor -->
    <div class="col-lg-6 mb-4">
        <div class="card shadow mb-4">
            <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">Información del Servidor Icecast</h6>
            </div>
            <div class="card-body">
                <?php if ($error): ?>
                    <div class="alert alert-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>
                        Error al conectar con el servidor Icecast: <?php echo htmlspecialchars($stationsStatus['message'] ?? 'Error desconocido'); ?>
                    </div>
                    <p class="mb-0">
                        <i class="fas fa-info-circle me-1"></i>
                        Asegúrese de que la URL del servidor y la ruta de estado son correctas. 
                        Puede modificarlas en el módulo de configuración.
                    </p>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <tr>
                                <th style="width: 30%">Versión:</th>
                                <td><?php echo htmlspecialchars($serverInfo['version'] ?? 'No disponible'); ?></td>
                            </tr>
                            <tr>
                                <th>Administrador:</th>
                                <td><?php echo htmlspecialchars($serverInfo['admin'] ?? 'No disponible'); ?></td>
                            </tr>
                            <tr>
                                <th>Host:</th>
                                <td><?php echo htmlspecialchars($serverInfo['host'] ?? 'No disponible'); ?></td>
                            </tr>
                            <tr>
                                <th>Ubicación:</th>
                                <td><?php echo htmlspecialchars($serverInfo['location'] ?? 'No disponible'); ?></td>
                            </tr>
                            <tr>
                                <th>URL del servidor:</th>
                                <td>
                                    <?php 
                                    $hostUrl = isset($stationsStatus['hostUrl']) ? $stationsStatus['hostUrl'] : (isset($stations[0]['listenurl']) ? dirname($stations[0]['listenurl']) : '');
                                    echo htmlspecialchars($hostUrl);
                                    ?>
                                </td>
                            </tr>
                            <tr>
                                <th>Estado de conexión:</th>
                                <td>
                                    <span class="badge bg-success">Conectado</span>
                                </td>
                            </tr>
                        </table>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>

    <!-- Estaciones más populares -->
    <div class="col-lg-6 mb-4">
        <div class="card shadow mb-4">
            <div class="card-header py-3">
                <h6 class="m-0 font-weight-bold text-primary">
                    Estaciones Más Populares
                    <!-- Añadir indicador de actualización -->
                    <small class="text-muted float-end" id="top-stations-update-indicator">
                        <i class="fas fa-sync-alt me-1"></i>
                    </small>
                </h6>
            </div>
            <div class="card-body">
                <?php if (empty($stations) || $error): ?>
                    <div class="text-center">
                        <i class="fas fa-info-circle mb-3" style="font-size: 3rem; color: #ccc;"></i>
                        <p>No hay datos disponibles de las estaciones.</p>
                    </div>
                <?php else: ?>
                    <div class="table-responsive">
                        <table class="table table-bordered">
                            <thead>
                                <tr>
                                    <th>Estación</th>
                                    <th>Estado</th>
                                    <th>Oyentes</th>
                                </tr>
                            </thead>
                            <tbody id="top-stations-tbody">
                                <?php foreach ($topStations as $station): ?>
                                <tr data-station="<?php echo htmlspecialchars($station['serverUrl']); ?>">
                                    <td><?php echo htmlspecialchars($station['name'] ?? 'Sin nombre'); ?></td>
                                    <td>
                                        <?php if ($station['online'] ?? false): ?>
                                            <span class="badge bg-success">Online</span>
                                        <?php else: ?>
                                            <span class="badge bg-danger">Offline</span>
                                        <?php endif; ?>
                                    </td>
                                    <td class="listeners-count">
                                        <?php 
                                        echo isset($station['listeners']) ? $station['listeners'] : 'N/A'; 
                                        ?>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                    <div class="text-center mt-3">
                        <a href="./index.php?module=stations" class="btn btn-sm btn-primary">
                            <i class="fas fa-table me-1"></i> Ver todas las estaciones
                        </a>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>
