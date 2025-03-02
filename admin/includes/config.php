<?php
/**
 * Configuración general para el panel de administración
 */

// Rutas principales
define('BASE_PATH', dirname(dirname(__DIR__)));
define('ADMIN_PATH', dirname(__DIR__));
define('DATA_PATH', BASE_PATH . '/data');
define('BACKUPS_PATH', BASE_PATH . '/backups');

// Asegurarse de que exista el directorio de backups
if (!file_exists(BACKUPS_PATH)) {
    mkdir(BACKUPS_PATH, 0755, true);
}

// Archivos de datos
define('STATIONS_FILE', DATA_PATH . '/stations.json');
define('CONFIG_FILE', DATA_PATH . '/config.json');

// Configuración de la aplicación
$config = [
    'app_name' => 'Map Player Icecast2',
    'admin_title' => 'Panel de Administración',
    'version' => '1.0.0',
    'debug' => true,
    'session_lifetime' => 1800, // 30 minutos
    'date_format' => 'd/m/Y H:i:s',
];

// Control de errores
if ($config['debug']) {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Zona horaria
date_default_timezone_set('America/Bogota');
