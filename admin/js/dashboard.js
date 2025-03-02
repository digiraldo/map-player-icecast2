/**
 * Script para el Dashboard
 * Implementa la actualización periódica de datos de oyentes
 */

document.addEventListener('DOMContentLoaded', function() {
    // Iniciar la actualización periódica de oyentes si estamos en el dashboard
    if (document.getElementById('online-stations-count')) {
        // Primera actualización después de 15 segundos
        setTimeout(updateListeners, 15000);
    }
    
    // Actualizaciones adicionales si hay gráficos u otros elementos específicos del dashboard
    initializeDashboardWidgets();
});

/**
 * Actualiza los datos de oyentes mediante AJAX
 */
function updateListeners() {
    // Animación para indicar que se están cargando datos
    updateLoadingIndicators(true);
    
    fetch('./api/get-listeners.php')  // Asegúrate de que la ruta es correcta
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error al actualizar datos:', data.message);
                return;
            }
            
            // Actualizar estadísticas generales
            updateStatistics(data.stats);
            
            // Actualizar tabla de estaciones más populares
            updateTopStations(data.top);
            
            // Actualizar indicador de hora
            document.getElementById('last-update-time').textContent = 'Actualizado: ' + data.stats.time;
            
            // Indicar actualización completada
            updateLoadingIndicators(false);
        })
        .catch(error => {
            console.error('Error al realizar la solicitud:', error);
            updateLoadingIndicators(false);
        })
        .finally(() => {
            // Programar la próxima actualización en 15 segundos
            setTimeout(updateListeners, 15000);
        });
}

/**
 * Actualiza los indicadores visuales de carga
 * @param {boolean} loading Indica si está cargando o no
 */
function updateLoadingIndicators(loading) {
    const updateIndicator = document.getElementById('top-stations-update-indicator');
    if (updateIndicator) {
        if (loading) {
            updateIndicator.innerHTML = '<i class="fas fa-sync fa-spin text-primary"></i>';
        } else {
            // Mostrar un check y luego desaparecer
            updateIndicator.innerHTML = '<i class="fas fa-check text-success"></i>';
            setTimeout(() => {
                updateIndicator.innerHTML = '<i class="fas fa-sync-alt text-muted"></i>';
            }, 1000);
        }
    }
}

/**
 * Actualiza las estadísticas generales
 * @param {Object} stats Estadísticas a actualizar
 */
function updateStatistics(stats) {
    // Actualizar número de estaciones online
    const onlineStationsCount = document.getElementById('online-stations-count');
    if (onlineStationsCount) {
        onlineStationsCount.textContent = stats.online;
    }
    
    // Actualizar número de estaciones offline
    const offlineStationsCount = document.getElementById('offline-stations-count');
    if (offlineStationsCount) {
        offlineStationsCount.textContent = stats.offline;
    }
    
    // Actualizar número total de sources
    const totalSourcesCount = document.getElementById('total-sources-count');
    if (totalSourcesCount) {
        totalSourcesCount.textContent = stats.totalSources;
    }
    
    // Actualizar badge
    const onlineBadge = document.getElementById('online-badge');
    if (onlineBadge) {
        onlineBadge.textContent = stats.totalSources;
        
        // Efecto visual de parpadeo para indicar actualización
        onlineBadge.classList.add('badge-pulse');
        setTimeout(() => {
            onlineBadge.classList.remove('badge-pulse');
        }, 1000);
    }
    
    // Actualizar total de oyentes
    const totalListenersCount = document.getElementById('total-listeners-count');
    if (totalListenersCount) {
        const oldValue = parseInt(totalListenersCount.textContent) || 0;
        const newValue = stats.totalListeners || 0;
        
        // Actualizar valor
        totalListenersCount.textContent = newValue;
        
        // Efecto visual si cambió el valor
        if (oldValue !== newValue) {
            totalListenersCount.classList.add('bg-highlight');
            setTimeout(() => {
                totalListenersCount.classList.remove('bg-highlight');
            }, 1500);
        }
    }
    
    // Actualizar el porcentaje de disponibilidad
    const availabilityPercentage = document.getElementById('availability-percentage');
    if (availabilityPercentage && stats.total > 0) {
        const percentage = Math.round((stats.online / stats.total) * 100);
        availabilityPercentage.textContent = percentage + '%';
        
        // Actualizar la barra de progreso
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = percentage + '%';
            progressBar.setAttribute('aria-valuenow', percentage);
        }
    }
}

/**
 * Actualiza la tabla de estaciones más populares
 * @param {Array} topStations Array de las estaciones más populares
 */
function updateTopStations(topStations) {
    const tbody = document.getElementById('top-stations-tbody');
    if (!tbody) return;
    
    // Actualizar filas existentes
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
        const stationId = row.getAttribute('data-station');
        const station = topStations.find(s => s.serverUrl === stationId);
        
        if (station) {
            // Actualizar conteo de oyentes
            const listenersCell = row.querySelector('.listeners-count');
            if (listenersCell) {
                const oldValue = parseInt(listenersCell.textContent) || 0;
                const newValue = station.listeners || 0;
                
                // Cambiar el texto
                listenersCell.textContent = newValue;
                
                // Añadir efecto visual si cambió el valor
                if (oldValue !== newValue) {
                    listenersCell.classList.add('bg-highlight');
                    setTimeout(() => {
                        listenersCell.classList.remove('bg-highlight');
                    }, 1500);
                }
            }
            
            // También podríamos actualizar el estado si es necesario
        }
    });
}

/**
 * Inicializa widgets adicionales del dashboard
 */
function initializeDashboardWidgets() {
    // Aquí se pueden inicializar gráficos, calendarios u otros widgets
    // que sean específicos del dashboard
}
