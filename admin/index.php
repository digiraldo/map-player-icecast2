<?php
session_start();
require_once 'includes/config.php';
require_once 'includes/functions.php';
require_once 'includes/auth.php';

// Verificar si el usuario está autenticado
if (!isAuthenticated()) {
    header('Location: login.php');
    exit;
}

// Determinar qué módulo mostrar
$module = isset($_GET['module']) ? $_GET['module'] : 'dashboard';
$validModules = ['dashboard', 'stations', 'station-debug', 'config', 'backup', 'stats'];

// Asegurarse de que el módulo existe
if (!in_array($module, $validModules) || !file_exists("modules/{$module}.php")) {
    // Si no existe, redirigir al dashboard
    $module = 'dashboard';
}

// Título de la página según el módulo
$moduleTitles = [
    'dashboard' => 'Dashboard',
    'stations' => 'Gestión de Estaciones',
    'station-debug' => 'Diagnóstico de Estación',
    'config' => 'Configuración',
    'backup' => 'Respaldos',
    'stats' => 'Estadísticas'
];

$pageTitle = $moduleTitles[$module] ?? 'Panel de Administración';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin - Mapa Emisoras Icecast2 - <?php echo $pageTitle; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/dataTables.bootstrap5.min.css">
    <link rel="stylesheet" href="css/admin.css">
    <link rel="icon" href="../img/radio-ico.ico" type="image/x-icon">
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <!-- Sidebar -->
            <?php include 'includes/sidebar.php'; ?>

            <!-- Contenido principal -->
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                    <h1 class="h2">
                        <?php if ($module === 'dashboard'): ?>
                            <i class="fas fa-tachometer-alt me-2"></i>
                        <?php elseif ($module === 'config'): ?>
                            <i class "fas fa-cogs me-2"></i>
                        <?php elseif ($module === 'stations'): ?>
                            <i class="fas fa-broadcast-tower me-2"></i>
                        <?php elseif ($module === 'stats'): ?>
                            <i class="fas fa-chart-bar me-2"></i>
                        <?php elseif ($module === 'backup'): ?>
                            <i class="fas fa-database me-2"></i>
                        <?php endif; ?>
                        <?php echo $pageTitle; ?>
                    </h1>
                    <div class="btn-toolbar mb-2 mb-md-0">
                        <div class="btn-group me-2">
                            <a href="../index.html" target="_blank" class="btn btn-sm btn-outline-secondary">
                                <i class="fas fa-eye me-1"></i> Ver Mapa
                            </a>
                            <button type="button" class="btn btn-sm btn-outline-secondary" id="refreshDataBtn">
                                <i class="fas fa-sync-alt me-1"></i> Actualizar
                            </button>
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-primary" id="themeToggleBtn">
                            <i class="fas fa-moon me-1" id="themeIcon"></i> <span id="themeText">Modo Oscuro</span>
                        </button>
                    </div>
                </div>

                <?php
                // Cargar el contenido del módulo
                $moduleFile = "modules/$module.php";
                if (file_exists($moduleFile)) {
                    include $moduleFile;
                } else {
                    echo '<div class="alert alert-danger">El módulo solicitado no está disponible</div>';
                }
                ?>
            </main>
        </div>
    </div>
    
    <!-- Toast para notificaciones -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
        <div id="liveToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <i class="fas fa-info-circle me-2"></i>
                <strong class="me-auto" id="toastTitle">Notificación</strong>
                <small id="toastTime">Ahora</small>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body" id="toastMessage">
                Mensaje de notificación
            </div>
        </div>
    </div>
    
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
    <script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap5.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="js/admin.js"></script>

    <?php if ($module === 'dashboard'): ?>
    <script src="js/dashboard.js"></script>
    <?php elseif ($module === 'stations'): ?>
    <script src="js/stations.js"></script>
    <?php elseif ($module === 'config'): ?>
    <script src="js/config.js"></script>
    <?php elseif ($module === 'stats'): ?>
    <script src="js/stats.js"></script>
    <?php endif; ?>
</body>
</html>