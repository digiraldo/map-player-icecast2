<?php
/**
 * API para exportar estadísticas a diferentes formatos
 * 
 * Este script genera archivos de exportación (Excel, CSV) a partir
 * de los datos de estadísticas almacenados
 */

// Permitir CORS para peticiones AJAX
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");

// Definir constantes
define('DATA_PATH', '../../data/');
define('STATS_DB', DATA_PATH . 'stats.db');

// Verificar el formato solicitado
$format = isset($_GET['format']) ? $_GET['format'] : 'excel';
$range = isset($_GET['range']) ? $_GET['range'] : 'week';
$station = isset($_GET['station']) ? $_GET['station'] : 'all';
$start = isset($_GET['start']) ? $_GET['start'] : null;
$end = isset($_GET['end']) ? $_GET['end'] : null;

// Establecer headers según el formato
switch ($format) {
    case 'excel':
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment;filename="estadisticas_oyentes.xlsx"');
        break;
    case 'csv':
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment;filename="estadisticas_oyentes.csv"');
        break;
    default:
        // Formato no soportado
        header('Content-Type: application/json');
        echo json_encode(['error' => true, 'message' => 'Formato no soportado']);
        exit;
}

try {
    // Conectar a la base de datos
    if (!file_exists(STATS_DB)) {
        throw new Exception("Base de datos de estadísticas no encontrada");
    }
    
    $pdo = new PDO('sqlite:' . STATS_DB);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Calcular fechas de inicio y fin según el rango
    $endDate = time();
    $startDate = calculateStartDate($range, $start, $end);
    
    // Consulta base para obtener datos
    $query = "
        SELECT 
            datetime(timestamp, 'unixepoch') as fecha_hora,
            station_name as estacion,
            listeners as oyentes,
            peak_listeners as pico_maximo,
            avg_time as duracion_promedio
        FROM 
            listener_stats 
        WHERE 
            timestamp BETWEEN :start AND :end
    ";
    
    // Filtrar por estación si es necesario
    if ($station !== 'all') {
        $query .= " AND station_id = :station";
    }
    
    $query .= " ORDER BY timestamp DESC";
    
    // Ejecutar la consulta
    $stmt = $pdo->prepare($query);
    $params = [':start' => $startDate, ':end' => $endDate];
    
    if ($station !== 'all') {
        $params[':station'] = $station;
    }
    
    $stmt->execute($params);
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Generar el archivo según el formato
    switch ($format) {
        case 'excel':
            exportToExcel($data);
            break;
        case 'csv':
            exportToCSV($data);
            break;
    }
} catch (Exception $e) {
    // En caso de error, devolver JSON
    header('Content-Type: application/json');
    echo json_encode(['error' => true, 'message' => $e->getMessage()]);
}

/**
 * Exporta los datos a formato Excel
 * @param array $data Datos a exportar
 */
function exportToExcel($data) {
    // Utilizar PhpSpreadsheet para generar el Excel
    // Esta es una implementación básica para demostración
    // En una implementación real, debería utilizarse una biblioteca como PhpSpreadsheet
    
    // Cabeceras para forzar la descarga
    header('Content-Disposition: attachment;filename="estadisticas_oyentes.xlsx"');
    
    // En este ejemplo, generamos un CSV como alternativa simple
    exportToCSV($data);
}

/**
 * Exporta los datos a formato CSV
 * @param array $data Datos a exportar
 */
function exportToCSV($data) {
    if (empty($data)) {
        echo "No hay datos para exportar";
        return;
    }
    
    // Abrir un flujo de salida
    $output = fopen('php://output', 'w');
    
    // Escribir la cabecera UTF-8 BOM para Excel
    fputs($output, $bom = (chr(0xEF) . chr(0xBB) . chr(0xBF)));
    
    // Escribir las cabeceras
    fputcsv($output, array_keys($data[0]));
    
    // Escribir los datos
    foreach ($data as $row) {
        fputcsv($output, $row);
    }
    
    fclose($output);
}

/**
 * Calcula la fecha de inicio según el rango seleccionado
 * @param string $range Rango seleccionado
 * @param string $customStart Fecha de inicio personalizada
 * @param string $customEnd Fecha de fin personalizada
 * @return int Timestamp para la fecha de inicio
 */
function calculateStartDate($range, $customStart, $customEnd) {
    switch ($range) {
        case 'day':
            return strtotime('today');
        case 'week':
            return strtotime('-7 days');
        case 'month':
            return strtotime('-30 days');
        case 'custom':
            if ($customStart) {
                return strtotime($customStart);
            }
            return strtotime('-7 days');
        default:
            return strtotime('-7 days');
    }
}
