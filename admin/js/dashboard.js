/**
 * Módulo Dashboard
 */

// Variable para almacenar los datos del dashboard
let dashboardData = null;

/**
 * Renderiza el dashboard con los datos recibidos
 * @param {Object} data - Datos para renderizar el dashboard
 */
function renderDashboard(data) {
    // Guardar los datos para actualizaciones
    dashboardData = data;
    
    const contentEl = document.getElementById('content');
    const stats = data.stats;
    const onlineStations = stats.online || 0;
    const offlineStations = stats.offline || 0;
    const totalStations = stats.total || 0;
    const totalSources = stats.totalSources || 0;
    const totalListeners = stats.totalListeners || 0;
    const availabilityPercentage = stats.availabilityPercentage || 0;
    
    // Información del servidor
    const server = data.server || {};
    
    // Determinar si estamos en modo oscuro para ajustar ciertos estilos
    const isDarkMode = document.body.classList.contains('dark-mode');
    const cardTextClass = isDarkMode ? 'text-light' : 'text-gray-800';
    const mutedTextClass = isDarkMode ? 'text-light-50' : 'text-muted';
    
    // Construir la estructura del dashboard
    let html = `
        <!-- Tarjetas de información -->
        <div class="row mb-4">
            <!-- Estaciones Online -->
            <div class="col-xl-3 col-md-6">
                <div class="card border-left-success shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                    Estaciones Online</div>
                                <div class="h5 mb-0 font-weight-bold ${cardTextClass}">
                                    <span id="online-stations-count">${onlineStations}</span>
                                </div>
                                
                                <div class="text-xs ${mutedTextClass} mt-2">
                                    <div class="mb-1">
                                        <i class="fas fa-times-circle text-danger me-1"></i>
                                        <span class="font-weight-bold">Offline:</span> 
                                        <span id="offline-stations-count">${offlineStations}</span>
                                    </div>
                                    <div>
                                        <i class="fas fa-broadcast-tower text-primary me-1"></i>
                                        <span class="font-weight-bold">Sources:</span> 
                                        <span id="total-sources-count">${totalSources}</span>
                                    </div>
                                </div>
                                
                                <div class="text-xs ${mutedTextClass} mt-2">
                                    <span id="last-update-time">Actualizado: ${new Date().toLocaleTimeString()}</span>
                                </div>
                            </div>
                            <div class="col-auto">
                                <div class="position-relative">
                                    <i class="fas fa-signal fa-2x text-success"></i>
                                    <span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success" id="online-badge">
                                        ${totalSources}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Total Oyentes -->
            <div class="col-xl-3 col-md-6">
                <div class="card border-left-info shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                                    Total Oyentes</div>
                                <div class="h5 mb-0 font-weight-bold ${cardTextClass}">
                                    <span id="total-listeners-count" class="counter-value">${totalListeners}</span>
                                </div>
                                <div class="text-xs ${mutedTextClass} mt-2">
                                    <span class="font-weight-bold">En todas las emisoras</span>
                                </div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-headphones fa-2x text-info theme-light-card-icons"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Total Estaciones -->
            <div class="col-xl-3 col-md-6">
                <div class="card border-left-warning shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                    Total Estaciones</div>
                                <div class="h5 mb-0 font-weight-bold ${cardTextClass}">${totalStations}</div>
                                
                                <div class="row no-gutters align-items-center mt-2">
                                    <div class="col">
                                        <div class="progress progress-sm mr-2">
                                            <div class="progress-bar bg-warning" role="progressbar" 
                                                style="width: ${availabilityPercentage}%"
                                                aria-valuenow="${availabilityPercentage}" 
                                                aria-valuemin="0" aria-valuemax="100"></div>
                                        </div>
                                    </div>
                                    <div class="col-auto ms-2">
                                        <div class="text-xs ${mutedTextClass}">
                                            <span id="availability-percentage">${availabilityPercentage}%</span> disponibles
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-broadcast-tower fa-2x text-warning theme-light-card-icons"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Estado del Servidor -->
            <div class="col-xl-3 col-md-6">
                <div class="card border-left-primary shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                    Estado del Servidor</div>
                                <div class="h5 mb-0 font-weight-bold ${cardTextClass}">
                                    <span class="badge bg-success">Conectado</span>
                                </div>
                                <div class="text-xs ${mutedTextClass} mt-2">
                                    <div>
                                        <span class="font-weight-bold">Versión:</span> 
                                        <span>${data.server?.version || 'No disponible'}</span>
                                    </div>
                                    <div>
                                        <span class="font-weight-bold">Host:</span> 
                                        <span>${data.server?.host || 'No disponible'}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-server fa-2x text-primary theme-light-card-icons"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Tarjetas de información detallada -->
        <div class="row mb-4">
            <!-- Tarjeta de información del servidor Icecast -->
            <div class="col-lg-6">
                <div class="card shadow mb-4">
                    <div class="card-header py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 font-weight-bold text-primary">
                            <i class="fas fa-server me-1"></i> Información del Servidor Icecast
                        </h6>
                        <div>
                            <span class="badge ${data.error ? 'bg-danger' : 'bg-success'} p-2">
                                ${data.error ? 'Desconectado' : 'Conectado'}
                            </span>
                        </div>
                    </div>
                    <div class="card-body">
                        ${data.error ? renderServerError(data.message) : renderServerInfo(server)}
                    </div>
                </div>
            </div>
            
            <!-- Estaciones más populares -->
            <div class="col-lg-6">
                <div class="card shadow mb-4">
                    <div class="card-header py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 font-weight-bold text-primary">
                            <i class="fas fa-chart-line me-1"></i> Estaciones Más Populares
                        </h6>
                        <div>
                            <small class="${mutedTextClass}" id="top-stations-update-indicator">
                                <i class="fas fa-sync-alt me-1"></i>
                            </small>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="table-responsive">
                            <table class="table table-bordered table-hover table-top-stations">
                                <thead>
                                    <tr>
                                        <th>Estación</th>
                                        <th>Estado</th>
                                        <th>Oyentes</th>
                                    </tr>
                                </thead>
                                <tbody id="top-stations-tbody">
                                    ${renderTopStations(data.top || [])}
                                </tbody>
                            </table>
                        </div>
                        <div class="text-center mt-3">
                            <button class="btn btn-sm btn-primary" onclick="loadSection('stations')">
                                <i class="fas fa-table me-1"></i> Ver todas las estaciones
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    contentEl.innerHTML = html;
}

/**
 * Renderiza un mensaje de error para el servidor
 * @param {string} message - Mensaje de error
 * @returns {string} HTML del mensaje de error
 */
function renderServerError(message) {
    return `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle me-2"></i>
            Error al conectar con el servidor Icecast: ${message || 'Error desconocido'}
        </div>
        <p class="mb-0">
            <i class="fas fa-info-circle me-1"></i>
            Asegúrese de que la URL del servidor y la ruta de estado son correctas.
            Verifique la configuración del servidor.
        </p>
    `;
}

/**
 * Renderiza la información del servidor
 * @param {Object} server - Información del servidor
 * @returns {string} HTML con la información del servidor
 */
function renderServerInfo(server) {
    // Obtener la URL correcta del servidor desde los datos del dashboard
    // Usar la URL base configurada en el hostUrl del archivo stations.json
    const serverHostUrl = dashboardData.hostUrl || server.host || '#';
    const isDarkMode = document.body.classList.contains('dark-mode');
    const tableClass = isDarkMode ? 'table-dark' : '';
    
    return `
        <div class="table-responsive">
            <table class="table table-bordered ${tableClass} table-server-info">
                <tr>
                    <th style="width: 30%">Versión:</th>
                    <td id="server-version">${server.version || 'No disponible'}</td>
                </tr>
                <tr>
                    <th>Administrador:</th>
                    <td id="server-admin">${server.admin || 'No disponible'}</td>
                </tr>
                <tr>
                    <th>Host:</th>
                    <td id="server-host">${serverHostUrl || 'No disponible'}</td>
                </tr>
                <tr>
                    <th>Ubicación:</th>
                    <td id="server-location">${server.location || 'No disponible'}</td>
                </tr>
                <tr>
                    <th>Fuentes activas:</th>
                    <td>
                        <span class="badge bg-primary" id="server-sources">${dashboardData.stats.totalSources || 0}</span> fuentes activas
                    </td>
                </tr>
                <tr>
                    <th>Estado:</th>
                    <td>
                        <span class="badge bg-success">Conectado</span>
                        <small class="text-muted ms-2">Última verificación: ${new Date().toLocaleTimeString()}</small>
                    </td>
                </tr>
            </table>
        </div>
        <div class="mt-3 d-flex justify-content-between">
            <a href="${serverHostUrl}" target="_blank" class="btn btn-sm btn-outline-primary">
                <i class="fas fa-external-link-alt me-1"></i> Visitar servidor
            </a>
            <button class="btn btn-sm btn-outline-secondary" onclick="testServerConnection()">
                <i class="fas fa-sync-alt me-1"></i> Verificar conexión
            </button>
        </div>
    `;
}

/**
 * Prueba la conexión al servidor
 */
function testServerConnection() {
    const testButton = event.currentTarget;
    const originalText = testButton.innerHTML;
    
    // Mostrar indicador de carga
    testButton.disabled = true;
    testButton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Verificando...';
    
    // Intentar conectar con el servidor
    fetchData('get-listeners.php')
        .then(data => {
            if (data.error) {
                showErrorAlert('Error al conectar con el servidor: ' + data.message);
            } else {
                // Actualizar la interfaz con los nuevos datos
                updateServerInfo(data.server);
                showSuccessAlert('Conexión exitosa con el servidor Icecast');
            }
        })
        .catch(error => {
            showErrorAlert('Error: ' + error.message);
        })
        .finally(() => {
            // Restaurar el botón
            testButton.disabled = false;
            testButton.innerHTML = originalText;
        });
}

/**
 * Muestra una alerta de error
 * @param {string} message - Mensaje de error
 */
function showErrorAlert(message) {
    alert(message); // Esta es una versión simple, puedes implementar un sistema de alertas más sofisticado
}

/**
 * Muestra una alerta de éxito
 * @param {string} message - Mensaje de éxito
 */
function showSuccessAlert(message) {
    alert(message); // Esta es una versión simple, puedes implementar un sistema de alertas más sofisticado
}

/**
 * Actualiza la información del servidor en la UI
 * @param {Object} server - Datos actualizados del servidor
 */
function updateServerInfo(server) {
    if (!server) return;
    
    // Actualizar cada campo
    updateElementContent('server-version', server.version || 'No disponible');
    updateElementContent('server-admin', server.admin || 'No disponible');
    updateElementContent('server-host', server.host || 'No disponible');
    updateElementContent('server-location', server.location || 'No disponible');
    updateElementContent('server-sources', dashboardData.stats.totalSources || 0);
}

/**
 * Actualiza el contenido de un elemento
 * @param {string} id - ID del elemento
 * @param {string} content - Nuevo contenido
 */
function updateElementContent(id, content) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = content;
    }
}

/**
 * Renderiza la tabla de estaciones más populares
 * @param {Array} stations - Array de estaciones a mostrar
 */
function renderTopStations(stations) {
    if (!stations || stations.length === 0) {
        return `
            <tr>
                <td colspan="3" class="text-center">No hay datos disponibles</td>
            </tr>
        `;
    }
    
    return stations.map(station => `
        <tr data-station="${station.serverUrl}">
            <td>${station.name || 'Sin nombre'}</td>
            <td>
                ${station.online ? 
                    '<span class="badge bg-success">Online</span>' : 
                    '<span class="badge bg-danger">Offline</span>'
                }
            </td>
            <td class="listeners-count">
                ${station.listeners || 0}
            </td>
        </tr>
    `).join('');
}

/**
 * Actualiza los datos del dashboard
 */
function updateDashboardData() {
    fetchData('get-listeners.php').then(data => {
        if (data.error) {
            console.error('Error al actualizar datos:', data.message);
            return;
        }
        
        // Actualizar los datos almacenados
        dashboardData = data;
        
        // Actualizar elementos del DOM
        updateDashboardUI(data);
    }).catch(error => {
        console.error('Error en actualización del dashboard:', error);
    });
}

/**
 * Actualiza la interfaz del dashboard con los nuevos datos
 * @param {Object} data - Datos actualizados
 */
function updateDashboardUI(data) {
    const stats = data.stats || {};
    
    // Actualizar contador de estaciones online
    updateElementWithHighlight('online-stations-count', stats.online || 0);
    
    // Actualizar contador de estaciones offline
    updateElementWithHighlight('offline-stations-count', stats.offline || 0);
    
    // Actualizar contador de sources
    updateElementWithHighlight('total-sources-count', stats.totalSources || 0);
    
    // Actualizar total de oyentes
    updateElementWithHighlight('total-listeners-count', stats.totalListeners || 0, true);
    
    // Actualizar porcentaje de disponibilidad
    const availPercentage = document.getElementById('availability-percentage');
    if (availPercentage) {
        const percentage = stats.availabilityPercentage || 0;
        availPercentage.textContent = `${percentage}%`;
        
        // Actualizar barra de progreso
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
            progressBar.setAttribute('aria-valuenow', percentage);
        }
    }
    
    // Actualizar hora de actualización
    const lastUpdateTime = document.getElementById('last-update-time');
    if (lastUpdateTime) {
        lastUpdateTime.textContent = `Actualizado: ${new Date().toLocaleTimeString()}`;
    }
    
    // Actualizar el badge online con efecto de pulso
    const onlineBadge = document.getElementById('online-badge');
    if (onlineBadge) {
        onlineBadge.textContent = stats.totalSources || 0;
        onlineBadge.classList.add('badge-pulse');
        setTimeout(() => onlineBadge.classList.remove('badge-pulse'), 800);
    }
    
    // Actualizar estaciones top
    updateTopStationsTable(data.top || []);
    
    // Indicador de actualización
    const indicator = document.getElementById('top-stations-update-indicator');
    if (indicator) {
        indicator.innerHTML = '<i class="fas fa-check text-success"></i>';
        setTimeout(() => {
            indicator.innerHTML = '<i class="fas fa-sync-alt text-muted"></i>';
        }, 1000);
    }
    
    // Actualizar información del servidor
    if (data.server) {
        updateServerInfo(data.server);
    }

    // Considerar el tema actual al aplicar estilos de actualización
    const isDarkMode = document.body.classList.contains('dark-mode');
    const highlightBgColor = isDarkMode ? 'rgba(40, 167, 69, 0.3)' : 'rgba(40, 167, 69, 0.1)';
    
    // Aplicar efectos de highlight con color apropiado según tema
    const highlight = (element) => {
        if (element) {
            element.style.transition = 'background-color 1.5s ease-in-out';
            element.style.backgroundColor = highlightBgColor;
            setTimeout(() => {
                element.style.backgroundColor = '';
            }, 1500);
        }
    };
    
    // Actualizar elementos con posible efecto de highlight
    const totalListenersEl = document.getElementById('total-listeners-count');
    if (totalListenersEl) {
        const totalListeners = stats.totalListeners || 0;
        const oldValue = parseInt(totalListenersEl.textContent);
        
        if (oldValue !== totalListeners) {
            totalListenersEl.textContent = totalListeners;
            highlight(totalListenersEl.parentNode);
        }
    }
}

/**
 * Actualiza un elemento con efecto de resaltado si cambia su valor
 * @param {string} elementId - ID del elemento
 * @param {string|number} newValue - Nuevo valor
 * @param {boolean} highlight - Si debe destacar cambios
 */
function updateElementWithHighlight(elementId, newValue, highlight = false) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const currentValue = element.textContent.trim();
    
    // Solo actualizar si el valor es diferente
    if (currentValue !== String(newValue)) {
        element.textContent = newValue;
        
        // Aplicar efecto de resaltado si se solicita
        if (highlight) {
            element.classList.add('bg-highlight');
            setTimeout(() => element.classList.remove('bg-highlight'), 1500);
        }
    }
}

/**
 * Actualiza la tabla de estaciones más populares
 * @param {Array} topStations - Array de estaciones top
 */
function updateTopStationsTable(topStations) {
    const tbody = document.getElementById('top-stations-tbody');
    if (!tbody) return;
    
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const stationId = row.getAttribute('data-station');
        if (!stationId) return;
        
        const station = topStations.find(s => s.serverUrl === stationId);
        if (!station) return;
        
        // Actualizar conteo de oyentes
        const listenersCell = row.querySelector('.listeners-count');
        if (listenersCell) {
            const oldValue = parseInt(listenersCell.textContent) || 0;
            const newValue = station.listeners || 0;
            
            // Solo actualizar y resaltar si el valor cambió
            if (oldValue !== newValue) {
                listenersCell.textContent = newValue;
                listenersCell.classList.add('bg-highlight');
                setTimeout(() => listenersCell.classList.remove('bg-highlight'), 1500);
            }
        }
        
        // También podríamos actualizar el estado si cambia
        // Por ejemplo, si una estación pasa de online a offline o viceversa
    });
}