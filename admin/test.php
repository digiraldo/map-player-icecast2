<?php
// Archivo de diagnóstico para probar la carga de módulos
session_start();
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h2>Test de carga de módulos</h2>";

// Probar si podemos incluir los archivos requeridos
echo "<p>Probando inclusión de archivos:</p>";
$files = [
    'includes/config.php',
    'includes/functions.php',
    'includes/auth.php',
    'modules/dashboard.php',
    'modules/stations.php'
];

foreach ($files as $file) {
    echo "- $file: ";
    if (file_exists($file)) {
        echo "<span style='color:green'>EXISTE</span><br>";
    } else {
        echo "<span style='color:red'>NO EXISTE</span><br>";
    }
}

// Intentar cargar el módulo stations.php
echo "<p>Intentando cargar módulo stations.php:</p>";
$moduleFile = "modules/stations.php";
if (file_exists($moduleFile)) {
    echo "<div style='border:1px solid #ccc; padding:10px;'>";
    try {
        include $moduleFile;
        echo "<p style='color:green'>El módulo se cargó correctamente.</p>";
    } catch (Exception $e) {
        echo "<p style='color:red'>Error al cargar el módulo: " . $e->getMessage() . "</p>";
    }
    echo "</div>";
} else {
    echo "<p style='color:red'>El archivo del módulo no existe.</p>";
}

echo "<p><a href='index.php?module=stations'>Intentar cargar el módulo stations</a></p>";
?>
