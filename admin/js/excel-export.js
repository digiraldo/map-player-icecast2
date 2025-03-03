/**
 * Módulo para exportación a Excel
 * Requiere SheetJS (xlsx) y FileSaver
 */

/**
 * Exporta los datos de estadísticas a Excel
 * @param {Object} statsData - Datos de las estadísticas
 * @param {string} dateRangeText - Texto descriptivo del rango de fechas
 * @param {string} stationFilter - Filtro de estación aplicado
 */
function exportStatisticsToExcel(statsData, dateRangeText, stationFilter = 'all') {
    // Si no hay datos para exportar, mostrar un mensaje
    if (!statsData || !statsData.data || !statsData.data.length) {
        alert('No hay datos disponibles para exportar.');
        return;
    }
    
    // Crear un libro de trabajo con SheetJS (xlsx)
    const wb = XLSX.utils.book_new();
    wb.Props = {
        Title: "Estadísticas de Oyentes",
        Subject: "Estadísticas",
        Author: "Map Player Icecast2",
        CreatedDate: new Date()
    };
    
    // Crear la hoja principal
    wb.SheetNames.push("Datos Detallados");
    
    // Preparar datos para la hoja principal
    const wsData = [];
    
    // Encabezados
    wsData.push([
        'Fecha/Hora', 
        'Estación', 
        'Oyentes', 
        'Pico Máximo', 
        'Duración Promedio (min)'
    ]);
    
    // Agregar filas de datos
    statsData.data.forEach(item => {
        wsData.push([
            new Date(item.timestamp * 1000).toLocaleString(),
            item.station_name,
            parseInt(item.listeners),
            parseInt(item.peak_listeners),
            parseInt(item.avg_time)
        ]);
    });
    
    // Crear la hoja y agregarla al libro
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    wb.Sheets["Datos Detallados"] = ws;
    
    // Agregar hoja de resumen
    wb.SheetNames.push("Resumen");
    
    // Datos para la hoja de resumen
    const summaryData = [
        ['Reporte de Estadísticas de Oyentes'],
        [],
        ['Fecha de generación', new Date().toLocaleString()],
        ['Período analizado', dateRangeText],
        []
    ];
    
    // Agregar información de filtro si hay uno aplicado
    if (stationFilter !== 'all') {
        const stationName = statsData.stations.find(s => s.id === stationFilter)?.name || 'Desconocida';
        summaryData.push(['Estación filtrada', stationName]);
        summaryData.push([]);
    }
    
    // Agregar datos del resumen
    summaryData.push(['MÉTRICAS PRINCIPALES', '']);
    summaryData.push(['Total de Oyentes', statsData.summary?.total_listeners || 0]);
    summaryData.push(['Promedio Diario', statsData.summary?.avg_daily || 0]);
    summaryData.push(['Pico Máximo', statsData.summary?.peak_listeners || 0]);
    summaryData.push(['Estación Más Popular', statsData.summary?.most_popular || 'N/A']);
    summaryData.push([]);
    
    // Agregar distribución por estación
    if (statsData.distribution && statsData.distribution.length) {
        summaryData.push(['DISTRIBUCIÓN POR ESTACIÓN', '']);
        statsData.distribution.forEach(item => {
            summaryData.push([item.name, item.value]);
        });
    }
    
    // Crear la hoja de resumen
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Ajustar estilos de celdas (básico)
    wsSummary['!cols'] = [{ wch: 25 }, { wch: 15 }];
    
    // Añadir la hoja al libro
    wb.Sheets["Resumen"] = wsSummary;
    
    // Generar el archivo Excel
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
    
    // Función para convertir la cadena de salida en un ArrayBuffer
    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i=0; i<s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }
    
    // Descargar el archivo
    saveAs(new Blob([s2ab(wbout)], {type:"application/octet-stream"}), 
           `estadisticas_oyentes_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    // Mostrar mensaje de éxito
    showToast('Archivo Excel generado correctamente', 'success');
}

/**
 * Exporta los datos de estadísticas a CSV
 * @param {Object} statsData - Datos de las estadísticas
 */
function exportStatisticsToCSV(statsData) {
    // Si no hay datos para exportar, mostrar un mensaje
    if (!statsData || !statsData.data || !statsData.data.length) {
        alert('No hay datos disponibles para exportar.');
        return;
    }
    
    // Preparar los datos en formato CSV
    let csvContent = 'data:text/csv;charset=utf-8,';
    
    // Encabezados
    csvContent += 'Fecha/Hora,Estación,Oyentes,Pico Máximo,Duración Promedio (min)\n';
    
    // Filas de datos
    statsData.data.forEach(item => {
        const date = new Date(item.timestamp * 1000).toLocaleString();
        csvContent += `"${date}","${item.station_name}",${item.listeners},${item.peak_listeners},${item.avg_time}\n`;
    });
    
    // Crear un enlace para la descarga y activarlo
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `estadisticas_oyentes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Mostrar mensaje de éxito
    showToast('Archivo CSV generado correctamente', 'success');
}

/**
 * Muestra un toast de notificación
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje (success, error, warning, info)
 */
function showToast(message, type = 'info') {
    // Si existe un sistema de toast en la aplicación, usarlo
    if (typeof showNotification === 'function') {
        showNotification(message, type);
        return;
    }
    
    // Si la función está definida en pdf-export.js, usarla
    if (window.showToast && typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
    }
    
    // Fallback básico
    alert(message);
}
