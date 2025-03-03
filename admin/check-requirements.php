<?php
/**
 * Script para verificar los requisitos del sistema
 * Comprueba que todas las extensiones necesarias estén habilitadas
 */

// Definir requisitos
$requirements = [
    'extensions' => [
        'PDO' => [
            'required' => true,
            'installed' => extension_loaded('pdo'),
            'message' => 'La extensión PDO es necesaria para las conexiones a bases de datos'
        ],
        'PDO_SQLite' => [
            'required' => true,
            'installed' => extension_loaded('pdo_sqlite'),
            'message' => 'La extensión PDO_SQLite es necesaria para el almacenamiento de estadísticas'
        ],
        'JSON' => [
            'required' => true,
            'installed' => extension_loaded('json'),
            'message' => 'La extensión JSON es necesaria para el procesamiento de datos'
        ],
        'fileinfo' => [
            'required' => false,
            'installed' => extension_loaded('fileinfo'),
            'message' => 'La extensión fileinfo es recomendada para la manipulación de archivos'
        ],
        'curl' => [
            'required' => true,
            'installed' => extension_loaded('curl'),
            'message' => 'La extensión CURL es necesaria para las conexiones externas'
        ]
    ],
    'php_version' => [
        'required' => '7.3.0',
        'installed' => PHP_VERSION,
        'status' => version_compare(PHP_VERSION, '7.3.0', '>=')
    ],
    'writable_dirs' => [
        'data' => [
            'path' => '../data',
            'status' => is_writable('../data'),
            'message' => 'El directorio /data debe tener permisos de escritura'
        ],
        'data_stats' => [
            'path' => '../data/stats',
            'status' => is_dir('../data/stats') ? is_writable('../data/stats') : is_writable('../data'),
            'message' => 'El directorio /data/stats debe tener permisos de escritura'
        ]
    ]
];

// Determinar el formato de salida (HTML o JSON)
$format = isset($_GET['format']) ? $_GET['format'] : 'html';

// Calcular estado general
$allRequirementsMet = true;
foreach ($requirements['extensions'] as $ext) {
    if ($ext['required'] && !$ext['installed']) {
        $allRequirementsMet = false;
        break;
    }
}

if (!$requirements['php_version']['status']) {
    $allRequirementsMet = false;
}

foreach ($requirements['writable_dirs'] as $dir) {
    if (!$dir['status']) {
        $allRequirementsMet = false;
        break;
    }
}

// Responder según el formato
if ($format === 'json') {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => $allRequirementsMet ? 'ok' : 'error',
        'requirements' => $requirements
    ]);
    exit;
}

// Salida en formato HTML
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificación de Requisitos - Map Player Icecast2</title>
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { padding: 20px; }
        .status-icon { font-size: 1.2rem; }
        .status-ok { color: #198754; }
        .status-warning { color: #ffc107; }
        .status-error { color: #dc3545; }
    </style>
</head>
<body>
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card shadow">
                    <div class="card-header bg-primary text-white">
                        <h4 class="mb-0"><i class="fas fa-clipboard-check me-2"></i>Verificación de Requisitos</h4>
                    </div>
                    
                    <div class="card-body">
                        <div class="alert <?php echo $allRequirementsMet ? 'alert-success' : 'alert-danger'; ?> mb-4">
                            <i class="fas <?php echo $allRequirementsMet ? 'fa-check-circle' : 'fa-exclamation-triangle'; ?> me-2"></i>
                            <?php echo $allRequirementsMet ? 'Todos los requisitos se cumplen.' : 'No se cumplen todos los requisitos necesarios.'; ?>
                        </div>
                        
                        <h5 class="mb-3">Versión de PHP</h5>
                        <div class="mb-4">
                            <div class="d-flex align-items-center mb-2">
                                <div class="me-2">
                                    <i class="fas <?php echo $requirements['php_version']['status'] ? 'fa-check-circle status-ok' : 'fa-times-circle status-error'; ?> status-icon"></i>
                                </div>
                                <div>
                                    <strong>PHP <?php echo $requirements['php_version']['required']; ?>+</strong>
                                    <span class="text-muted ms-2">(Actual: <?php echo $requirements['php_version']['installed']; ?>)</span>
                                </div>
                            </div>
                        </div>
                        
                        <h5 class="mb-3">Extensiones PHP</h5>
                        <div class="list-group mb-4">
                            <?php foreach ($requirements['extensions'] as $name => $ext): ?>
                            <div class="list-group-item">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <i class="fas <?php echo $ext['installed'] ? 'fa-check-circle status-ok' : ($ext['required'] ? 'fa-times-circle status-error' : 'fa-exclamation-circle status-warning'); ?> status-icon me-2"></i>
                                        <strong><?php echo $name; ?></strong>
                                        <?php if ($ext['required']): ?>
                                        <span class="badge bg-danger ms-2">Requerido</span>
                                        <?php else: ?>
                                        <span class="badge bg-secondary ms-2">Opcional</span>
                                        <?php endif; ?>
                                    </div>
                                    <div>
                                        <?php if ($ext['installed']): ?>
                                        <span class="badge bg-success">Instalado</span>
                                        <?php else: ?>
                                        <span class="badge bg-danger">No instalado</span>
                                        <?php endif; ?>
                                    </div>
                                </div>
                                <div class="mt-1 small text-muted"><?php echo $ext['message']; ?></div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                        
                        <h5 class="mb-3">Directorios con permisos de escritura</h5>
                        <div class="list-group mb-4">
                            <?php foreach ($requirements['writable_dirs'] as $name => $dir): ?>
                            <div class="list-group-item">
                                <div class="d-flex justify-content-between align-items-center">
                                    <div>
                                        <i class="fas <?php echo $dir['status'] ? 'fa-check-circle status-ok' : 'fa-times-circle status-error'; ?> status-icon me-2"></i>
                                        <strong><?php echo $dir['path']; ?></strong>
                                    </div>
                                    <div>
                                        <?php if ($dir['status']): ?>
                                        <span class="badge bg-success">Escritura permitida</span>
                                        <?php else: ?>
                                        <span class="badge bg-danger">Sin permisos de escritura</span>
                                        <?php endif; ?>
                                    </div>
                                </div>
                                <div class="mt-1 small text-muted"><?php echo $dir['message']; ?></div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                        
                        <?php if (!$allRequirementsMet): ?>
                        <div class="alert alert-info" role="alert">
                            <h6 class="alert-heading"><i class="fas fa-info-circle me-2"></i>¿Cómo solucionar los problemas?</h6>
                            <hr>
                            <ul class="mb-0">
                                <?php if (!$requirements['extensions']['PDO_SQLite']['installed']): ?>
                                <li>Para habilitar <strong>PDO_SQLite</strong>: Edite su archivo php.ini y descomente o añada <code>extension=pdo_sqlite</code>.</li>
                                <?php endif; ?>
                                <?php if (!$requirements['extensions']['JSON']['installed']): ?>
                                <li>Para habilitar <strong>JSON</strong>: Edite su archivo php.ini y descomente o añada <code>extension=json</code>.</li>
                                <?php endif; ?>
                                <?php if (!$requirements['extensions']['curl']['installed']): ?>
                                <li>Para habilitar <strong>CURL</strong>: Edite su archivo php.ini y descomente o añada <code>extension=curl</code>.</li>
                                <?php endif; ?>
                                <?php foreach ($requirements['writable_dirs'] as $dir): ?>
                                <?php if (!$dir['status']): ?>
                                <li>Para los permisos del directorio <strong><?php echo $dir['path']; ?></strong>: Configure los permisos a 755 o 775 en sistemas Linux/Unix, o asegúrese de que el usuario del servidor web tiene acceso de escritura.</li>
                                <?php endif; ?>
                                <?php endforeach; ?>
                            </ul>
                            <hr>
                            <p class="mb-0">Después de realizar los cambios, reinicie su servidor web y vuelva a verificar esta página.</p>
                        </div>
                        <?php endif; ?>
                        
                    </div>
                    
                    <div class="card-footer">
                        <a href="index.html" class="btn btn-primary"><i class="fas fa-arrow-left me-2"></i>Volver al Panel</a>
                        <button class="btn btn-success float-end" onclick="location.reload()"><i class="fas fa-sync-alt me-2"></i>Volver a verificar</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
