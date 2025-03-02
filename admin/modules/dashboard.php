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

// Obtener estaciones con más oyentes
$stations = $stationsStatus['stations'] ?? [];
usort($stations, function($a, $b) {
    return ($b['listeners'] ?? 0) - ($a['listeners'] ?? 0);
});
$topStations = array_slice($stations, 0, 5); // Top 5 estaciones
?>

<div class="row mb-4">
    <div class="col-xl-3 col-md-6">
        <div class="card border-left-primary shadow h-100 py-2">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                            Total Estaciones</div>
                        <div class="h5 mb-0 font-weight-bold text-gray-800"><?php echo $totalStations; ?></div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-broadcast-tower fa-2x text-gray-300"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="col-xl-3 col-md-6">
        <div class="card border-left-success shadow h-100 py-2">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                            Estaciones Online</div>
                        <div class="h5 mb-0 font-weight-bold text-gray-800"><?php echo $onlineStations; ?></div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-signal fa-2x text-gray-300"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="col-xl-3 col-md-6">
        <div class="card border-left-warning shadow h-100 py-2">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                            Estaciones Offline</div>
                        <div class="h5 mb-0 font-weight-bold text-gray-800"><?php echo $offlineStations; ?></div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-exclamation-triangle fa-2x text-gray-300"></i>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="col-xl-3 col-md-6">
        <div class="card border-left-info shadow h-100 py-2">
            <div class="card-body">
                <div class="row no-gutters align-items-center">
                    <div class="col mr-2">
                        <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                            Disponibilidad</div>
                        <div class="row no-gutters align-items-center">
                            <div class="col-auto">
                                <div class="h5 mb-0 mr-3 font-weight-bold text-gray-800"><?php echo $onlinePercentage; ?>%</div>
                            </div>
                            <div class="col">
                                <div class="progress progress-sm mr-2">
                                    <div class="progress-bar bg-info" role="progressbar" style="width: <?php echo $onlinePercentage; ?>%"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-auto">
                        <i class="fas fa-percentage fa-2x text-gray-300"></i>
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
                <h6 class="m-0 font-weight-bold text-primary">Estaciones Más Populares</h6>
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
                            <tbody>
                                <?php foreach ($topStations as $station): ?>
                                <tr>
                                    <td><?php echo htmlspecialchars($station['name'] ?? 'Sin nombre'); ?></td>
                                    <td>
                                        <?php if ($station['online'] ?? false): ?>
                                            <span class="badge bg-success">Online</span>
                                        <?php else: ?>
                                            <span class="badge bg-danger">Offline</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
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
                        <a href="index.php?module=stations" class="btn btn-sm btn-primary">
                            <i class="fas fa-table me-1"></i> Ver todas las estaciones
                        </a>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </div>
</div>
