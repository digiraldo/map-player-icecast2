<?php
// Realizar el análisis de mapeo de estaciones
$analysis = analyzeStationsMapping();
$error = isset($analysis['error']) && $analysis['error'];

// Obtener sugerencias si no hay errores
$suggestions = $error ? [] : suggestStationsMappingFixes($analysis);

// Acción de aplicar correcciones
$actionMessage = '';
if (isset($_POST['action']) && $_POST['action'] === 'apply_fixes') {
    // Cargar datos actuales
    $stations = getStationsData();
    
    // Aplicar correcciones seleccionadas
    if (isset($_POST['fixes']) && is_array($_POST['fixes'])) {
        $appliedCount = 0;
        
        foreach ($_POST['fixes'] as $stationId => $newMountPoint) {
            // Buscar la estación en el array de ciudades
            foreach ($stations['reproductor']['ciudades'] as $key => $ciudad) {
                if (isset($ciudad['serverUrl']) && $ciudad['serverUrl'] === $stationId) {
                    // Actualizar el serverUrl
                    $stations['reproductor']['ciudades'][$key]['serverUrl'] = $newMountPoint;
                    $appliedCount++;
                    break;
                }
            }
        }
        
        if ($appliedCount > 0) {
            // Guardar cambios
            $result = saveStationsData($stations);
            if ($result === true) {
                $actionMessage = alert("Se han aplicado $appliedCount correcciones correctamente.", 'success');
                // Realizar nuevo análisis
                $analysis = analyzeStationsMapping();
                $error = isset($analysis['error']) && $analysis['error'];
                $suggestions = $error ? [] : suggestStationsMappingFixes($analysis);
            } else {
                $actionMessage = alert("Error al guardar los cambios: $result", 'danger');
            }
        } else {
            $actionMessage = alert("No se seleccionaron correcciones para aplicar.", 'warning');
        }
    }
}
?>

<div class="mb-4">
    <div class="row">
        <div class="col-md-8">
            <p>
                Este módulo analiza las estaciones configuradas en <code>stations.json</code> y las compara con 
                las fuentes activas en el servidor Icecast para identificar discrepancias.
            </p>
        </div>
        <div class="col-md-4 text-end">
            <button class="btn btn-primary" id="refreshAnalysisBtn">
                <i class="fas fa-sync-alt me-1"></i> Actualizar análisis
            </button>
        </div>
    </div>
</div>

<?php if ($actionMessage): ?>
    <?php echo $actionMessage; ?>
<?php endif; ?>

<?php if ($error): ?>
    <div class="alert alert-danger">
        <i class="fas fa-exclamation-circle me-2"></i>
        Error al realizar el análisis: <?php echo htmlspecialchars($analysis['message'] ?? 'Error desconocido'); ?>
    </div>
<?php else: ?>
    <!-- Resumen del análisis -->
    <div class="card shadow mb-4">
        <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">Resumen del análisis de estaciones</h6>
        </div>
        <div class="card-body">
            <div class="row">
                <div class="col-md-4 mb-3">
                    <div class="card text-white bg-primary">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-3">
                                    <i class="fas fa-check-circle fa-3x"></i>
                                </div>
                                <div class="col-9">
                                    <h3 class="card-title"><?php echo $analysis['stats']['totalMatched']; ?></h3>
                                    <p class="card-text">Estaciones correctamente mapeadas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card text-white bg-warning">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-3">
                                    <i class="fas fa-exclamation-triangle fa-3x"></i>
                                </div>
                                <div class="col-9">
                                    <h3 class="card-title"><?php echo $analysis['stats']['totalUnmatchedConfig']; ?></h3>
                                    <p class="card-text">Estaciones sin coincidencia en Icecast</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card text-white bg-info">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-3">
                                    <i class="fas fa-broadcast-tower fa-3x"></i>
                                </div>
                                <div class="col-9">
                                    <h3 class="card-title"><?php echo $analysis['stats']['totalUnmatchedIcecast']; ?></h3>
                                    <p class="card-text">Fuentes Icecast no mapeadas</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="progress mt-4">
                <div class="progress-bar bg-success" role="progressbar" style="width: <?php echo $analysis['stats']['matchPercentage']; ?>%" 
                    aria-valuenow="<?php echo $analysis['stats']['matchPercentage']; ?>" aria-valuemin="0" aria-valuemax="100">
                    <?php echo $analysis['stats']['matchPercentage']; ?>% Correctamente mapeadas
                </div>
            </div>
        </div>
    </div>
    
    <?php if (!empty($suggestions['suggestions'])): ?>
    <!-- Sugerencias de corrección -->
    <div class="card shadow mb-4">
        <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">Sugerencias de corrección</h6>
        </div>
        <div class="card-body">
            <form action="index.php?module=stations-mapping" method="post" id="fixForm">
                <input type="hidden" name="action" value="apply_fixes">
                <div class="table-responsive">
                    <table class="table table-bordered">
                        <thead>
                            <tr>
                                <th>Aplicar</th>
                                <th>Estación en stations.json</th>
                                <th>Sugerencia</th>
                                <th>Coincidencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($suggestions['suggestions'] as $serverUrl => $suggestion): ?>
                                <?php if ($suggestion['action'] === 'update'): ?>
                                <tr>
                                    <td class="text-center">
                                        <input type="checkbox" name="fixes[<?php echo htmlspecialchars($serverUrl); ?>]" 
                                               value="<?php echo htmlspecialchars($suggestion['icecast']['mount']); ?>"
                                               class="form-check-input">
                                    </td>
                                    <td>
                                        <strong><?php echo htmlspecialchars($suggestion['config']['name']); ?></strong><br>
                                        <small class="text-muted">serverUrl: <?php echo htmlspecialchars($serverUrl); ?></small>
                                    </td>
                                    <td>
                                        <strong><?php echo htmlspecialchars($suggestion['icecast']['server_name']); ?></strong><br>
                                        <small class="text-muted">mountpoint: <?php echo htmlspecialchars($suggestion['icecast']['mount']); ?></small>
                                    </td>
                                    <td>
                                        <div class="d-flex align-items-center">
                                            <div class="progress" style="width: 100px;">
                                                <div class="progress-bar bg-success" role="progressbar" 
                                                     style="width: <?php echo round($suggestion['score']); ?>%" 
                                                     aria-valuenow="<?php echo round($suggestion['score']); ?>" 
                                                     aria-valuemin="0" aria-valuemax="100"></div>
                                            </div>
                                            <span class="ms-2"><?php echo round($suggestion['score']); ?>%</span>
                                        </div>
                                    </td>
                                </tr>
                                <?php endif; ?>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
                
                <div class="mt-3">
                    <button type="submit" class="btn btn-success" id="applyFixesBtn">
                        <i class="fas fa-check me-1"></i> Aplicar correcciones seleccionadas
                    </button>
                </div>
            </form>
        </div>
    </div>
    <?php endif; ?>
    
    <!-- Estaciones correctamente mapeadas -->
    <div class="card shadow mb-4">
        <div class="card-header py-3">
            <h6 class="m-0 font-weight-bold text-primary">Estaciones correctamente mapeadas</h6>
        </div>
        <div class="card-body">
            <div class="table-responsive">
                <table class="table table-bordered datatable">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>serverUrl (stations.json)</th>
                            <th>mountpoint (Icecast)</th>
                            <th>Oyentes</th>
                            <th>Bitrate</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($analysis['matched'] as $serverUrl => $station): ?>
                        <tr>
                            <td><?php echo htmlspecialchars($station['config']['name']); ?></td>
                            <td><?php echo htmlspecialchars($serverUrl); ?></td>
                            <td><?php echo htmlspecialchars($station['icecast']['mount']); ?></td>
                            <td><?php echo $station['icecast']['listeners']; ?></td>
                            <td><?php echo $station['icecast']['bitrate']; ?> kbps</td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    
    <!-- Estaciones no mapeadas -->
    <div class="row">
        <div class="col-lg-6 mb-4">
            <div class="card shadow mb-4">
                <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">Estaciones en stations.json sin coincidencia</h6>
                </div>
                <div class="card-body">
                    <?php if (empty($analysis['unmatchedConfig'])): ?>
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle me-2"></i> Todas las estaciones configuradas tienen una coincidencia en Icecast.
                        </div>
                    <?php else: ?>
                        <div class="table-responsive">
                            <table class="table table-bordered datatable">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>serverUrl</th>
                                        <th>Frecuencia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($analysis['unmatchedConfig'] as $serverUrl => $station): ?>
                                    <tr>
                                        <td><?php echo htmlspecialchars($station['config']['name']); ?></td>
                                        <td><?php echo htmlspecialchars($serverUrl); ?></td>
                                        <td><?php echo htmlspecialchars($station['config']['frecuencia']); ?></td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
        
        <div class="col-lg-6 mb-4">
            <div class="card shadow mb-4">
                <div class="card-header py-3">
                    <h6 class="m-0 font-weight-bold text-primary">Fuentes Icecast no mapeadas</h6>
                </div>
                <div class="card-body">
                    <?php if (empty($analysis['unmatchedIcecast'])): ?>
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle me-2"></i> Todas las fuentes de Icecast están mapeadas en la configuración.
                        </div>
                    <?php else: ?>
                        <div class="table-responsive">
                            <table class="table table-bordered datatable">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Mountpoint</th>
                                        <th>Oyentes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <?php foreach ($analysis['unmatchedIcecast'] as $mount => $source): ?>
                                    <tr>
                                        <td><?php echo htmlspecialchars($source['server_name']); ?></td>
                                        <td><?php echo htmlspecialchars($mount); ?></td>
                                        <td><?php echo $source['listeners']; ?></td>
                                    </tr>
                                    <?php endforeach; ?>
                                </tbody>
                            </table>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
<?php endif; ?>

<script>
document.addEventListener('DOMContentLoaded', function() {
    // Botón para refrescar análisis
    const refreshBtn = document.getElementById('refreshAnalysisBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            const originalContent = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analizando...';
            this.disabled = true;
            setTimeout(() => {
                window.location.reload();
            }, 500);
        });
    }
    
    // Formulario de correcciones
    const fixForm = document.getElementById('fixForm');
    const applyBtn = document.getElementById('applyFixesBtn');
    if (fixForm && applyBtn) {
        fixForm.addEventListener('submit', function(e) {
            const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
            if (checkboxes.length === 0) {
                e.preventDefault();
                showToast('Aviso', 'Seleccione al menos una corrección para aplicar', 'warning');
                return false;
            }
            
            applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Aplicando...';
            applyBtn.disabled = true;
            return true;
        });
    }
});
</script>
