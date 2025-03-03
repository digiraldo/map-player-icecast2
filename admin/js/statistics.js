/**
 * Módulo de Estadísticas
 * Permite visualizar y exportar estadísticas de oyentes de las emisoras
 */

// Variables globales del módulo
let statsData = null;
let charts = [];
let dateRange = 'week'; // Valores posibles: 'day', 'week', 'month', 'custom'
let customStartDate = null;
let customEndDate = null;
let currentStationFilter = 'all';
let realTimeUpdate = true;
let realTimeInterval = null;

/**
 * Carga el módulo de estadísticas
 */
function loadStatistics() {
    console.log('Cargando módulo de estadísticas...');
    
    // Depuración: mostrar la URL base de la API
    console.log('Config.apiBase:', Config.apiBase);
    
    // Mostrar loader mientras se cargan los datos
    showLoader();
    
    // Inicializar fechas para rango personalizado
    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    customStartDate = formatDate(lastWeek);
    customEndDate = formatDate(today);
    
    // Añadir opción Estadísticas al menú si no existe
    addStatisticsMenuItem();
    
    // Obtener los datos de estadísticas según el rango actual
    fetchStatsData(dateRange)
        .then(data => {
            if (data.error) {
                showError(data.message || 'Error al cargar las estadísticas');
                return;
            }
            
            console.log('Estadísticas cargadas:', data);
            
            // Almacenar datos
            statsData = data;
            
            // Renderizar el módulo
            renderStatisticsModule();
            
            // Configurar eventos
            setupStatisticsEvents();
            
            // Iniciar actualización en tiempo real si está habilitada
            if (realTimeUpdate) {
                startRealTimeUpdates();
            }
        })
        .catch(error => {
            console.error('Error al cargar estadísticas:', error);
            showError('Error al cargar el módulo de estadísticas: ' + error.message);
        });
}

/**
 * Añade la opción Estadísticas al menú lateral
 */
function addStatisticsMenuItem() {
    const menu = document.querySelector('.sidebar .nav');
    
    // Verificar si ya existe el elemento
    if (document.querySelector('.nav-link[data-section="statistics"]')) {
        return;
    }
    
    // Crear el elemento de menú
    const menuItem = document.createElement('li');
    menuItem.className = 'nav-item';
    menuItem.innerHTML = `
        <a class="nav-link" href="#" data-section="statistics">
            <i class="fas fa-chart-line me-2"></i>
            Estadísticas
        </a>
    `;
    
    // Insertar antes del elemento de Configuración
    const configItem = document.querySelector('.nav-link[data-section="config"]');
    if (configItem) {
        const parentLi = configItem.closest('li');
        menu.insertBefore(menuItem, parentLi);
    } else {
        menu.appendChild(menuItem);
    }
    
    // Añadir el evento click
    menuItem.querySelector('.nav-link').addEventListener('click', function(e) {
        e.preventDefault();
        
        // Actualizar navegación
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        this.classList.add('active');
        
        // Cargar la sección
        loadStatistics();
    });
}

/**
 * Inicia la actualización de datos en tiempo real
 */
function startRealTimeUpdates() {
    if (realTimeInterval) {
        clearInterval(realTimeInterval);
    }
    
    realTimeInterval = setInterval(() => {
        if (Config.currentSection !== 'statistics') {
            clearInterval(realTimeInterval);
            realTimeInterval = null;
            return;
        }
        
        updateStatsData();
    }, 60000); // Actualizar cada minuto
}

/**
 * Actualiza los datos de estadísticas sin recargar toda la interfaz
 */
function updateStatsData() {
    // Mostrar indicador de actualización
    const refreshIcon = document.getElementById('refresh-stats-icon');
    if (refreshIcon) {
        refreshIcon.className = 'fas fa-sync-alt fa-spin';
    }
    
    fetchStatsData(dateRange)
        .then(data => {
            if (data.error) {
                console.error('Error al actualizar estadísticas:', data.message);
                return;
            }
            
            // Actualizar datos
            statsData = data;
            
            // Actualizar gráficos
            updateChartsData();
            
            // Actualizar tabla
            updateStatsTable();
            
            // Mostrar mensaje de actualización
            showUpdateMessage();
        })
        .catch(error => {
            console.error('Error en actualización de estadísticas:', error);
        })
        .finally(() => {
            // Restaurar icono
            if (refreshIcon) {
                setTimeout(() => {
                    refreshIcon.className = 'fas fa-sync-alt';
                }, 1000);
            }
        });
}

/**
 * Muestra un mensaje de actualización
 */
function showUpdateMessage() {
    // Actualizar hora de última actualización
    const lastUpdateEl = document.getElementById('stats-last-update');
    if (lastUpdateEl) {
        const now = new Date();
        lastUpdateEl.textContent = now.toLocaleTimeString();
        lastUpdateEl.classList.add('text-success');
        setTimeout(() => {
            lastUpdateEl.classList.remove('text-success');
        }, 2000);
    }
}

/**
 * Obtiene los datos de estadísticas según el rango de fechas
 * @param {string} range - Rango de fechas ('day', 'week', 'month', 'custom')
 * @returns {Promise} - Promesa con los datos
 */
function fetchStatsData(range) {
    let url = `get-statistics.php?range=${range}`;
    
    // Si es rango personalizado, añadir fechas
    if (range === 'custom' && customStartDate && customEndDate) {
        url += `&start=${customStartDate}&end=${customEndDate}`;
    }
    
    // Si hay filtro por estación
    if (currentStationFilter !== 'all') {
        url += `&station=${currentStationFilter}`;
    }
    
    return fetchData(url);
}

/**
 * Renderiza el módulo de estadísticas
 */
function renderStatisticsModule() {
    const contentEl = document.getElementById('content');
    
    // Construir HTML del módulo
    let html = `
        <div class="alert alert-info mb-4">
            <i class="fas fa-chart-line me-2"></i>
            Este módulo muestra estadísticas detalladas de oyentes por emisora y permite exportar reportes.
            <span class="float-end">
                <small class="text-muted" id="real-time-indicator">
                    <i class="fas fa-circle text-success me-1"></i> Actualización en tiempo real activa
                </small>
            </span>
        </div>
        
        <!-- Controles y filtros -->
        <div class="card shadow mb-4">
            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                <h6 class="m-0 font-weight-bold text-primary">Filtros y Opciones</h6>
                <div>
                    <span class="text-muted me-2">Última actualización: <span id="stats-last-update">${new Date().toLocaleTimeString()}</span></span>
                    <button class="btn btn-sm btn-outline-primary" id="refresh-stats-btn">
                        <i class="fas fa-sync-alt" id="refresh-stats-icon"></i>
                    </button>
                </div>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label class="form-label">Rango de fechas</label>
                            <div class="btn-group w-100" role="group">
                                <button type="button" class="btn ${dateRange === 'day' ? 'btn-primary' : 'btn-outline-primary'}" data-range="day">
                                    <i class="fas fa-calendar-day me-1"></i> Hoy
                                </button>
                                <button type="button" class="btn ${dateRange === 'week' ? 'btn-primary' : 'btn-outline-primary'}" data-range="week">
                                    <i class="fas fa-calendar-week me-1"></i> 7 días
                                </button>
                                <button type="button" class="btn ${dateRange === 'month' ? 'btn-primary' : 'btn-outline-primary'}" data-range="month">
                                    <i class="fas fa-calendar-alt me-1"></i> 30 días
                                </button>
                                <button type="button" class="btn ${dateRange === 'custom' ? 'btn-primary' : 'btn-outline-primary'}" data-range="custom">
                                    <i class="fas fa-calendar-check me-1"></i> Personalizado
                                </button>
                            </div>
                        </div>
                        
                        <div id="custom-date-range" class="mb-3 ${dateRange === 'custom' ? '' : 'd-none'}">
                            <div class="row">
                                <div class="col-md-6">
                                    <label for="start-date" class="form-label">Fecha inicio</label>
                                    <input type="date" class="form-control" id="start-date" value="${customStartDate}">
                                </div>
                                <div class="col-md-6">
                                    <label for="end-date" class="form-label">Fecha fin</label>
                                    <input type="date" class="form-control" id="end-date" value="${customEndDate}">
                                </div>
                            </div>
                            <div class="mt-2">
                                <button type="button" class="btn btn-success btn-sm" id="apply-custom-range">
                                    <i class="fas fa-check me-1"></i> Aplicar rango
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-md-6">
                        <div class="mb-3">
                            <label for="station-filter" class="form-label">Filtrar por estación</label>
                            <select class="form-select" id="station-filter">
                                <option value="all">Todas las estaciones</option>
                                ${renderStationOptions()}
                            </select>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Exportar datos</label>
                            <div class="d-flex gap-2">
                                <div class="btn-group">
                                    <button type="button" class="btn btn-success" id="export-excel">
                                        <i class="fas fa-file-excel me-1"></i> Excel
                                    </button>
                                    <button type="button" class="btn btn-success" id="export-csv">
                                        <i class="fas fa-file-csv me-1"></i> CSV
                                    </button>
                                    <button type="button" class="btn btn-danger" id="export-pdf">
                                        <i class="fas fa-file-pdf me-1"></i> PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div class="form-check form-switch mt-3">
                            <input class="form-check-input" type="checkbox" id="real-time-toggle" ${realTimeUpdate ? 'checked' : ''}>
                            <label class="form-check-label" for="real-time-toggle">Actualización en tiempo real</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Tarjetas de resumen -->
        <div class="row mb-4">
            <!-- Total de oyentes -->
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-primary shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-primary text-uppercase mb-1">
                                    Total de Oyentes
                                </div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800" id="total-listeners-count">
                                    ${statsData.summary?.total_listeners || 0}
                                </div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-headphones fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Promedio diario -->
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-success shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-success text-uppercase mb-1">
                                    Promedio Diario
                                </div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800" id="avg-daily-listeners">
                                    ${statsData.summary?.avg_daily || 0}
                                </div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-calendar fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Pico máximo -->
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-info shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-info text-uppercase mb-1">
                                    Pico Máximo de Audiencia
                                </div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800" id="peak-listeners">
                                    ${statsData.summary?.peak_listeners || 0}
                                </div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-chart-line fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Estación más popular -->
            <div class="col-xl-3 col-md-6 mb-4">
                <div class="card border-left-warning shadow h-100 py-2">
                    <div class="card-body">
                        <div class="row no-gutters align-items-center">
                            <div class="col mr-2">
                                <div class="text-xs font-weight-bold text-warning text-uppercase mb-1">
                                    Estación Más Popular
                                </div>
                                <div class="h5 mb-0 font-weight-bold text-gray-800" id="most-popular-station">
                                    ${statsData.summary?.most_popular || 'N/A'}
                                </div>
                            </div>
                            <div class="col-auto">
                                <i class="fas fa-trophy fa-2x text-gray-300"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Gráficos y visualización de datos -->
        <div class="row mb-4">
            <!-- Gráfico principal de oyentes -->
            <div class="col-12">
                <div class="card shadow mb-4">
                    <div class="card-header py-3 d-flex justify-content-between align-items-center">
                        <h6 class="m-0 font-weight-bold text-primary">Tendencia de Oyentes</h6>
                        <div>
                            <button class="btn btn-sm btn-outline-secondary chart-option" data-view="line" data-toggle="tooltip" title="Gráfico de línea">
                                <i class="fas fa-chart-line"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary chart-option" data-view="bar" data-toggle="tooltip" title="Gráfico de barras">
                                <i class="fas fa-chart-bar"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-secondary chart-option" data-view="area" data-toggle="tooltip" title="Gráfico de área">
                                <i class="fas fa-chart-area"></i>
                            </button>
                        </div>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" style="position: relative; height:300px;">
                            <canvas id="listeners-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Distribución de oyentes por estación -->
            <div class="col-lg-6">
                <div class="card shadow mb-4">
                    <div class="card-header py-3">
                        <h6 class="m-0 font-weight-bold text-primary">Distribución por Estación</h6>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" style="position: relative; height:250px;">
                            <canvas id="distribution-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Horas pico -->
            <div class="col-lg-6">
                <div class="card shadow mb-4">
                    <div class="card-header py-3">
                        <h6 class="m-0 font-weight-bold text-primary">Horas Pico de Audiencia</h6>
                    </div>
                    <div class="card-body">
                        <div class="chart-container" style="position: relative; height:250px;">
                            <canvas id="peak-hours-chart"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Tabla de datos detallados -->
        <div class="card shadow mb-4">
            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                <h6 class="m-0 font-weight-bold text-primary">Datos Detallados</h6>
                <button class="btn btn-sm btn-outline-primary" id="toggle-table-btn" data-toggle="tooltip" title="Expandir/Colapsar tabla">
                    <i class="fas fa-expand-alt"></i>
                </button>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-bordered" id="stats-table">
                        <thead>
                            <tr>
                                <th>Fecha/Hora</th>
                                <th>Estación</th>
                                <th>Oyentes</th>
                                <th>Duración promedio</th>
                                <th>Pico máximo</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderStatsTableRows()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
    
    contentEl.innerHTML = html;
    
    // Inicializar gráficos después de renderizar el HTML
    initializeCharts();
    
    // Inicializar DataTable para la tabla de estadísticas
    $('#stats-table').DataTable({
        order: [[0, 'desc']],
        pageLength: 10,
        language: {
            url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
        },
        responsive: true
    });
    
    // Inicializar tooltips
    initializeTooltips();
}

/**
 * Inicializa los tooltips
 */
function initializeTooltips() {
    // Eliminar tooltips existentes para evitar duplicados
    document.querySelectorAll('[data-toggle="tooltip"]').forEach(el => {
        const tooltip = bootstrap.Tooltip.getInstance(el);
        if (tooltip) {
            tooltip.dispose();
        }
    });
    
    // Inicializar nuevos tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-toggle="tooltip"]');
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl, {
        trigger: 'hover',
        delay: { show: 500, hide: 100 }
    }));
}

/**
 * Renderiza las opciones de estación para el selector
 * @returns {string} - HTML de las opciones
 */
function renderStationOptions() {
    if (!statsData || !statsData.stations || !statsData.stations.length) {
        return '';
    }
    
    return statsData.stations.map(station => `
        <option value="${station.id}" ${station.id === currentStationFilter ? 'selected' : ''}>
            ${station.name}
        </option>
    `).join('');
}

/**
 * Renderiza las filas de la tabla de estadísticas
 * @returns {string} - HTML de las filas
 */
function renderStatsTableRows() {
    if (!statsData || !statsData.data || !statsData.data.length) {
        return '<tr><td colspan="5" class="text-center">No hay datos disponibles</td></tr>';
    }
    
    return statsData.data.map(item => `
        <tr>
            <td>${formatDateTime(item.timestamp)}</td>
            <td>${item.station_name}</td>
            <td>${item.listeners}</td>
            <td>${item.avg_time} minutos</td>
            <td>${item.peak_listeners}</td>
        </tr>
    `).join('');
}

/**
 * Actualiza los datos de la tabla de estadísticas
 */
function updateStatsTable() {
    const table = $('#stats-table').DataTable();
    
    // Limpiar la tabla
    table.clear();
    
    // Añadir nuevos datos
    if (statsData && statsData.data && statsData.data.length > 0) {
        statsData.data.forEach(item => {
            table.row.add([
                formatDateTime(item.timestamp),
                item.station_name,
                item.listeners,
                item.peak_listeners,
                item.avg_time + ' minutos'
            ]);
        });
    }
    
    // Redibujar la tabla
    table.draw();
    
    // Actualizar tarjetas de resumen
    updateSummaryCards();
}

/**
 * Actualiza las tarjetas de resumen con los nuevos datos
 */
function updateSummaryCards() {
    if (!statsData || !statsData.summary) return;
    
    // Actualizar total de oyentes
    const totalListenersEl = document.getElementById('total-listeners-count');
    if (totalListenersEl) {
        totalListenersEl.textContent = statsData.summary.total_listeners || 0;
    }
    
    // Actualizar promedio diario
    const avgDailyEl = document.getElementById('avg-daily-listeners');
    if (avgDailyEl) {
        avgDailyEl.textContent = statsData.summary.avg_daily || 0;
    }
    
    // Actualizar pico máximo
    const peakListenersEl = document.getElementById('peak-listeners');
    if (peakListenersEl) {
        peakListenersEl.textContent = statsData.summary.peak_listeners || 0;
    }
    
    // Actualizar estación más popular
    const popularStationEl = document.getElementById('most-popular-station');
    if (popularStationEl) {
        popularStationEl.textContent = statsData.summary.most_popular || 'N/A';
    }
}

/**
 * Inicializa los gráficos
 */
function initializeCharts() {
    // Limpiar gráficos anteriores
    charts.forEach(chart => chart.destroy());
    charts = [];
    
    // Obtener tema para los gráficos
    const theme = getChartTheme();
    
    // Crear el gráfico de tendencia de oyentes
    const listenersCtx = document.getElementById('listeners-chart').getContext('2d');
    const listenersChart = new Chart(listenersCtx, {
        type: 'line',
        data: prepareListenersChartData(),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        color: theme.gridColor
                    },
                    ticks: {
                        color: theme.textColor
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: theme.gridColor
                    },
                    ticks: {
                        color: theme.textColor
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: theme.textColor
                    }
                },
                tooltip: {
                    backgroundColor: theme.tooltipBackgroundColor,
                    titleColor: theme.titleColor,
                    bodyColor: theme.textColor,
                    borderColor: theme.tooltipBorderColor,
                    borderWidth: 1
                }
            }
        }
    });
    charts.push(listenersChart);
    
    // Crear el gráfico de distribución
    const distributionCtx = document.getElementById('distribution-chart').getContext('2d');
    const distributionChart = new Chart(distributionCtx, {
        type: 'doughnut',
        data: prepareDistributionChartData(),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: theme.textColor
                    }
                },
                tooltip: {
                    backgroundColor: theme.tooltipBackgroundColor,
                    titleColor: theme.titleColor,
                    bodyColor: theme.textColor,
                    borderColor: theme.tooltipBorderColor,
                    borderWidth: 1
                }
            }
        }
    });
    charts.push(distributionChart);
    
    // Crear el gráfico de horas pico
    const peakHoursCtx = document.getElementById('peak-hours-chart').getContext('2d');
    const peakHoursChart = new Chart(peakHoursCtx, {
        type: 'bar',
        data: preparePeakHoursChartData(),
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    grid: {
                        color: theme.gridColor
                    },
                    ticks: {
                        color: theme.textColor
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: theme.gridColor
                    },
                    ticks: {
                        color: theme.textColor
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: theme.tooltipBackgroundColor,
                    titleColor: theme.titleColor,
                    bodyColor: theme.textColor,
                    borderColor: theme.tooltipBorderColor,
                    borderWidth: 1
                }
            }
        }
    });
    charts.push(peakHoursChart);
}

/**
 * Actualiza los datos de los gráficos
 */
function updateChartsData() {
    if (charts.length < 3) return;
    
    // Actualizar gráfico de oyentes
    charts[0].data = prepareListenersChartData();
    charts[0].update();
    
    // Actualizar gráfico de distribución
    charts[1].data = prepareDistributionChartData();
    charts[1].update();
    
    // Actualizar gráfico de horas pico
    charts[2].data = preparePeakHoursChartData();
    charts[2].update();
}

/**
 * Prepara los datos para el gráfico de tendencia de oyentes
 * @returns {Object} - Datos para el gráfico
 */
function prepareListenersChartData() {
    if (!statsData || !statsData.listeners_trend) {
        // Datos de ejemplo si no hay datos reales
        const labels = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const datasets = [{
            label: 'Todas las estaciones',
            data: [65, 59, 80, 81, 56, 55, 40],
            borderColor: '#4e73df',
            backgroundColor: 'rgba(78, 115, 223, 0.1)',
            borderWidth: 2,
            fill: false,
            tension: 0.1,
        }];
        return { labels, datasets };
    }
    
    // Usar los datos reales
    const trend = statsData.listeners_trend;
    
    // Formatear las etiquetas de fecha/hora
    const labels = trend.labels.map(timestamp => {
        const date = new Date(timestamp * 1000);
        return formatDateForChart(date);
    });
    
    // Crear los datasets para cada estación
    const datasets = [];
    
    if (currentStationFilter === 'all') {
        // Si estamos viendo todas las estaciones, mostrar cada una con un color diferente
        const stationIds = Object.keys(trend.stations);
        const colors = getChartColors(stationIds.length);
        
        stationIds.forEach((stationId, index) => {
            const station = trend.stations[stationId];
            datasets.push({
                label: station.name,
                data: station.data,
                borderColor: colors[index],
                backgroundColor: hexToRgba(colors[index], 0.1),
                borderWidth: 2,
                fill: false,
                tension: 0.1,
            });
        });
        
        // Agregar también el total como una línea punteada más gruesa
        datasets.push({
            label: 'Total',
            data: trend.total,
            borderColor: '#000',
            backgroundColor: 'rgba(0, 0, 0, 0)',
            borderWidth: 3,
            borderDash: [5, 5],
            fill: false,
            tension: 0.1,
        });
    } else {
        // Si estamos filtrando por una estación específica, solo mostrar esa
        const station = trend.stations[currentStationFilter];
        if (station) {
            datasets.push({
                label: station.name,
                data: station.data,
                borderColor: '#4e73df',
                backgroundColor: 'rgba(78, 115, 223, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0.1,
            });
        }
    }
    
    return { labels, datasets };
}

/**
 * Prepara los datos para el gráfico de distribución
 * @returns {Object} - Datos para el gráfico
 */
function prepareDistributionChartData() {
    if (!statsData || !statsData.distribution) {
        // Datos de ejemplo si no hay datos reales
        const labels = ['Radio A', 'Radio B', 'Radio C', 'Radio D'];
        const data = [35, 25, 22, 18];
        const backgroundColor = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e'];
        return {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: backgroundColor,
                hoverOffset: 4
            }]
        };
    }
    
    // Usar datos reales
    const distribution = statsData.distribution;
    const labels = distribution.map(item => item.name);
    const data = distribution.map(item => item.value);
    const backgroundColor = getChartColors(labels.length);
    
    return {
        labels: labels,
        datasets: [{
            data: data,
            backgroundColor: backgroundColor,
            hoverOffset: 4
        }]
    };
}

/**
 * Prepara los datos para el gráfico de horas pico
 * @returns {Object} - Datos para el gráfico
 */
function preparePeakHoursChartData() {
    if (!statsData || !statsData.peak_hours) {
        // Datos de ejemplo si no hay datos reales
        const labels = ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm', '12am'];
        const data = [20, 35, 45, 30, 25, 35, 55, 75, 60, 25];
        return {
            labels: labels,
            datasets: [{
                label: 'Oyentes promedio',
                data: data,
                backgroundColor: 'rgba(54, 185, 204, 0.7)',
                borderColor: '#36b9cc',
                borderWidth: 1
            }]
        };
    }
    
    // Usar datos reales
    const peakHours = statsData.peak_hours;
    const labels = [];
    const data = [];
    
    // Ordenar las horas cronológicamente
    const hours = Object.keys(peakHours).sort((a, b) => parseInt(a) - parseInt(b));
    
    hours.forEach(hour => {
        // Convertir formato 24h a 12h para las etiquetas
        const hourNum = parseInt(hour);
        const displayHour = hourNum === 0 || hourNum === 12 ? 12 : hourNum % 12;
        const amPm = hourNum < 12 ? 'am' : 'pm';
        labels.push(`${displayHour}${amPm}`);
        data.push(peakHours[hour]);
    });
    
    return {
        labels: labels,
        datasets: [{
            label: 'Oyentes promedio',
            data: data,
            backgroundColor: 'rgba(54, 185, 204, 0.7)',
            borderColor: '#36b9cc',
            borderWidth: 1
        }]
    };
}

/**
 * Configura los eventos del módulo de estadísticas
 */
function setupStatisticsEvents() {
    // Manejador de cambios de rango de fechas
    document.querySelectorAll('button[data-range]').forEach(button => {
        button.addEventListener('click', function() {
            const newRange = this.getAttribute('data-range');
            
            // Actualizar UI
            document.querySelectorAll('button[data-range]').forEach(btn => {
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-outline-primary');
            });
            this.classList.remove('btn-outline-primary');
            this.classList.add('btn-primary');
            
            // Mostrar/ocultar selectores de fecha personalizada
            const customDateEl = document.getElementById('custom-date-range');
            if (customDateEl) {
                customDateEl.classList.toggle('d-none', newRange !== 'custom');
            }
            
            // Solo actualizar datos si cambia el rango o si es personalizado y se presiona aplicar
            if (dateRange !== newRange && newRange !== 'custom') {
                dateRange = newRange;
                reloadStatsData();
            } else {
                dateRange = newRange;
            }
        });
    });
    
    // Manejador para aplicar rango personalizado
    const applyRangeBtn = document.getElementById('apply-custom-range');
    if (applyRangeBtn) {
        applyRangeBtn.addEventListener('click', function() {
            const startEl = document.getElementById('start-date');
            const endEl = document.getElementById('end-date');
            if (startEl && endEl) {
                customStartDate = startEl.value;
                customEndDate = endEl.value;
                
                // Validar fechas
                if (!customStartDate || !customEndDate) {
                    alert('Por favor seleccione fechas de inicio y fin');
                    return;
                }
                
                reloadStatsData();
            }
        });
    }
    
    // Manejador para cambios de estación
    const stationFilter = document.getElementById('station-filter');
    if (stationFilter) {
        stationFilter.addEventListener('change', function() {
            currentStationFilter = this.value;
            filterStatsByStation(this.value);
        });
    }
    
    // Manejador para cambio de tipo de gráfico
    document.querySelectorAll('.chart-option').forEach(button => {
        button.addEventListener('click', function() {
            document.querySelectorAll('.chart-option').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            const chartType = this.getAttribute('data-view');
            changeChartType(chartType);
        });
    });
    
    // Manejadores para exportación
    const exportExcelBtn = document.getElementById('export-excel');
    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', function() {
            exportToExcel();
        });
    }
    
    const exportCsvBtn = document.getElementById('export-csv');
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', function() {
            exportToCSV();
        });
    }
    
    const exportPdfBtn = document.getElementById('export-pdf');
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', function() {
            exportToPDF();
        });
    }
    
    // Botón de actualización manual
    const refreshStatsBtn = document.getElementById('refresh-stats-btn');
    if (refreshStatsBtn) {
        refreshStatsBtn.addEventListener('click', function() {
            updateStatsData();
        });
    }
    
    // Toggle tabla expandida
    const toggleTableBtn = document.getElementById('toggle-table-btn');
    if (toggleTableBtn) {
        toggleTableBtn.addEventListener('click', function() {
            const tableContainer = document.querySelector('.table-responsive');
            if (tableContainer) {
                tableContainer.classList.toggle('fullscreen-table');
                
                // Actualizar icono
                const icon = this.querySelector('i');
                if (icon) {
                    if (tableContainer.classList.contains('fullscreen-table')) {
                        icon.className = 'fas fa-compress-alt';
                        this.setAttribute('data-bs-title', 'Contraer tabla');
                    } else {
                        icon.className = 'fas fa-expand-alt';
                        this.setAttribute('data-bs-title', 'Expandir tabla');
                    }
                    
                    // Actualizar tooltip
                    const tooltip = bootstrap.Tooltip.getInstance(this);
                    if (tooltip) {
                        tooltip.dispose();
                        new bootstrap.Tooltip(this, {
                            trigger: 'hover',
                            delay: { show: 500, hide: 100 }
                        });
                    }
                }
            }
        });
    }
    
    // Toggle actualización en tiempo real
    const realTimeToggle = document.getElementById('real-time-toggle');
    if (realTimeToggle) {
        realTimeToggle.addEventListener('change', function() {
            realTimeUpdate = this.checked;
            
            const indicator = document.getElementById('real-time-indicator');
            if (indicator) {
                if (realTimeUpdate) {
                    indicator.innerHTML = '<i class="fas fa-circle text-success me-1"></i> Actualización en tiempo real activa';
                    startRealTimeUpdates();
                } else {
                    indicator.innerHTML = '<i class="fas fa-circle text-secondary me-1"></i> Actualización en tiempo real inactiva';
                    if (realTimeInterval) {
                        clearInterval(realTimeInterval);
                        realTimeInterval = null;
                    }
                }
            }
        });
    }
}

/**
 * Exporta los datos a formato Excel
 */
function exportToExcel() {
    // Mostrar indicador de carga
    const exportBtn = document.getElementById('export-excel');
    const originalText = exportBtn.innerHTML;
    exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Exportando...';
    exportBtn.disabled = true;
    
    try {
        // Usar la función de excel-export.js
        if (typeof exportStatisticsToExcel === 'function') {
            exportStatisticsToExcel(statsData, getDateRangeText(), currentStationFilter);
        } else {
            // Alternativa si no está disponible la función especializada
            exportViaAPI();
        }
    } catch (error) {
        console.error('Error al exportar a Excel:', error);
        alert('Error al exportar a Excel: ' + error.message);
    } finally {
        // Restaurar botón
        setTimeout(() => {
            exportBtn.innerHTML = originalText;
            exportBtn.disabled = false;
        }, 1000);
    }
}

/**
 * Exporta los datos a formato CSV
 */
function exportToCSV() {
    // Mostrar indicador de carga
    const exportBtn = document.getElementById('export-csv');
    const originalText = exportBtn.innerHTML;
    exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Exportando...';
    exportBtn.disabled = true;
    
    try {
        // Usar la función de excel-export.js
        if (typeof exportStatisticsToCSV === 'function') {
            exportStatisticsToCSV(statsData);
        } else {
            // Alternativa si no está disponible la función especializada
            exportViaAPI('csv');
        }
    } catch (error) {
        console.error('Error al exportar a CSV:', error);
        alert('Error al exportar a CSV: ' + error.message);
    } finally {
        // Restaurar botón
        setTimeout(() => {
            exportBtn.innerHTML = originalText;
            exportBtn.disabled = false;
        }, 1000);
    }
}

/**
 * Exporta los datos a PDF
 */
function exportToPDF() {
    // Mostrar indicador de carga
    const exportBtn = document.getElementById('export-pdf');
    const originalText = exportBtn.innerHTML;
    exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Exportando...';
    exportBtn.disabled = true;
    
    try {
        // Usar la función de pdf-export.js
        if (typeof exportStatisticsToPDF === 'function') {
            exportStatisticsToPDF(statsData, getDateRangeText(), currentStationFilter)
                .finally(() => {
                    // Restaurar botón
                    exportBtn.innerHTML = originalText;
                    exportBtn.disabled = false;
                });
        } else {
            alert('La funcionalidad de exportación a PDF no está disponible');
            exportBtn.innerHTML = originalText;
            exportBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error al exportar a PDF:', error);
        alert('Error al exportar a PDF: ' + error.message);
        exportBtn.innerHTML = originalText;
        exportBtn.disabled = false;
    }
}

/**
 * Exporta datos via API
 * @param {string} format - Formato de exportación (excel, csv)
 */
function exportViaAPI(format = 'excel') {
    // Generar URL para la exportación
    let url = `api/export-statistics.php?format=${format}&range=${dateRange}`;
    
    // Si es rango personalizado, añadir fechas
    if (dateRange === 'custom') {
        url += `&start=${customStartDate}&end=${customEndDate}`;
    }
    
    // Si hay un filtro por estación aplicado
    if (currentStationFilter !== 'all') {
        url += `&station=${currentStationFilter}`;
    }
    
    // Abrir la URL en una nueva pestaña
    window.open(url, '_blank');
}

/**
 * Agregar enlace a la hoja de estilos
 */
function loadStatisticsStyles() {
    if (!document.getElementById('statistics-css')) {
        const link = document.createElement('link');
        link.id = 'statistics-css';
        link.rel = 'stylesheet';
        link.href = 'css/statistics.css';
        document.head.appendChild(link);
    }
}

// Cargar estilos al iniciar
document.addEventListener('DOMContentLoaded', loadStatisticsStyles);

/**
 * Recarga los datos con nuevos filtros
 */
function reloadStatsData() {
    // Mostrar loader mientras se cargan los datos
    showLoader();
    
    fetchStatsData(dateRange)
        .then(data => {
            if (data.error) {
                showError(data.message || 'Error al cargar las estadísticas');
                return;
            }
            
            // Almacenar datos
            statsData = data;
            
            // Renderizar el módulo
            renderStatisticsModule();
            
            // Configurar eventos
            setupStatisticsEvents();
        })
        .catch(error => {
            console.error('Error al cargar estadísticas:', error);
            showError('Error al cargar el módulo de estadísticas: ' + error.message);
        });
}

/**
 * Filtra las estadísticas por estación seleccionada
 * @param {string} stationId - ID de la estación para filtrar
 */
function filterStatsByStation(stationId) {
    currentStationFilter = stationId;
    
    // Si hay un cambio de filtro, actualizar los gráficos sin recargar datos
    if (statsData) {
        updateChartsData();
        updateSummaryCards();
    } else {
        reloadStatsData();
    }
}

/**
 * Cambia el tipo de gráfico de tendencia
 * @param {string} type - Tipo de gráfico ('line', 'bar', 'area')
 */
function changeChartType(type) {
    if (!charts || charts.length === 0 || !statsData) return;
    
    // El primer gráfico es el de tendencia
    const chart = charts[0];
    
    switch (type) {
        case 'bar':
            chart.config.type = 'bar';
            chart.data.datasets.forEach((dataset) => {
                dataset.fill = false;
                dataset.borderRadius = 4;
                dataset.borderWidth = 1;
            });
            break;
        case 'area':
            chart.config.type = 'line';
            chart.data.datasets.forEach((dataset, i) => {
                if (dataset.label !== 'Total') { // No aplicar fill al dataset de total
                    dataset.fill = true;
                    dataset.backgroundColor = hexToRgba(dataset.borderColor, 0.2);
                }
            });
            break;
        case 'line':
        default:
            chart.config.type = 'line';
            chart.data.datasets.forEach((dataset) => {
                dataset.fill = false;
            });
            break;
    }
    
    chart.update();
}

/**
 * Formatea una fecha y hora para mostrar
 * @param {number} timestamp - Timestamp Unix
 * @returns {string} - Fecha y hora formateada
 */
function formatDateTime(timestamp) {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
}

/**
 * Formatea una fecha para mostrar
 * @param {Date} date - Objeto Date
 * @returns {string} - Fecha formateada como YYYY-MM-DD
 */
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Obtiene el texto descriptivo del rango de fechas actual
 * @returns {string} - Texto descriptivo
 */
function getDateRangeText() {
    switch (dateRange) {
        case 'day':
            return 'Hoy';
        case 'week':
            return 'Últimos 7 días';
        case 'month':
            return 'Últimos 30 días';
        case 'custom':
            return `${customStartDate} a ${customEndDate}`;
        default:
            return 'Personalizado';
    }
}

/**
 * Obtiene colores para gráficos
 * @param {number} count - Número de colores necesarios
 * @returns {string[]} - Array de colores en formato hex
 */
function getChartColors(count) {
    const baseColors = [
        '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
        '#6f42c1', '#fd7e14', '#20c9a6', '#27a9e3', '#e83e8c'
    ];
    
    // Si necesitamos más colores, generarlos aleatoriamente
    if (count <= baseColors.length) {
        return baseColors.slice(0, count);
    }
    
    const colors = [...baseColors];
    for (let i = baseColors.length; i < count; i++) {
        colors.push(generateRandomColor());
    }
    return colors;
}

/**
 * Genera un color aleatorio
 * @returns {string} - Color en formato hex
 */
function generateRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

/**
 * Convierte un color hex a rgba
 * @param {string} hex - Color en formato hex
 * @param {number} alpha - Valor alpha entre 0 y 1
 * @returns {string} - Color en formato rgba
 */
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Formatea una fecha para mostrar en los gráficos
 * @param {Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
function formatDateForChart(date) {
    switch (dateRange) {
        case 'day':
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        case 'week':
            return date.toLocaleDateString([], { weekday: 'short', day: 'numeric' });
        case 'month':
        case 'custom':
            return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
        default:
            return date.toLocaleDateString();
    }
}

/**
 * Muestra un error en el contenido
 * @param {string} message - Mensaje de error
 */
function showError(message) {
    const contentEl = document.getElementById('content');
    
    // Verificar si el mensaje de error es "could not find driver"
    const isSqliteDriverError = message.toLowerCase().includes('could not find driver');
    
    contentEl.innerHTML = `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
        </div>
        <div class="mt-3">
            <button class="btn btn-primary" onclick="loadStatistics()">
                <i class="fas fa-redo-alt me-2"></i> Reintentar
            </button>
            ${isSqliteDriverError ? `
                <a href="fix-sqlite.php" class="btn btn-warning ms-2">
                    <i class="fas fa-wrench me-2"></i> Solucionar problema de SQLite
                </a>
                <div class="mt-3 alert alert-info">
                    <p><strong>Diagnóstico:</strong> El error "could not find driver" indica que la extensión PDO_SQLite no está habilitada en su servidor PHP.</p>
                    <p>Para solucionar este problema, necesita habilitar esta extensión en su archivo php.ini. Haga clic en "Solucionar problema de SQLite" para obtener instrucciones detalladas.</p>
                </div>
            ` : ''}
        </div>
    `;
}

/**
 * Muestra un loader mientras se cargan los datos
 */
function showLoader() {
    const contentEl = document.getElementById('content');
    contentEl.innerHTML = `
        <div class="d-flex justify-content-center my-5">
            <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                <span class="visually-hidden">Cargando...</span>
            </div>
        </div>
        <p class="text-center text-muted">Cargando estadísticas...</p>
    `;
}

/**
 * Inicializa y aplica un tema para los gráficos
 */
function initializeChartTheme() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    Chart.defaults.borderColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    Chart.defaults.color = isDarkMode ? '#e9ecef' : '#666';
    
    if (charts.length > 0) {
        charts.forEach(chart => chart.update());
    }
}

// Registrar evento para actualizar cuando cambie el tema
document.addEventListener('themeChanged', function() {
    if (Config.currentSection === 'statistics' && charts.length > 0) {
        initializeChartTheme();
        charts.forEach(chart => chart.update());
    }
});

// Iniciar funcionalidad de estadísticas cuando se carga el documento
document.addEventListener('DOMContentLoaded', function() {
    // Cargar estilos y preparar el módulo
    loadStatisticsStyles();
    
    // Si es la sección activa, cargarla
    if (document.querySelector('.nav-link[data-section="statistics"].active')) {
        loadStatistics();
    }
});