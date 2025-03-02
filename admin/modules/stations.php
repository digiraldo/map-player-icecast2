<?php
// Obtener el filtro y la vista, si existen
$filter = isset($_GET['filter']) ? $_GET['filter'] : '';
$view = isset($_GET['view']) ? $_GET['view'] : '';

// Mensaje de depuración (opcional - quitar en producción)
if ($view === 'all') {
    // No es necesario hacer nada específico, pero reconocemos el parámetro
    // para evitar problemas con la redirección
}

// Obtener datos de estaciones
$stationsData = getAllStationsStatus();
$error = isset($stationsData['error']) && $stationsData['error'];
$stations = $stationsData['stations'] ?? [];

// Aplicar filtro según el parámetro
if ($filter === 'online') {
    $stations = array_filter($stations, function($station) {
        return $station['online'] ?? false;
    });
    $filterTitle = 'Estaciones Online';
    $filterBadgeClass = 'bg-success';
} elseif ($filter === 'offline') {
    $stations = array_filter($stations, function($station) {
        return !($station['online'] ?? false);
    });
    $filterTitle = 'Estaciones Offline';
    $filterBadgeClass = 'bg-danger';
} else {
    $filterTitle = 'Todas las Estaciones';
    $filterBadgeClass = 'bg-info';
}

// Ordenar estaciones según el criterio seleccionado
$sortBy = isset($_GET['sort']) ? $_GET['sort'] : 'status';

if ($sortBy === 'listeners') {
    usort($stations, function($a, $b) {
        return ($b['listeners'] ?? 0) - ($a['listeners'] ?? 0);
    });
} elseif ($sortBy === 'name') {
    usort($stations, function($a, $b) {
        return strcasecmp($a['name'] ?? '', $b['name'] ?? '');
    });
} else { // Por defecto, ordenar por estado (online primero)
    usort($stations, function($a, $b) {
        // Primero por estado online/offline
        if (($a['online'] ?? false) && !($b['online'] ?? false)) return -1;
        if (!($a['online'] ?? false) && ($b['online'] ?? false)) return 1;
        // Si ambas tienen el mismo estado, ordenar por oyentes (de más a menos)
        if (($a['online'] ?? false) && ($b['online'] ?? false)) {
            return ($b['listeners'] ?? 0) - ($a['listeners'] ?? 0);
        }
        // Si ambas están offline, ordenar por nombre
        return strcasecmp($a['name'] ?? '', $b['name'] ?? '');
    });
}

// Estadísticas generales
$totalStations = count($stations);
$onlineStations = count(array_filter($stations, function($station) { return $station['online'] ?? false; }));
$offlineStations = $totalStations - $onlineStations;
$totalListeners = 0;

foreach ($stations as $station) {
    if ($station['online'] ?? false) {
        $totalListeners += $station['listeners'] ?? 0;
    }
}
?>

<div class="mb-4">
    <!-- Fila de estadísticas y filtros -->
    <div class="row mb-3">
        <!-- Columna de estadísticas -->
        <div class="col-md-6">
            <div class="card shadow-sm">
                <div class="card-body py-2">
                    <div class="row text-center">
                        <div class="col">
                            <h6 class="text-primary mb-1">Total</h6>
                            <h4><?php echo $totalStations; ?></h4>
                        </div>
                        <div class="col">
                            <h6 class="text-success mb-1">Online</h6>
                            <h4><?php echo $onlineStations; ?></h4>
                        </div>
                        <div class="col">
                            <h6 class="text-danger mb-1">Offline</h6>
                            <h4><?php echo $offlineStations; ?></h4>
                        </div>
                        <div class="col">
                            <h6 class="text-info mb-1">Oyentes</h6>
                            <h4><?php echo $totalListeners; ?></h4>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Columna de filtros y opciones -->
        <div class="col-md-6">
            <div class="d-flex justify-content-end gap-2 mb-2">
                <div class="btn-group" role="group">
                    <a href="index.php?module=stations" class="btn btn-outline-secondary <?php echo empty($filter) ? 'active' : ''; ?>">
                        <i class="fas fa-list me-1"></i> Todas
                    </a>
                    <a href="index.php?module=stations&filter=online" class="btn btn-outline-success <?php echo $filter === 'online' ? 'active' : ''; ?>">
                        <i class="fas fa-signal me-1"></i> Online
                    </a>
                    <a href="index.php?module=stations&filter=offline" class="btn btn-outline-danger <?php echo $filter === 'offline' ? 'active' : ''; ?>">
                        <i class="fas fa-times-circle me-1"></i> Offline
                    </a>
                </div>
                
                <div class="btn-group" role="group">
                    <button type="button" class="btn btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown">
                        <i class="fas fa-sort me-1"></i> Ordenar
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li>
                            <a class="dropdown-item <?php echo $sortBy === 'status' ? 'active' : ''; ?>" 
                               href="?module=stations&filter=<?php echo $filter; ?>&sort=status">
                                <i class="fas fa-signal me-1"></i> Por estado
                            </a>
                        </li>
                        <li>
                            <a class="dropdown-item <?php echo $sortBy === 'listeners' ? 'active' : ''; ?>" 
                               href="?module=stations&filter=<?php echo $filter; ?>&sort=listeners">
                                <i class="fas fa-headphones me-1"></i> Por oyentes
                            </a>
                        </li>
                        <li>
                            <a class="dropdown-item <?php echo $sortBy === 'name' ? 'active' : ''; ?>" 
                               href="?module=stations&filter=<?php echo $filter; ?>&sort=name">
                                <i class="fas fa-font me-1"></i> Por nombre
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>

    <!-- Tabla de estaciones -->
    <?php if ($error): ?>
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle me-2"></i>
            Error al obtener datos de las estaciones: <?php echo htmlspecialchars($stationsData['message'] ?? 'Error desconocido'); ?>
        </div>
    <?php else: ?>
        <div class="card shadow mb-4">
            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                <h6 class="m-0 font-weight-bold text-primary">
                    <?php echo $filterTitle; ?>
                    <span class="badge <?php echo $filterBadgeClass; ?>"><?php echo count($stations); ?></span>
                </h6>
                <div class="input-group input-group-sm" style="width: 250px;">
                    <span class="input-group-text" id="search-addon">
                        <i class="fas fa-search"></i>
                    </span>
                    <input type="text" class="form-control" id="stationSearch" placeholder="Buscar estación..." 
                        aria-label="Buscar" aria-describedby="search-addon">
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-bordered table-hover datatable" width="100%" cellspacing="0">
                        <thead>
                            <tr>
                                <th style="width: 80px;">Estado</th>
                                <th>Nombre</th>
                                <th>Frecuencia</th>
                                <th style="width: 100px;">Oyentes</th>
                                <th>Mount Point</th>
                                <th style="width: 110px;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($stations as $station): ?>
                            <tr class="station-row <?php echo ($station['online'] ?? false) ? 'station-online' : 'station-offline'; ?>">
                                <td class="text-center">
                                    <?php if ($station['online'] ?? false): ?>
                                        <span class="badge bg-success"><i class="fas fa-signal me-1"></i> Online</span>
                                    <?php else: ?>
                                        <span class="badge bg-danger"><i class="fas fa-times-circle me-1"></i> Offline</span>
                                    <?php endif; ?>
                                </td>
                                <td><?php echo htmlspecialchars($station['name'] ?? 'Sin nombre'); ?></td>
                                <td><?php echo htmlspecialchars($station['frecuencia'] ?? 'N/A'); ?></td>
                                <td class="text-center">
                                    <?php if ($station['online'] ?? false): ?>
                                        <span class="badge bg-info"><?php echo $station['listeners'] ?? 0; ?></span>
                                    <?php else: ?>
                                        <span class="text-muted">-</span>
                                    <?php endif; ?>
                                </td>
                                <td><code><?php echo htmlspecialchars($station['serverUrl'] ?? 'N/A'); ?></code></td>
                                <td>
                                    <div class="btn-group btn-group-sm" role="group">
                                        <button type="button" class="btn btn-info station-info-btn" data-bs-toggle="modal" data-bs-target="#stationModal" data-station='<?php echo json_encode($station); ?>'>
                                            <i class="fas fa-info-circle"></i>
                                        </button>
                                        <?php if (($station['online'] ?? false) && isset($station['listenurl'])): ?>
                                        <a href="<?php echo htmlspecialchars($station['listenurl']); ?>" class="btn btn-success" target="_blank" data-bs-toggle="tooltip" title="Escuchar">
                                            <i class="fas fa-play"></i>
                                        </a>
                                        <?php else: ?>
                                        <button type="button" class="btn btn-secondary" disabled>
                                            <i class="fas fa-play"></i>
                                        </button>
                                        <?php endif; ?>
                                        <a href="index.php?module=station-debug&station=<?php echo urlencode($station['name'] ?? ''); ?>" class="btn btn-primary" data-bs-toggle="tooltip" title="Diagnosticar">
                                            <i class="fas fa-stethoscope"></i>
                                        </a>
                                    </div>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    <?php endif; ?>
</div>

<!-- Modal para detalles de estación -->
<div class="modal fade" id="stationModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="stationModalLabel">Detalles de Estación</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <div id="stationDetails">
                    <!-- Los detalles se cargan dinámicamente -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
            </div>
        </div>
    </div>
</div>

<!-- Agregar script para la búsqueda en tiempo real -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Búsqueda en tiempo real
    const searchInput = document.getElementById('stationSearch');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const searchTerm = this.value.toLowerCase();
            const rows = document.querySelectorAll('.station-row');
            
            rows.forEach(row => {
                const name = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
                const freq = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
                const mount = row.querySelector('td:nth-child(5)').textContent.toLowerCase();
                
                if (name.includes(searchTerm) || freq.includes(searchTerm) || mount.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
    
    // Modal de detalles de estación
    const stationModal = document.getElementById('stationModal');
    if (stationModal) {
        stationModal.addEventListener('show.bs.modal', function(event) {
            const button = event.relatedTarget;
            const stationData = JSON.parse(button.getAttribute('data-station'));
            const stationDetails = document.getElementById('stationDetails');
            
            let html = '<div class="text-center mb-3">';
            if (stationData.online) {
                html += '<span class="badge bg-success mb-2 px-3 py-2"><i class="fas fa-signal me-1"></i> Online</span>';
                html += '<h4>' + stationData.name + '</h4>';
                html += '<p class="text-muted">' + stationData.frecuencia + '</p>';
                html += '<div class="mb-3">';
                html += '<span class="badge bg-info me-2">Oyentes: ' + (stationData.listeners || 0) + '</span>';
                html += '<span class="badge bg-warning">Bitrate: ' + (stationData.bitrate || 'N/A') + ' kbps</span>';
                html += '</div>';
                if (stationData.listenurl) {
                    html += '<div class="mb-3">';
                    html += '<a href="' + stationData.listenurl + '" target="_blank" class="btn btn-success">';
                    html += '<i class="fas fa-headphones me-1"></i> Escuchar';
                    html += '</a>';
                    html += '</div>';
                }
            } else {
                html += '<span class="badge bg-danger mb-2 px-3 py-2"><i class="fas fa-times-circle me-1"></i> Offline</span>';
                html += '<h4>' + stationData.name + '</h4>';
                html += '<p class="text-muted">' + stationData.frecuencia + '</p>';
                html += '<div class="alert alert-warning">';
                html += '<i class="fas fa-exclamation-triangle me-2"></i> Esta estación no está transmitiendo actualmente';
                html += '</div>';
            }
            html += '</div>';
            
            // Detalles técnicos
            html += '<div class="card mt-3">';
            html += '<div class="card-header bg-light">Detalles técnicos</div>';
            html += '<div class="card-body">';
            html += '<table class="table table-sm">';
            html += '<tr><th>Mount Point:</th><td><code>' + stationData.serverUrl + '</code></td></tr>';
            if (stationData.description) {
                html += '<tr><th>Descripción:</th><td>' + stationData.description + '</td></tr>';
            }
            if (stationData.genre) {
                html += '<tr><th>Género:</th><td>' + stationData.genre + '</td></tr>';
            }
            html += '</table>';
            html += '</div>';
            html += '</div>';
            
            stationDetails.innerHTML = html;
        });
    }
});
</script>

<style>
/* Estilos adicionales para la tabla de estaciones */
.station-offline td {
    opacity: 0.7;
}

@keyframes pulseSuccess {
    0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4); }
    70% { box-shadow: 0 0 0 5px rgba(40, 167, 69, 0); }
    100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
}

.badge.bg-info {
    min-width: 40px;
}
</style>
