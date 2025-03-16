<?php
/**
 * Herramienta para validar la integridad del archivo de historial de estadísticas
 */

// Establecer zona horaria a Colombia
date_default_timezone_set('America/Bogota');

// Ruta al archivo de historial
define('DATA_PATH', __DIR__ . '/../../data/');
define('HISTORY_FILE', DATA_PATH . 'history.json');
define('LOG_FILE', __DIR__ . '/../logs/history_validation.log');

// Función para registrar mensajes en el log
function log_validation($message) {
    $date = date('Y-m-d H:i:s');
    file_put_contents(LOG_FILE, "[$date] $message\n", FILE_APPEND);
}

// Iniciar buffer de salida para manipular la respuesta HTML
ob_start();

// Variables para almacenar resultados
$validationResults = [];
$generalStats = [];
$listenerStats = [];
$hasErrors = false;
$validationSummary = '';

// Verificar que el archivo existe
if (!file_exists(HISTORY_FILE)) {
    $message = "El archivo de historial no existe";
    log_validation("ERROR: $message");
    $validationResults[] = [
        'type' => 'error',
        'message' => $message
    ];
    $hasErrors = true;
} else {
    // Cargar el archivo
    $content = file_get_contents(HISTORY_FILE);
    $history = json_decode($content, true);

    // Verificar que es un JSON válido
    if (json_last_error() !== JSON_ERROR_NONE) {
        $message = "El archivo de historial no contiene JSON válido: " . json_last_error_msg();
        log_validation("ERROR: $message");
        $validationResults[] = [
            'type' => 'error',
            'message' => $message
        ];
        $hasErrors = true;
    } else {
        // Verificar la estructura básica
        if (!isset($history['listeners']) || !is_array($history['listeners'])) {
            $message = "El archivo de historial no tiene una sección 'listeners' válida";
            log_validation("ERROR: $message");
            $validationResults[] = [
                'type' => 'error',
                'message' => $message
            ];
            $hasErrors = true;
        }

        if (!isset($history['stations']) || !is_array($history['stations'])) {
            $message = "El archivo de historial no tiene una sección 'stations' válida";
            log_validation("ERROR: $message");
            $validationResults[] = [
                'type' => 'error',
                'message' => $message
            ];
            $hasErrors = true;
        }

        if (!$hasErrors) {
            // Estadísticas generales
            $entryCount = count($history['listeners']);
            $stationCount = count($history['stations']);
            $firstEntry = !empty($history['listeners']) ? date('Y-m-d H:i:s', $history['listeners'][0]['timestamp']) : 'N/A';
            $lastEntry = !empty($history['listeners']) ? date('Y-m-d H:i:s', $history['listeners'][count($history['listeners']) - 1]['timestamp']) : 'N/A';
            
            $generalStats = [
                'entryCount' => $entryCount,
                'stationCount' => $stationCount,
                'firstEntry' => $firstEntry,
                'lastEntry' => $lastEntry
            ];
            
            log_validation("Estadísticas: Entradas=$entryCount, Estaciones=$stationCount, Rango=$firstEntry a $lastEntry");

            // Verificar integridad de cada entrada
            $errorCount = 0;
            $missingDataCount = 0;
            $entriesWithIssues = [];

            foreach ($history['listeners'] as $index => $entry) {
                $hasIssues = false;
                $issues = [];
                
                // Verificar campos obligatorios
                if (!isset($entry['timestamp'])) {
                    $hasIssues = true;
                    $issues[] = "Falta timestamp";
                }
                
                if (!isset($entry['formatted_date'])) {
                    $hasIssues = true;
                    $issues[] = "Falta fecha formateada";
                }
                
                if (!isset($entry['count'])) {
                    $hasIssues = true;
                    $issues[] = "Falta conteo de oyentes";
                }
                
                if (!isset($entry['stations']) || !is_array($entry['stations'])) {
                    $hasIssues = true;
                    $issues[] = "Faltan datos de estaciones";
                } elseif (empty($entry['stations'])) {
                    $missingDataCount++;
                    $issues[] = "No hay datos de estaciones";
                }
                
                if ($hasIssues) {
                    $errorCount++;
                    $entryDate = isset($entry['formatted_date']) ? $entry['formatted_date'] : 'Fecha desconocida';
                    $entriesWithIssues[] = [
                        'index' => $index,
                        'date' => $entryDate,
                        'issues' => $issues
                    ];
                    log_validation("ERROR en entrada #$index ($entryDate): " . implode(", ", $issues));
                }
            }

            if ($errorCount > 0) {
                $validationResults[] = [
                    'type' => 'error',
                    'message' => "Se encontraron $errorCount entradas con problemas.",
                    'details' => $entriesWithIssues
                ];
                log_validation("Se encontraron $errorCount entradas con problemas");
                $hasErrors = true;
            } else {
                $validationResults[] = [
                    'type' => 'success',
                    'message' => "No se encontraron problemas de integridad en las entradas."
                ];
                log_validation("No se encontraron problemas de integridad en las entradas");
            }

            if ($missingDataCount > 0) {
                $validationResults[] = [
                    'type' => 'warning',
                    'message' => "Advertencia: $missingDataCount entradas no tienen datos de estaciones."
                ];
                log_validation("ADVERTENCIA: $missingDataCount entradas no tienen datos de estaciones");
            }

            // Análisis de calidad de datos
            $totalListeners = 0;
            $minListeners = PHP_INT_MAX;
            $maxListeners = 0;
            $abnormalEntries = 0;

            foreach ($history['listeners'] as $entry) {
                $listeners = $entry['count'] ?? 0;
                $totalListeners += $listeners;
                
                if ($listeners < $minListeners) {
                    $minListeners = $listeners;
                }
                
                if ($listeners > $maxListeners) {
                    $maxListeners = $listeners;
                }
                
                // Detectar valores anormales (uso simple: más de 3 veces el promedio)
                if ($entryCount > 10 && $listeners > ($totalListeners / $entryCount) * 3) {
                    $abnormalEntries++;
                }
            }

            $avgListeners = $entryCount > 0 ? $totalListeners / $entryCount : 0;
            
            $listenerStats = [
                'average' => round($avgListeners, 1),
                'minimum' => $minListeners,
                'maximum' => $maxListeners,
                'abnormalCount' => $abnormalEntries
            ];

            if ($abnormalEntries > 0) {
                $validationResults[] = [
                    'type' => 'warning',
                    'message' => "$abnormalEntries entradas tienen valores anormalmente altos de oyentes"
                ];
                log_validation("ADVERTENCIA: $abnormalEntries entradas tienen valores anormalmente altos de oyentes");
            }

            // Conclusión general
            if ($errorCount === 0 && $missingDataCount === 0) {
                $validationSummary = "El archivo de historial parece estar en buen estado.";
                log_validation("CONCLUSIÓN: El archivo de historial está en buen estado");
            } else {
                $validationSummary = "Se detectaron algunos problemas con el archivo de historial.";
                log_validation("CONCLUSIÓN: Se detectaron problemas con el archivo de historial");
            }
        }
    }
}

log_validation("Validación completada");
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Validación de Historial</title>
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        .validation-header {
            background-color: #f8f9fa;
            border-bottom: 1px solid #dee2e6;
            padding: 1.5rem 0;
            margin-bottom: 2rem;
        }
        .result-card {
            margin-bottom: 1.5rem;
        }
        .stats-icon {
            font-size: 2.5rem;
            margin-bottom: 1rem;
            color: #6c757d;
        }
    </style>
</head>
<body>
    <header class="validation-header">
        <div class="container">
            <div class="d-flex align-items-center">
                <i class="fas fa-check-circle me-3 fs-1 text-primary"></i>
                <div>
                    <h1 class="mb-0">Validación de Historial</h1>
                    <p class="text-muted mb-0">Herramienta para validar la integridad del archivo de historial de estadísticas</p>
                </div>
            </div>
        </div>
    </header>

    <main class="container pb-5">
        <!-- Resumen de Validación -->
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h2 class="h5 mb-0"><i class="fas fa-info-circle me-2"></i> Resumen de Validación</h2>
            </div>
            <div class="card-body">
                <?php if ($hasErrors): ?>
                    <div class="alert alert-danger d-flex align-items-center" role="alert">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <div><?php echo $validationSummary; ?></div>
                    </div>
                <?php else: ?>
                    <div class="alert alert-success d-flex align-items-center" role="alert">
                        <i class="fas fa-check-circle me-2"></i>
                        <div><?php echo $validationSummary; ?></div>
                    </div>
                <?php endif; ?>
                
                <?php if (!empty($generalStats)): ?>
                    <h3 class="h5 mt-4 mb-3">Estadísticas Generales</h3>
                    <div class="row">
                        <div class="col-md-3 col-sm-6 mb-3 mb-md-0 text-center">
                            <div class="stats-icon"><i class="fas fa-list"></i></div>
                            <h4 class="h6 mb-2">Entradas</h4>
                            <p class="h3 mb-0"><?php echo $generalStats['entryCount']; ?></p>
                        </div>
                        <div class="col-md-3 col-sm-6 mb-3 mb-md-0 text-center">
                            <div class="stats-icon"><i class="fas fa-broadcast-tower"></i></div>
                            <h4 class="h6 mb-2">Estaciones</h4>
                            <p class="h3 mb-0"><?php echo $generalStats['stationCount']; ?></p>
                        </div>
                        <div class="col-md-3 col-sm-6 mb-3 mb-md-0 text-center">
                            <div class="stats-icon"><i class="fas fa-calendar-alt"></i></div>
                            <h4 class="h6 mb-2">Primera Entrada</h4>
                            <p class="mb-0"><?php echo $generalStats['firstEntry']; ?></p>
                        </div>
                        <div class="col-md-3 col-sm-6 text-center">
                            <div class="stats-icon"><i class="fas fa-calendar-check"></i></div>
                            <h4 class="h6 mb-2">Última Entrada</h4>
                            <p class="mb-0"><?php echo $generalStats['lastEntry']; ?></p>
                        </div>
                    </div>
                <?php endif; ?>
            </div>
        </div>

        <!-- Resultados de la validación -->
        <div class="card mb-4">
            <div class="card-header bg-primary text-white">
                <h2 class="h5 mb-0"><i class="fas fa-tasks me-2"></i> Resultados de Validación</h2>
            </div>
            <div class="card-body">
                <?php if (empty($validationResults)): ?>
                    <div class="alert alert-info">No se ha podido realizar la validación.</div>
                <?php else: ?>
                    <?php foreach ($validationResults as $result): ?>
                        <?php 
                        $alertClass = 'alert-info';
                        $iconClass = 'fa-info-circle';
                        
                        if ($result['type'] === 'error') {
                            $alertClass = 'alert-danger';
                            $iconClass = 'fa-exclamation-circle';
                        } elseif ($result['type'] === 'warning') {
                            $alertClass = 'alert-warning';
                            $iconClass = 'fa-exclamation-triangle';
                        } elseif ($result['type'] === 'success') {
                            $alertClass = 'alert-success';
                            $iconClass = 'fa-check-circle';
                        }
                        ?>
                        
                        <div class="alert <?php echo $alertClass; ?> d-flex align-items-center" role="alert">
                            <i class="fas <?php echo $iconClass; ?> me-2"></i>
                            <div><?php echo $result['message']; ?></div>
                        </div>
                        
                        <?php if (isset($result['details']) && !empty($result['details'])): ?>
                            <div class="mt-3 mb-4">
                                <h5 class="h6">Detalles de los problemas encontrados:</h5>
                                <div class="table-responsive">
                                    <table class="table table-sm table-bordered table-hover">
                                        <thead class="table-light">
                                            <tr>
                                                <th>#</th>
                                                <th>Fecha</th>
                                                <th>Problemas</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <?php foreach ($result['details'] as $issue): ?>
                                                <tr>
                                                    <td><?php echo $issue['index']; ?></td>
                                                    <td><?php echo $issue['date']; ?></td>
                                                    <td>
                                                        <ul class="mb-0 ps-3">
                                                            <?php foreach ($issue['issues'] as $problem): ?>
                                                                <li><?php echo $problem; ?></li>
                                                            <?php endforeach; ?>
                                                        </ul>
                                                    </td>
                                                </tr>
                                            <?php endforeach; ?>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        <?php endif; ?>
                    <?php endforeach; ?>
                <?php endif; ?>
            </div>
        </div>

        <!-- Estadísticas de Oyentes -->
        <?php if (!empty($listenerStats)): ?>
            <div class="card mb-4">
                <div class="card-header bg-primary text-white">
                    <h2 class="h5 mb-0"><i class="fas fa-headphones me-2"></i> Estadísticas de Oyentes</h2>
                </div>
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body text-center">
                                    <i class="fas fa-chart-line stats-icon"></i>
                                    <h3 class="h5">Promedio</h3>
                                    <p class="display-6"><?php echo $listenerStats['average']; ?></p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body text-center">
                                    <i class="fas fa-arrow-down stats-icon"></i>
                                    <h3 class="h5">Mínimo</h3>
                                    <p class="display-6"><?php echo $listenerStats['minimum']; ?></p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body text-center">
                                    <i class="fas fa-arrow-up stats-icon"></i>
                                    <h3 class="h5">Máximo</h3>
                                    <p class="display-6"><?php echo $listenerStats['maximum']; ?></p>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="card h-100">
                                <div class="card-body text-center">
                                    <i class="fas fa-exclamation-triangle stats-icon"></i>
                                    <h3 class="h5">Anormales</h3>
                                    <p class="display-6"><?php echo $listenerStats['abnormalCount']; ?></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        <?php endif; ?>
    </main>

    <footer class="bg-light py-3 mt-5">
        <div class="container text-center text-muted">
            <p class="mb-0">Validación de Historial &copy; <?php echo date('Y'); ?></p>
        </div>
    </footer>

    <!-- Bootstrap Bundle with Popper -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        // Cargar tema guardado
            const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            // Selecciona el elemento al que deseas agregar el atributo
            const htmlElement = document.querySelector('html');

            // Agrega el atributo data-bs-theme con el valor "dark"
            htmlElement.setAttribute('data-bs-theme', 'dark');
        }
    </script>
</body>
</html>
