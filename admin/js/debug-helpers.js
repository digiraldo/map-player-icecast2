/**
 * Funciones de ayuda para depuración
 */

/**
 * Verifica la estructura de una tabla para DataTables
 * @param {string} tableId - ID de la tabla a verificar
 * @returns {object} Resultado de la verificación
 */
function checkTableStructure(tableId) {
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`Tabla con ID '${tableId}' no encontrada`);
        return { valid: false, error: 'Tabla no encontrada' };
    }
    
    // Verificar cabeceras
    const headers = table.querySelectorAll('thead th');
    if (headers.length === 0) {
        console.error('La tabla no tiene cabeceras (thead th)');
        return { valid: false, error: 'Cabeceras no encontradas' };
    }
    
    // Verificar cuerpo de tabla
    const tbody = table.querySelector('tbody');
    if (!tbody) {
        console.error('La tabla no tiene cuerpo (tbody)');
        return { valid: false, error: 'Cuerpo de tabla no encontrado' };
    }
    
    // Verificar filas
    const rows = tbody.querySelectorAll('tr');
    if (rows.length === 0) {
        console.warn('La tabla no tiene filas en el cuerpo');
        return { valid: true, warning: 'Sin filas' };
    }
    
    // Verificar celdas en cada fila
    let validStructure = true;
    const headerCount = headers.length;
    
    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td');
        if (cells.length !== headerCount) {
            console.error(`Fila ${i+1}: Número incorrecto de celdas (${cells.length} vs ${headerCount} esperadas)`);
            validStructure = false;
        }
    }
    
    return {
        valid: validStructure,
        headerCount: headerCount,
        rowCount: rows.length
    };
}

/**
 * Corrige la estructura de una tabla para DataTables
 * @param {string} tableId - ID de la tabla a corregir 
 */
function fixTableStructure(tableId) {
    const table = document.getElementById(tableId);
    if (!table) {
        console.error(`Tabla con ID '${tableId}' no encontrada`);
        return;
    }
    
    const headers = table.querySelectorAll('thead th');
    if (headers.length === 0) {
        console.error('No se pueden corregir filas sin cabeceras');
        return;
    }
    
    const headerCount = headers.length;
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach((row, index) => {
        const cells = row.querySelectorAll('td');
        
        if (cells.length === 1 && cells[0].hasAttribute('colspan')) {
            // Esta es una fila de mensaje, no necesita corrección
            return;
        }
        
        if (cells.length < headerCount) {
            // Agregar celdas faltantes
            for (let i = cells.length; i < headerCount; i++) {
                const cell = document.createElement('td');
                cell.textContent = 'N/A';
                row.appendChild(cell);
            }
            console.log(`Fila ${index+1} corregida: Se agregaron ${headerCount - cells.length} celdas`);
        } else if (cells.length > headerCount) {
            // Eliminar celdas sobrantes
            for (let i = cells.length - 1; i >= headerCount; i--) {
                row.removeChild(cells[i]);
            }
            console.log(`Fila ${index+1} corregida: Se eliminaron ${cells.length - headerCount} celdas`);
        }
    });
    
    return {
        fixed: true,
        message: `Estructura de tabla corregida: ${rows.length} filas ajustadas a ${headerCount} columnas`
    };
}

// Exportar funciones para uso global
window.checkTableStructure = checkTableStructure;
window.fixTableStructure = fixTableStructure;

// Añadir a la carga de la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Debug helpers cargados correctamente');
});
