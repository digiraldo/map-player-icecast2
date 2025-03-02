<nav id="sidebarMenu" class="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
    <div class="position-sticky pt-3">
        <div class="text-center mb-4">
            <img src="../img/radio-ico.ico" alt="Logo" class="img-fluid mb-3" style="max-width: 60px;">
            <h5><strong>Map Player Icecast2</strong></h5>
            <p class="text-muted small">Panel de Administración</p>
        </div>
        
        <ul class="nav flex-column">
            <li class="nav-item">
                <a class="nav-link <?php echo $module === 'dashboard' ? 'active' : ''; ?>" href="./index.php?module=dashboard">
                    <i class="fas fa-tachometer-alt me-2"></i>
                    Dashboard
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link <?php echo $module === 'stations' ? 'active' : ''; ?>" href="./index.php?module=stations">
                    <i class="fas fa-broadcast-tower me-2"></i>
                    Estaciones
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link <?php echo $module === 'config' ? 'active' : ''; ?>" href="index.php?module=config">
                    <i class="fas fa-cogs me-2"></i>
                    Configuración
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link <?php echo $module === 'stats' ? 'active' : ''; ?>" href="index.php?module=stats">
                    <i class="fas fa-chart-bar me-2"></i>
                    Estadísticas
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link <?php echo $module === 'backup' ? 'active' : ''; ?>" href="index.php?module=backup">
                    <i class="fas fa-database me-2"></i>
                    Respaldos
                </a>
            </li>
        </ul>
        
        <hr>
        
        <ul class="nav flex-column mb-2">
            <li class="nav-item">
                <a class="nav-link" href="../index.html" target="_blank">
                    <i class="fas fa-map-marked-alt me-2"></i>
                    Ver Mapa
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link" href="logout.php">
                    <i class="fas fa-sign-out-alt me-2"></i>
                    Cerrar Sesión
                </a>
            </li>
        </ul>
        
        <div class="mt-4 px-3 text-center">
            <div class="small text-muted">
                <p>Usuario: <strong><?php echo htmlspecialchars($_SESSION['user']); ?></strong></p>
                <p>Versión: <?php echo $config['version']; ?></p>
            </div>
        </div>
    </div>
</nav>
