<?php
// Obtener el filtro, si existe
$filter = isset($_GET['filter']) ? $_GET['filter'] : '';

// Obtener datos de estaciones
$stationsData = getAllStationsStatus();
$error = isset($stationsData['error']) && $stationsData['error'];
$stations = $stationsData['stations'] ?? [];

// Aplicar filtro
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

// Ordenar estaciones: primero online, luego por nombre
usort($stations, function($a, $b) {
    // Primero por estado online/offline
    if (($a['online'] ?? false) && !($b['online'] ?? false)) return -1;
    if (!($a['online'] ?? false) && ($b['online'] ?? false)) return 1;
    // Si ambas tienen el mismo estado, ordenar por nombre
    return strcasecmp($a['name'] ?? '', $b['name'] ?? '');
});
?>

<div class="mb-4">
    <div class="row">
        <div class="col-md-6">
            <h5>
                <?php echo $filterTitle; ?>
                <span class="badge <?php echo $filterBadgeClass; ?>"><?php echo count($stations); ?></span>
            </h5>
        </div>
        <div class="col-md-6 text-end">
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
        </div>
    </div>
</div>

<?php if ($error): ?>
    <div class="alert alert-danger">
        <i class="fas fa-exclamation-circle me-2"></i>
        Error al obtener datos de las estaciones: <?php echo htmlspecialchars($stationsData['message'] ?? 'Error desconocido'); ?>
    </div>
<?php else: ?>
    <div class="card shadow mb-4">
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-bordered datatable" width="100%" cellspacing="0">
                    <thead>
                        <tr>
                            <th>Estado</th>
                            <th>Nombre</th>
                            <th>Frecuencia</th>
                            <th>Oyentes</th>
                            <th>Mount Point</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($stations as $station): ?>
                        <tr>
                            <td class="text-center">
                                <?php if ($station['online'] ?? false): ?>
                                    <span class="badge bg-success"><i class="fas fa-signal me-1"></i> Online</span>
                                <?php else: ?>
                                    <span class="badge bg-danger"><i class="fas fa-times-circle me-1"></i> Offline</span>
                                <?php endif; ?>
                            </td>
                            <td><?php echo htmlspecialchars($station['name'] ?? 'Sin nombre'); ?></td>
                            <td><?php echo htmlspecialchars($station['frecuencia'] ?? 'N/A'); ?></td>
                            <td>
                                <?php if ($station['online'] ?? false): ?>
                                    <span class="badge bg-info"><?php echo $station['listeners'] ?? 0; ?></span>
                                <?php else: ?>
                                    <span class="text-muted">-</span>
                                <?php endif; ?>
                            </td>
                            <td><code><?php echo htmlspecialchars($station['serverUrl'] ?? 'N/A'); ?></code></td>
                            <td>
                                <div class="btn-group btn-group-sm" role="group">
                                    <button type="button" class="btn btn-info" data-bs-toggle="modal" data-bs-target="#stationModal" data-station='<?php echo json_encode($station); ?>'>
                                        <i class="fas fa-info-circle"></i>
                                    </button>
                                    <a href="#" class="btn btn-success" target="_blank" data-bs-toggle="tooltip" title="Escuchar">
                                        <i class="fas fa-play"></i>
                                    </a>
                                    <button type="button" class="btn btn-primary" data-bs-toggle="tooltip" title="Editar">
                                        <i class="fas fa-edit"></i>
                                    </button>
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

<script>
document.addEventListener('DOMContentLoaded', function() {
    const stationModal = document.getElementById('stationModal');
    if (stationModal) {
        stationModal.addEventListener('show.bs.modal', function(event) {
            const button = event.relatedTarget;
            const stationData = JSON.parse(button.getAttribute('data-station'));
            const stationDetails = document.getElementById('stationDetails');
            
            let html = '<div class="text-center mb-3">';
            if (stationData.online) {
                html += '<span class="badge bg-success mb-2"><i class="fas fa-signal me-1"></i> Online</span>';
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
                html += '<span class="badge bg-danger mb-2"><i class="fas fa-times-circle me-1"></i> Offline</span>';
                html += '<h4>' + stationData.name + '</h4>';
                html += '<p class="text-muted">' + stationData.frecuencia + '</p>';
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
