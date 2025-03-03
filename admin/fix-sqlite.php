<?php
/**
 * Script para diagnosticar y resolver problemas con la extensión PDO_SQLite
 */

// Función para verificar si la extensión está habilitada
function checkPDOSQLite() {
    return extension_loaded('pdo_sqlite');
}

// Función para obtener la ubicación del archivo php.ini
function getPHPIniPath() {
    return php_ini_loaded_file();
}

// Función para intentar habilitar la extensión en tiempo de ejecución
function enablePDOSQLite() {
    try {
        // Intentar cargar la extensión dinámicamente (solo funciona si el archivo .so/.dll está disponible)
        if (function_exists('dl')) {
            @dl('pdo_sqlite');
            return checkPDOSQLite();
        }
        return false;
    } catch (Exception $e) {
        return false;
    }
}

// Función para sugerir la instalación de la extensión
function getSuggestions() {
    $os = PHP_OS;
    $suggestions = [];
    
    // Sugerencias generales
    $suggestions[] = "1. Asegúrese de que la extensión PDO_SQLite esté instalada en su servidor PHP.";
    
    // Sugerencias según el sistema operativo
    if (strtoupper(substr($os, 0, 3)) === 'WIN') {
        // Windows
        $suggestions[] = "2. En Windows, edite su archivo php.ini y descomente la línea: extension=pdo_sqlite";
        $suggestions[] = "3. Si usa XAMPP/Laragon, puede activar la extensión desde el panel de control.";
        $suggestions[] = "4. Después de modificar php.ini, reinicie su servidor web (Apache, Nginx, etc).";
    } else {
        // Linux/Unix/MacOS
        $suggestions[] = "2. En Linux/Unix, instale la extensión con: sudo apt-get install php-sqlite3 (Debian/Ubuntu) o sudo yum install php-pdo_sqlite (CentOS/RHEL)";
        $suggestions[] = "3. En macOS con Homebrew: brew install php@8.0 y asegúrese de que sqlite esté habilitado.";
        $suggestions[] = "4. Después de instalar, reinicie su servidor web con: sudo service apache2 restart (o nginx, php-fpm según corresponda).";
    }
    
    return $suggestions;
}

// Verificar si existe /data y tiene permisos correctos
function checkDataDirectory() {
    $dataPath = '../../data';
    $results = [];
    
    // Verificar si existe el directorio
    if (!file_exists($dataPath)) {
        $results['exists'] = false;
        try {
            // Intentar crear el directorio
            if (mkdir($dataPath, 0755, true)) {
                $results['created'] = true;
            } else {
                $results['created'] = false;
            }
        } catch (Exception $e) {
            $results['created'] = false;
            $results['error'] = $e->getMessage();
        }
    } else {
        $results['exists'] = true;
    }
    
    // Verificar permisos de escritura
    $results['writable'] = is_writable($dataPath);
    
    return $results;
}

// Verificar si la base de datos SQLite existe y es válida
function checkSQLiteDatabase() {
    $dbFile = '../../data/stats.db';
    $results = [
        'exists' => file_exists($dbFile),
        'valid' => false,
        'tables' => []
    ];
    
    // Si la base de datos existe, intentar abrirla y verificar su estructura
    if ($results['exists']) {
        try {
            // Solo intentar esto si PDO_SQLite está habilitado
            if (extension_loaded('pdo_sqlite')) {
                $pdo = new PDO('sqlite:' . $dbFile);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                // Verificar si existe la tabla de estadísticas
                $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table' AND name='listener_stats'");
                $results['valid'] = ($stmt->fetchColumn() !== false);
                
                // Obtener la lista de tablas
                $tables = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'")->fetchAll(PDO::FETCH_COLUMN);
                $results['tables'] = $tables;
                
                // Contar registros si la tabla existe
                if ($results['valid']) {
                    $count = $pdo->query("SELECT COUNT(*) FROM listener_stats")->fetchColumn();
                    $results['record_count'] = (int)$count;
                }
            }
        } catch (Exception $e) {
            $results['error'] = $e->getMessage();
        }
    }
    
    return $results;
}

// Iniciar el proceso de diagnóstico
$pdoSQLiteEnabled = checkPDOSQLite();
$phpIniPath = getPHPIniPath();

// Si PDO_SQLite no está habilitado, intentar habilitarlo
if (!$pdoSQLiteEnabled) {
    $enableAttempt = enablePDOSQLite();
    $pdoSQLiteEnabled = checkPDOSQLite(); // Verificar de nuevo
}

// Verificar el directorio de datos
$dataDirectory = checkDataDirectory();

// Verificar la base de datos
$database = $pdoSQLiteEnabled ? checkSQLiteDatabase() : ['error' => 'No se puede verificar la base de datos sin PDO_SQLite'];

// Obtener sugerencias
$suggestions = getSuggestions();
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diagnóstico de SQLite - Map Player Icecast2</title>
    <!-- Bootstrap CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body { padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card shadow">
                    <div class="card-header bg-primary text-white">
                        <h4 class="mb-0"><i class="fas fa-database me-2"></i>Diagnóstico de SQLite</h4>
                    </div>
                    
                    <div class="card-body">
                        <!-- Estado de PDO SQLite -->
                        <div class="alert <?php echo $pdoSQLiteEnabled ? 'alert-success' : 'alert-danger'; ?> mb-4">
                            <i class="fas <?php echo $pdoSQLiteEnabled ? 'fa-check-circle' : 'fa-exclamation-triangle'; ?> me-2"></i>
                            <?php echo $pdoSQLiteEnabled ? 'La extensión PDO_SQLite está correctamente habilitada.' : 'La extensión PDO_SQLite NO está habilitada.'; ?>
                            <?php if (!$pdoSQLiteEnabled): ?>
                            <div class="mt-2">
                                Este es el problema que impide que funcione el módulo de estadísticas.
                            </div>
                            <?php endif; ?>
                        </div>
                        
                        <!-- Información de PHP -->
                        <div class="card mb-4">
                            <div class="card-header bg-light">
                                <h5 class="mb-0">Información de PHP</h5>
                            </div>
                            <div class="card-body">
                                <p><strong>Versión de PHP:</strong> <?php echo PHP_VERSION; ?></p>
                                <p><strong>Archivo de configuración (php.ini):</strong> <?php echo $phpIniPath ? $phpIniPath : 'No se puede determinar'; ?></p>
                                <p><strong>Sistema operativo:</strong> <?php echo PHP_OS; ?></p>
                                <p><strong>Extensiones cargadas:</strong> <?php echo implode(', ', get_loaded_extensions()); ?></p>
                                <p><a href="phpinfo.php" target="_blank" class="btn btn-sm btn-outline-info">Ver PHP Info completo</a></p>
                            </div>
                        </div>
                        
                        <!-- Directorio de datos -->
                        <div class="card mb-4">
                            <div class="card-header bg-light">
                                <h5 class="mb-0">Directorio de datos</h5>
                            </div>
                            <div class="card-body">
                                <?php if (isset($dataDirectory['exists']) && $dataDirectory['exists']): ?>
                                <div class="alert alert-success">
                                    <i class="fas fa-check-circle me-2"></i>
                                    El directorio de datos existe.
                                </div>
                                <?php else: ?>
                                <div class="alert alert-warning">
                                    <i class="fas fa-exclamation-triangle me-2"></i>
                                    El directorio de datos no existe.
                                    <?php if (isset($dataDirectory['created'])): ?>
                                    <?php if ($dataDirectory['created']): ?>
                                    <div class="mt-2">Se ha creado automáticamente.</div>
                                    <?php else: ?>
                                    <div class="mt-2">No se pudo crear automáticamente. Error: <?php echo $dataDirectory['error'] ?? 'Desconocido'; ?></div>
                                    <?php endif; ?>
                                    <?php endif; ?>
                                </div>
                                <?php endif; ?>
                                
                                <?php if (isset($dataDirectory['writable'])): ?>
                                <div class="alert <?php echo $dataDirectory['writable'] ? 'alert-success' : 'alert-danger'; ?>">
                                    <i class="fas <?php echo $dataDirectory['writable'] ? 'fa-check-circle' : 'fa-times-circle'; ?> me-2"></i>
                                    <?php echo $dataDirectory['writable'] ? 'El directorio tiene permisos de escritura.' : 'El directorio NO tiene permisos de escritura.'; ?>
                                </div>
                                <?php endif; ?>
                            </div>
                        </div>
                        
                        <!-- Base de datos SQLite -->
                        <div class="card mb-4">
                            <div class="card-header bg-light">
                                <h5 class="mb-0">Base de datos SQLite</h5>
                            </div>
                            <div class="card-body">
                                <?php if (!$pdoSQLiteEnabled): ?>
                                <div class="alert alert-warning">
                                    <i class="fas fa-exclamation-triangle me-2"></i>
                                    No se puede verificar la base de datos porque la extensión PDO_SQLite no está habilitada.
                                </div>
                                <?php else: ?>
                                <?php if (isset($database['exists']) && $database['exists']): ?>
                                <div class="alert alert-success">
                                    <i class="fas fa-check-circle me-2"></i>
                                    El archivo de base de datos existe.
                                </div>
                                
                                <?php if (isset($database['valid'])): ?>
                                <div class="alert <?php echo $database['valid'] ? 'alert-success' : 'alert-warning'; ?>">
                                    <i class="fas <?php echo $database['valid'] ? 'fa-check-circle' : 'fa-exclamation-triangle'; ?> me-2"></i>
                                    <?php echo $database['valid'] ? 'La estructura de la base de datos es correcta.' : 'La estructura de la base de datos NO es correcta.'; ?>
                                </div>
                                <?php endif; ?>
                                
                                <?php if (isset($database['tables']) && count($database['tables']) > 0): ?>
                                <p><strong>Tablas encontradas:</strong> <?php echo implode(', ', $database['tables']); ?></p>
                                <?php endif; ?>
                                
                                <?php if (isset($database['record_count'])): ?>
                                <p><strong>Registros de estadísticas:</strong> <?php echo $database['record_count']; ?></p>
                                <?php endif; ?>
                                
                                <?php else: ?>
                                <div class="alert alert-warning">
                                    <i class="fas fa-exclamation-triangle me-2"></i>
                                    El archivo de base de datos no existe.
                                </div>
                                <?php endif; ?>
                                
                                <?php if (isset($database['error'])): ?>
                                <div class="alert alert-danger">
                                    <i class="fas fa-times-circle me-2"></i>
                                    Error al verificar la base de datos: <?php echo $database['error']; ?>
                                </div>
                                <?php endif; ?>
                                <?php endif; ?>
                                
                                <a href="api/create-data-structure.php?key=f8b4j9v2m3n7k8l1" class="btn btn-primary mt-2">
                                    <i class="fas fa-cogs me-2"></i>Crear/reparar estructura de datos
                                </a>
                            </div>
                        </div>
                        
                        <!-- Sugerencias para resolver el problema -->
                        <?php if (!$pdoSQLiteEnabled): ?>
                        <div class="card mb-4">
                            <div class="card-header bg-light">
                                <h5 class="mb-0">¿Cómo habilitar PDO_SQLite?</h5>
                            </div>
                            <div class="card-body">
                                <ul class="list-group">
                                    <?php foreach ($suggestions as $suggestion): ?>
                                    <li class="list-group-item"><?php echo $suggestion; ?></li>
                                    <?php endforeach; ?>
                                </ul>
                            </div>
                        </div>
                        <?php endif; ?>
                    </div>
                    
                    <div class="card-footer d-flex justify-content-between">
                        <a href="index.html" class="btn btn-secondary">
                            <i class="fas fa-arrow-left me-1"></i> Volver al panel
                        </a>
                        <button onclick="location.reload()" class="btn btn-primary">
                            <i class="fas fa-sync-alt me-1"></i> Actualizar diagnóstico
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
