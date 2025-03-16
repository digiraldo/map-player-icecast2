<?php
/**
 * API para guardar la configuración de estadísticas
 */

// Permitir CORS para peticiones AJAX
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Verificar que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido. Use POST para enviar datos.'
    ]);
    exit;
}

// Ruta al archivo de configuración
define('CONFIG_PATH', '../../data/');
define('STATS_CONFIG_FILE', CONFIG_PATH . 'stats-config.json');

// Asegurar que el directorio de configuración existe
if (!file_exists(CONFIG_PATH)) {
    if (!mkdir(CONFIG_PATH, 0755, true)) {
        echo json_encode([
            'success' => false,
            'message' => 'No se pudo crear el directorio de configuración'
        ]);
        exit;
    }
}

// Obtener los datos enviados
$postData = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al decodificar los datos JSON: ' . json_last_error_msg()
    ]);
    exit;
}

// Validar datos requeridos
$requiredFields = ['enableStatsCollection', 'collectionInterval', 'dataRetention'];
foreach ($requiredFields as $field) {
    if (!isset($postData[$field])) {
        echo json_encode([
            'success' => false,
            'message' => "Campo requerido faltante: $field"
        ]);
        exit;
    }
}

// Verificación de tipo - convierte valores numéricos a números
$postData['collectionInterval'] = (int)$postData['collectionInterval'];
$postData['dataRetention'] = (int)$postData['dataRetention'];

// Validación de valores
if ($postData['collectionInterval'] <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'El intervalo de recopilación debe ser mayor que 0'
    ]);
    exit;
}

if ($postData['dataRetention'] <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'La retención de datos debe ser mayor que 0'
    ]);
    exit;
}

// Si usa una base de datos, verificar parámetros relacionados
if ($postData['storageMethod'] === 'mysql' || $postData['storageMethod'] === 'sqlite') {
    // Para MySQL necesitamos información adicional
    if ($postData['storageMethod'] === 'mysql') {
        $dbFields = ['dbHost', 'dbUser', 'dbPass', 'dbName'];
        foreach ($dbFields as $field) {
            if (empty($postData[$field])) {
                echo json_encode([
                    'success' => false,
                    'message' => "Campo de base de datos requerido: $field"
                ]);
                exit;
            }
        }
    }
}

// Agregar una marca de tiempo
$postData['updatedAt'] = date('Y-m-d H:i:s');

try {
    // Guardar configuración
    if (file_put_contents(STATS_CONFIG_FILE, json_encode($postData, JSON_PRETTY_PRINT))) {
        // Establece los permisos del archivo
        chmod(STATS_CONFIG_FILE, 0644);
        
        // Verificar si debemos actualizar el cron (para servidores Linux)
        if (function_exists('exec') && PHP_OS !== 'WINNT') {
            updateCronJob($postData);
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Configuración guardada correctamente',
            'data' => $postData
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Error al guardar la configuración'
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al guardar: ' . $e->getMessage()
    ]);
}

/**
 * Actualiza el trabajo de cron según la configuración
 * @param array $config Configuración de estadísticas
 */
function updateCronJob($config) {
    if (!$config['enableStatsCollection']) {
        // Eliminar el cron job si la recopilación está desactivada
        exec('crontab -l | grep -v "collect-stats.php" | crontab -');
        return;
    }
    
    // Obtener la ruta absoluta al script de recolección
    $scriptPath = realpath(__DIR__ . '/../cron/collect-stats.php');
    
    // Crear una expresión de cron basada en el intervalo configurado
    $interval = $config['collectionInterval'];
    $cronExpression = '';
    
    if ($interval < 60) {
        // Cada X minutos
        $cronExpression = "*/$interval * * * *"; // Cada X minutos
    } else {
        // Cada X horas
        $hours = $interval / 60;
        $cronExpression = "0 */$hours * * *"; // A la hora en punto, cada X horas
    }
    
    // Comando de cron
    $cronCmd = "$cronExpression php $scriptPath > /dev/null 2>&1";
    
    // Actualizar el crontab
    exec('crontab -l | grep -v "collect-stats.php" | { cat; echo "' . $cronCmd . '"; } | crontab -');
}
