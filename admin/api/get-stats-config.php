<?php
/**
 * API para obtener la configuración de estadísticas
 */

// Permitir CORS para peticiones AJAX
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Content-Type: application/json; charset=UTF-8");

// Establecer zona horaria a Colombia
date_default_timezone_set('America/Bogota');

// Definir constantes
define('CONFIG_PATH', '../../data/');
define('STATS_CONFIG_FILE', CONFIG_PATH . 'stats-config.json');
define('HISTORY_FILE', CONFIG_PATH . 'history.json');

/**
 * Obtiene estadísticas sobre los archivos de datos
 * @return array Estadísticas de los archivos
 */
function getStatsInfo() {
    $stats = [
        'totalRecords' => 0,
        'diskUsage' => '0 KB',
        'lastUpdate' => 'Nunca',
        'sinceDate' => 'N/A'
    ];
    
    // Verificar historial
    if (file_exists(HISTORY_FILE)) {
        $history = json_decode(file_get_contents(HISTORY_FILE), true);
        
        // Total de registros
        if (isset($history['listeners']) && is_array($history['listeners'])) {
            $stats['totalRecords'] = count($history['listeners']);
        }
        
        // Última actualización
        if (isset($history['updated'])) {
            $stats['lastUpdate'] = $history['updated'];
        }
        
        // Fecha más antigua (desde cuando hay estadísticas)
        if (isset($history['listeners']) && is_array($history['listeners']) && !empty($history['listeners'])) {
            $oldestRecord = reset($history['listeners']);
            if (isset($oldestRecord['formatted_date'])) {
                $stats['sinceDate'] = $oldestRecord['formatted_date'];
            }
        }
        
        // Tamaño del archivo
        $fileSize = filesize(HISTORY_FILE);
        $stats['diskUsage'] = formatFileSize($fileSize);
    }
    
    return $stats;
}

/**
 * Formatea el tamaño del archivo en unidades legibles
 * @param int $bytes Tamaño en bytes
 * @return string Tamaño formateado
 */
function formatFileSize($bytes) {
    if ($bytes >= 1073741824) {
        return number_format($bytes / 1073741824, 2) . ' GB';
    } elseif ($bytes >= 1048576) {
        return number_format($bytes / 1048576, 2) . ' MB';
    } elseif ($bytes >= 1024) {
        return number_format($bytes / 1024, 2) . ' KB';
    } else {
        return $bytes . ' bytes';
    }
}

// Verificar si existe el archivo de configuración
if (!file_exists(STATS_CONFIG_FILE)) {
    // Si no existe, crear una configuración predeterminada
    $defaultConfig = [
        'enableStatsCollection' => true,
        'collectionInterval' => 15,
        'dataRetention' => 90,
        'aggregateData' => true,
        'defaultDateRange' => 'week',
        'defaultChartType' => 'line',
        'showRealTimeUpdates' => true,
        'colorTheme' => 'default',
        'storageMethod' => 'json',
        'statsFilePath' => '../data/statistics/',
        'enableBackups' => false,
        'createdAt' => date('Y-m-d H:i:s'),
        'updatedAt' => date('Y-m-d H:i:s')
    ];
    
    // Asegurar que existe el directorio
    if (!file_exists(CONFIG_PATH)) {
        if (!mkdir(CONFIG_PATH, 0755, true)) {
            echo json_encode([
                'error' => true,
                'message' => 'No se pudo crear el directorio de configuración'
            ]);
            exit;
        }
    }
    
    // Guardar configuración predeterminada
    file_put_contents(STATS_CONFIG_FILE, json_encode($defaultConfig, JSON_PRETTY_PRINT));
    chmod(STATS_CONFIG_FILE, 0644);
    
    // Devolver la configuración predeterminada junto con las estadísticas
    echo json_encode([
        'error' => false,
        'message' => 'Configuración predeterminada creada',
        'config' => $defaultConfig,
        'stats' => getStatsInfo(),
        'isDefault' => true
    ]);
    exit;
}

// Leer configuración existente
$configData = file_get_contents(STATS_CONFIG_FILE);
$config = json_decode($configData, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        'error' => true,
        'message' => 'Error al decodificar el archivo de configuración: ' . json_last_error_msg()
    ]);
    exit;
}

// Obtener estadísticas adicionales
$stats = getStatsInfo();

// Devolver la configuración junto con las estadísticas
echo json_encode([
    'error' => false,
    'config' => $config,
    'stats' => $stats
]);
