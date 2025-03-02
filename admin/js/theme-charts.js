/**
 * Controlador de temas para gráficos y visualizaciones
 */

// Configuración de colores para gráficos según tema
const ChartTheme = {
    light: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        gridColor: 'rgba(0, 0, 0, 0.1)',
        titleColor: '#333',
        textColor: '#666',
        lineColors: ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b'],
        tooltipBackgroundColor: 'rgba(255, 255, 255, 0.8)',
        tooltipBorderColor: '#ddd'
    },
    dark: {
        backgroundColor: 'rgba(50, 50, 50, 0.9)',
        gridColor: 'rgba(255, 255, 255, 0.1)',
        titleColor: '#f8f9fa',
        textColor: '#adb5bd',
        lineColors: ['#5a89ff', '#25e8a8', '#4ddbeb', '#ffd54f', '#ff6b6b'],
        tooltipBackgroundColor: 'rgba(70, 70, 70, 0.8)',
        tooltipBorderColor: '#444'
    }
};

/**
 * Obtiene la configuración de tema para los gráficos basada en el modo actual
 * @return {Object} Configuración de colores para el tema actual
 */
function getChartTheme() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    return isDarkMode ? ChartTheme.dark : ChartTheme.light;
}

/**
 * Actualiza los gráficos existentes según el tema actual
 * @param {Chart[]} charts - Array de objetos Chart de Chart.js
 */
function updateChartsTheme(charts) {
    if (!charts || charts.length === 0) return;
    
    const theme = getChartTheme();
    
    charts.forEach(chart => {
        if (!chart) return;
        
        // Actualizar colores de fondo
        if (chart.options.plugins && chart.options.plugins.legend) {
            chart.options.plugins.legend.labels.color = theme.textColor;
        }
        
        if (chart.options.scales) {
            // Para ejes X
            if (chart.options.scales.x) {
                chart.options.scales.x.grid.color = theme.gridColor;
                chart.options.scales.x.ticks.color = theme.textColor;
            }
            
            // Para ejes Y
            if (chart.options.scales.y) {
                chart.options.scales.y.grid.color = theme.gridColor;
                chart.options.scales.y.ticks.color = theme.textColor;
            }
        }
        
        // Actualizar tooltip
        if (chart.options.plugins && chart.options.plugins.tooltip) {
            chart.options.plugins.tooltip.backgroundColor = theme.tooltipBackgroundColor;
            chart.options.plugins.tooltip.borderColor = theme.tooltipBorderColor;
            chart.options.plugins.tooltip.titleColor = theme.titleColor;
            chart.options.plugins.tooltip.bodyColor = theme.textColor;
        }
        
        // Actualizar el gráfico
        chart.update();
    });
}

// Agregar listener para el cambio de tema
document.addEventListener('themeChanged', function(e) {
    // Este evento personalizado se emitirá cuando cambie el tema
    // Para usarlo desde cualquier función que cambie el tema:
    // document.dispatchEvent(new CustomEvent('themeChanged'));
    
    // Actualizar gráficos si hubiera alguna colección global
    if (window.dashboardCharts) {
        updateChartsTheme(window.dashboardCharts);
    }
});
