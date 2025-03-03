/**
 * Módulo para exportación a PDF
 * Requiere jsPDF y html2canvas
 */

/**
 * Exporta los datos de estadísticas a PDF
 * @param {Object} statsData - Datos de las estadísticas
 * @param {string} dateRangeText - Texto descriptivo del rango de fechas
 * @param {string} stationFilter - Filtro de estación aplicado
 * @returns {Promise} - Promesa que se resuelve cuando se completa la exportación
 */
async function exportStatisticsToPDF(statsData, dateRangeText, stationFilter = 'all') {
    // Mostrar indicador de carga
    const loadingEl = document.createElement('div');
    loadingEl.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-50';
    loadingEl.style.zIndex = 9999;
    loadingEl.innerHTML = `
        <div class="card p-4">
            <div class="text-center">
                <div class="spinner-border text-primary mb-3" role="status">
                    <span class="visually-hidden">Cargando...</span>
                </div>
                <h5>Generando PDF...</h5>
                <p class="text-muted small">Esto puede tardar unos segundos.</p>
            </div>
        </div>
    `;
    document.body.appendChild(loadingEl);
    
    try {
        const { jsPDF } = window.jspdf;
        
        // Crear nuevo documento PDF
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // Definir márgenes y medidas
        const pageWidth = doc.internal.pageSize.width;
        const margin = 15;
        const contentWidth = pageWidth - (margin * 2);
        
        // Variables para posición vertical
        let y = 15;
        
        // Cabecera del documento
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('Reporte de Estadísticas de Oyentes', margin, y);
        y += 8;
        
        // Información del reporte
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Fecha de generación: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, y);
        y += 6;
        doc.text(`Período: ${dateRangeText}`, margin, y);
        y += 6;
        
        // Filtro de estación
        if (stationFilter !== 'all') {
            const stationName = statsData.stations.find(s => s.id === stationFilter)?.name || stationFilter;
            doc.text(`Filtro de estación: ${stationName}`, margin, y);
            y += 6;
        } else {
            doc.text('Todas las estaciones', margin, y);
            y += 6;
        }
        
        // Línea separadora
        doc.setLineWidth(0.5);
        doc.line(margin, y, pageWidth - margin, y);
        y += 10;
        
        // Resumen de estadísticas
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Resumen', margin, y);
        y += 8;
        
        // Tabla de resumen
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        // Datos para tabla de resumen
        const summaryData = [
            ['Total de Oyentes', statsData.summary?.total_listeners || 0],
            ['Promedio Diario', statsData.summary?.avg_daily || 0],
            ['Pico Máximo', statsData.summary?.peak_listeners || 0],
            ['Estación Más Popular', statsData.summary?.most_popular || 'N/A']
        ];
        
        // Crear tabla de resumen
        doc.autoTable({
            startY: y,
            head: [['Métrica', 'Valor']],
            body: summaryData,
            margin: { left: margin, right: margin },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: {
                fontSize: 10
            }
        });
        
        y = doc.lastAutoTable.finalY + 10;
        
        // Agregar captura de gráficos si están disponibles
        const listenersChart = document.getElementById('listeners-chart');
        if (listenersChart) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('Tendencia de Oyentes', margin, y);
            y += 10;
            
            // Capturar y agregar el gráfico al PDF
            const listenersCanvas = await html2canvas(listenersChart);
            const listenersImgData = listenersCanvas.toDataURL('image/png');
            const imgWidth = contentWidth;
            const imgHeight = (listenersCanvas.height * imgWidth) / listenersCanvas.width;
            
            doc.addImage(listenersImgData, 'PNG', margin, y, imgWidth, imgHeight);
            y += imgHeight + 10;
            
            // Si se supera el límite de la página, añadir una nueva
            if (y > 250) {
                doc.addPage();
                y = 15;
            }
        }
        
        // Distribución por estación
        const distributionChart = document.getElementById('distribution-chart');
        if (distributionChart && y < 230) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('Distribución por Estación', margin, y);
            y += 10;
            
            // Capturar y agregar el gráfico al PDF
            const distributionCanvas = await html2canvas(distributionChart);
            const distributionImgData = distributionCanvas.toDataURL('image/png');
            
            // Calcular dimensiones para que quede más pequeño
            const imgWidth = contentWidth / 2 - 5;
            const imgHeight = (distributionCanvas.height * imgWidth) / distributionCanvas.width;
            
            doc.addImage(distributionImgData, 'PNG', margin, y, imgWidth, imgHeight);
            
            // Horas pico (al lado del gráfico de distribución)
            const peakHoursChart = document.getElementById('peak-hours-chart');
            if (peakHoursChart) {
                // Capturar y agregar el gráfico al PDF
                const peakHoursCanvas = await html2canvas(peakHoursChart);
                const peakHoursImgData = peakHoursCanvas.toDataURL('image/png');
                
                doc.setFont('helvetica', 'bold');
                doc.text('Horas Pico', margin + imgWidth + 10, y);
                
                doc.addImage(
                    peakHoursImgData, 
                    'PNG', 
                    margin + imgWidth + 10, 
                    y + 5, 
                    imgWidth, 
                    imgHeight
                );
            }
            
            y += imgHeight + 15;
        }
        
        // Si se supera el límite de la página, añadir una nueva
        if (y > 250) {
            doc.addPage();
            y = 15;
        }
        
        // Tabla de datos detallados
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text('Datos Detallados', margin, y);
        y += 8;
        
        // Preparar datos para la tabla (limitar a 25 filas para que no sea demasiado grande)
        const tableData = statsData.data.slice(0, 25).map(item => [
            new Date(item.timestamp * 1000).toLocaleString(),
            item.station_name,
            item.listeners,
            item.peak_listeners,
            `${item.avg_time} min`
        ]);
        
        // Crear tabla de datos
        doc.autoTable({
            startY: y,
            head: [['Fecha/Hora', 'Estación', 'Oyentes', 'Pico Máx', 'Tiempo Medio']],
            body: tableData,
            margin: { left: margin, right: margin },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: {
                fontSize: 8,
                cellPadding: 2
            },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 50 },
                2: { cellWidth: 20 },
                3: { cellWidth: 20 },
                4: { cellWidth: 25 }
            }
        });
        
        // Si hay más de 25 filas, añadir una nota
        if (statsData.data.length > 25) {
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.text(
                `Nota: Se muestran solo las primeras 25 filas de un total de ${statsData.data.length} registros.`,
                margin,
                finalY
            );
        }
        
        // Pie de página con numeración
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(100);
            doc.text(
                `Página ${i} de ${totalPages} - Map Player Icecast2`,
                pageWidth / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            );
        }
        
        // Guardar PDF
        const fileName = `estadisticas_oyentes_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        // Mostrar mensaje de éxito
        showToast('Archivo PDF generado correctamente', 'success');
    } catch (error) {
        console.error('Error al generar PDF:', error);
        showToast('Error al generar el PDF: ' + error.message, 'error');
    } finally {
        // Eliminar el indicador de carga
        document.body.removeChild(loadingEl);
    }
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
    
    // Si no, crear un toast temporal
    const toastEl = document.createElement('div');
    toastEl.className = `toast-notification toast-${type}`;
    toastEl.innerHTML = `
        <div class="toast-content">
            <i class="fas ${getIconForType(type)} me-2"></i>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toastEl);
    
    // Mostrar y ocultar después de un tiempo
    setTimeout(() => {
        toastEl.classList.add('show');
        setTimeout(() => {
            toastEl.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toastEl);
            }, 300);
        }, 3000);
    }, 100);
}

/**
 * Obtiene el icono según el tipo de mensaje
 * @param {string} type - Tipo de mensaje
 * @returns {string} - Clase CSS del icono
 */
function getIconForType(type) {
    switch (type) {
        case 'success':
            return 'fa-check-circle';
        case 'error':
            return 'fa-exclamation-circle';
        case 'warning':
            return 'fa-exclamation-triangle';
        case 'info':
        default:
            return 'fa-info-circle';
    }
}

// Estilos para el toast si no existen en la aplicación
const toastStyle = document.createElement('style');
toastStyle.textContent = `
.toast-notification {
    position: fixed;
    bottom: 20px;
    right: 20px;
    max-width: 350px;
    background: #fff;
    box-shadow: 0 3px 10px rgba(0,0,0,0.15);
    border-radius: 4px;
    padding: 15px 20px;
    transform: translateY(30px);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 9999;
}

.toast-notification.show {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
}

.toast-success {
    border-left: 4px solid #28a745;
}

.toast-error {
    border-left: 4px solid #dc3545;
}

.toast-warning {
    border-left: 4px solid #ffc107;
}

.toast-info {
    border-left: 4px solid #17a2b8;
}

.toast-content {
    display: flex;
    align-items: center;
}

body.dark-mode .toast-notification {
    background: #343a40;
    color: #f8f9fa;
}
`;

document.head.appendChild(toastStyle);