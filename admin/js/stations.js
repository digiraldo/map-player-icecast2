/**
 * Módulo de gestión de estaciones
 */

// Variables globales del módulo
let stationsData = null;
let filteredStations = [];
let currentFilter = '';
let currentSort = 'status';
let currentlyPlaying = null; // Para rastrear la estación que se está reproduciendo actualmente
let audioPlayer = null; // Elemento de audio para reproducción

/**
 * Carga el módulo de estaciones
 */
function loadStations() {
    console.log('Cargando módulo de estaciones...');
    
    // Mostrar loader mientras se cargan los datos
    showLoader();
    
    // Obtener los datos de las estaciones
    fetchData('get-listeners.php').then(data => {
        if (data.error) {
            showError(data.message || 'Error al cargar los datos de estaciones');
            return;
        }
        
        // Almacenar datos originales
        stationsData = data;
        
        // Renderizar el módulo
        renderStationsModule(data);
        
        // Configurar eventos y funcionalidades adicionales
        setupStationsEvents();
        
        // Inicializar tooltips
        initializeTooltips();
        
        // Configurar actualización automática
        if (updateTimer) clearInterval(updateTimer);
        updateTimer = setInterval(() => {
            updateStationsData();
        }, Config.updateInterval);
        
    }).catch(error => {
        showError('Error al cargar las estaciones: ' + error.message);
    });
}

/**
 * Renderiza el módulo de estaciones
 * @param {Object} data - Datos de estaciones
 */
function renderStationsModule(data) {
    const contentEl = document.getElementById('content');
    const stations = data.stations || [];
    
    // Aplicar filtro si existe
    filteredStations = stations;
    if (currentFilter) {
        if (currentFilter === 'online') {
            filteredStations = stations.filter(station => station.online);
        } else if (currentFilter === 'offline') {
            filteredStations = stations.filter(station => !station.online);
        }
    }
    
    // Aplicar ordenamiento
    sortStations(filteredStations, currentSort);
    
    // Estadísticas generales
    const totalStations = stations.length;
    const onlineStations = stations.filter(station => station.online).length;
    const offlineStations = totalStations - onlineStations;
    const totalListeners = stations.reduce((sum, station) => sum + (station.listeners || 0), 0);
    
    // Construir HTML del módulo
    let html = `
        <!-- Estadísticas y filtros -->
        <div class="row mb-4">
            <!-- Estadísticas -->
            <div class="col-md-6 mb-3 mb-md-0">
                <div class="card shadow-sm">
                    <div class="card-body py-2">
                        <div class="row text-center">
                            <div class="col">
                                <h6 class="text-primary mb-1">Total</h6>
                                <h4>${totalStations}</h4>
                            </div>
                            <div class="col">
                                <h6 class="text-success mb-1">Online</h6>
                                <h4>${onlineStations}</h4>
                            </div>
                            <div class="col">
                                <h6 class="text-danger mb-1">Offline</h6>
                                <h4>${offlineStations}</h4>
                            </div>
                            <div class="col">
                                <h6 class="text-info mb-1">Oyentes</h6>
                                <h4 id="stations-total-listeners">${totalListeners}</h4>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Filtros -->
            <div class="col-md-6">
                <div class="d-flex justify-content-end gap-2">
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-outline-secondary filter-btn ${currentFilter === '' ? 'active' : ''}" 
                          data-filter="" data-bs-toggle="tooltip" data-bs-title="Ver todas las estaciones">
                            <i class="fas fa-list me-1"></i> Todas
                        </button>
                        <button type="button" class="btn btn-outline-success filter-btn ${currentFilter === 'online' ? 'active' : ''}" 
                          data-filter="online" data-bs-toggle="tooltip" data-bs-title="Ver solo estaciones activas">
                            <i class="fas fa-signal me-1"></i> Online
                        </button>
                        <button type="button" class="btn btn-outline-danger filter-btn ${currentFilter === 'offline' ? 'active' : ''}" 
                          data-filter="offline" data-bs-toggle="tooltip" data-bs-title="Ver solo estaciones inactivas">
                            <i class="fas fa-times-circle me-1"></i> Offline
                        </button>
                    </div>
                    
                    <div class="btn-group" role="group">
                        <button type="button" class="btn btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown">
                            <i class="fas fa-sort me-1"></i> Ordenar
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <a class="dropdown-item sort-option ${currentSort === 'status' ? 'active' : ''}" 
                                  data-sort="status" href="#">
                                    <i class="fas fa-signal me-1"></i> Por estado
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item sort-option ${currentSort === 'listeners' ? 'active' : ''}" 
                                  data-sort="listeners" href="#">
                                    <i class="fas fa-headphones me-1"></i> Por oyentes
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item sort-option ${currentSort === 'name' ? 'active' : ''}" 
                                  data-sort="name" href="#">
                                    <i class="fas fa-font me-1"></i> Por nombre
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Tabla de estaciones -->
        <div class="card shadow mb-4">
            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                <h6 class="m-0 font-weight-bold text-primary">
                    ${getFilterTitle()}
                    <span class="badge ${getFilterBadgeClass()}">${filteredStations.length}</span>
                    <small class="text-muted ms-2" id="stations-update-time">Actualizado: ${new Date().toLocaleTimeString()}</small>
                </h6>
                <div class="input-group input-group-sm" style="width: 250px;">
                    <span class="input-group-text">
                        <i class="fas fa-search"></i>
                    </span>
                    <input type="text" class="form-control" id="stationSearchInput" placeholder="Buscar estación..." 
                          data-bs-toggle="tooltip" data-bs-title="Buscar por nombre, frecuencia o mount point">
                </div>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-bordered table-hover" id="stationsTable">
                        <thead>
                            <tr>
                                <th style="width: 80px;">Estado</th>
                                <th>Nombre</th>
                                <th>Frecuencia</th>
                                <th style="width: 100px;">Oyentes</th>
                                <th style="width: 100px;">Bitrate</th>
                                <th>Mount Point</th>
                                <th style="width: 120px;">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderStationRows(filteredStations)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
        
        <!-- Modal para detalles de estación -->
        <div class="modal fade" id="stationModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detalles de Estación</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="stationModalContent">
                        <!-- Contenido dinámico -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    contentEl.innerHTML = html;
    
    // Asegurarnos de tener un reproductor de audio
    createAudioPlayer();
}

/**
 * Genera las filas de la tabla de estaciones
 * @param {Array} stations - Array de estaciones
 * @returns {string} HTML de las filas
 */
function renderStationRows(stations) {
    if (!stations || stations.length === 0) {
        return `
            <tr>
                <td colspan="7" class="text-center">No hay estaciones disponibles que coincidan con los criterios.</td>
            </tr>
        `;
    }
    
    // Analizar la estructura de datos para encontrar ice-bitrate
    const onlineStation = stations.find(s => s.online);
    if (onlineStation) {
        console.log('ESTRUCTURA COMPLETA DE STATION:', JSON.stringify(onlineStation, null, 2));
        
        // Verificar todas las propiedades disponibles
        console.log('PROPIEDADES DISPONIBLES:');
        Object.keys(onlineStation).forEach(key => {
            console.log(`- ${key}: ${typeof onlineStation[key]} = ${onlineStation[key]}`);
        });
        
        // Buscar propiedades relacionadas con bitrate
        console.log('BUSQUEDA DE PROPIEDADES DE BITRATE:');
        Object.keys(onlineStation).forEach(key => {
            if (key.toLowerCase().includes('bit')) {
                console.log(`- ${key}: ${onlineStation[key]}`);
            }
        });
        
        // Intentar acceder específicamente al "ice-bitrate"
        console.log('ACCESO A ICE-BITRATE:');
        console.log('station["ice-bitrate"]:', onlineStation['ice-bitrate']);
        console.log('station.bitrate:', onlineStation.bitrate);
    }
    
    return stations.map(station => {
        // Asegurar que la URL de escucha es correcta
        const listenUrl = station.listenurl || '';
        const isPlaying = currentlyPlaying === station.serverUrl;
        
        // Obtener el bitrate de forma más robusta
        let bitrateValue = getBitrateValue(station);
        console.log(`Estación: ${station.name}, bitrate obtenido: ${bitrateValue}`);
        
        // Extraer información de audio para el tooltip
        const audioInfo = getAudioInfoDetails(station);
        const audioInfoTooltip = `${audioInfo.channelsText}, Tasa Muestreo: ${audioInfo.samplerate} Hz`;
        
        // Determinar si es Mono (M) o Estéreo (S)
        const channelBadge = audioInfo.channels === '2' || audioInfo.channels === 2 ? 'S' : 'M';
        // Clase de badge diferente según tipo de canal
        const badgeClass = channelBadge === 'M' ? 'text-bg-light' : 'text-bg-dark';
        
        return `
        <tr class="${station.online ? 'station-online' : 'station-offline'} ${isPlaying ? 'table-active' : ''}" data-station="${station.serverUrl}">
            <td class="text-center">
                ${station.online ? 
                    '<span class="badge bg-success"><i class="fas fa-signal me-1"></i> Online</span>' : 
                    '<span class="badge bg-danger"><i class="fas fa-times-circle me-1"></i> Offline</span>'
                }
            </td>
            <td>
                ${station.name || 'Sin nombre'}
                ${isPlaying ? '<div class="audio-playing-indicator text-primary"><span></span><span></span><span></span></div>' : ''}
            </td>
            <td>${station.frecuencia || 'N/A'}</td>
            <td class="text-center station-listeners">
                ${station.online ? 
                    `<span class="badge bg-info">${station.listeners || 0}</span>` : 
                    '<span class="text-muted">-</span>'
                }
            </td>
            <td class="text-center">
                ${station.online ? 
                    `<button class="btn ${getBitrateBadgeClass(bitrateValue).replace('badge text-bg', 'btn btn')} btn-sm bitrate-btn" 
                           data-bs-toggle="tooltip" 
                           data-bs-html="true"
                           data-bs-placement="top"
                           title="${audioInfoTooltip}">
                        ${bitrateValue}k
                        <span class="badge ${badgeClass}">${channelBadge}</span>
                    </button>` : 
                    '<span class="text-muted">-</span>'
                }
            </td>
            <td><code>${station.serverUrl || 'N/A'}</code></td>
            <td>
                <div class="btn-group btn-group-sm station-action-buttons">
                    <button type="button" class="btn btn-info station-info-btn" 
                        data-bs-toggle="tooltip" 
                        data-bs-title="Ver detalles de la estación" 
                        data-station="${station.serverUrl}">
                        <i class="fas fa-info-circle"></i>
                    </button>
                    ${station.online && listenUrl ? 
                        `<button type="button" class="btn ${isPlaying ? 'btn-primary play-pause-btn playing' : 'btn-success play-pause-btn'}" 
                             data-station="${station.serverUrl}" 
                             data-url="${listenUrl}"
                             data-bs-toggle="tooltip" 
                             data-bs-title="${isPlaying ? 'Detener reproducción' : 'Escuchar estación'}">
                            <i class="fas ${isPlaying ? 'fa-pause' : 'fa-play'}"></i>
                        </button>` : 
                        `<button type="button" class="btn btn-secondary" 
                             data-bs-toggle="tooltip" 
                             data-bs-title="Estación no disponible" 
                             disabled>
                            <i class="fas fa-play"></i>
                        </button>`
                    }
                    <button type="button" class="btn btn-primary station-diag-btn" 
                        data-bs-toggle="tooltip" 
                        data-bs-title="Diagnosticar conectividad" 
                        data-station="${station.serverUrl}">
                        <i class="fas fa-stethoscope"></i>
                    </button>
                </div>
            </td>
        </tr>
        `;
    }).join('');
}

/**
 * Inicializa todos los tooltips de la página
 */
function initializeTooltips() {
    // Eliminar tooltips existentes para evitar duplicados
    document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        const tooltip = bootstrap.Tooltip.getInstance(el);
        if (tooltip) {
            tooltip.dispose();
        }
    });
    
    // Inicializar nuevos tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl, {
        trigger: 'hover',
        delay: { show: 500, hide: 100 }
    }));
    
    // Específicamente para las insignias de bitrate
    document.querySelectorAll('.bitrate-badge').forEach(badge => {
        new bootstrap.Tooltip(badge, {
            trigger: 'hover',
            placement: 'top',
            delay: { show: 200, hide: 100 }
        });
    });
    
    // Específicamente para los botones de bitrate
    document.querySelectorAll('.bitrate-btn').forEach(btn => {
        new bootstrap.Tooltip(btn, {
            trigger: 'hover',
            placement: 'top',
            delay: { show: 200, hide: 100 }
        });
    });
}

/**
 * Crea y configura el reproductor de audio
 */
function createAudioPlayer() {
    // Si ya existe un reproductor en la página, lo usamos
    audioPlayer = document.getElementById('station-audio-player');
    
    // Si no existe, creamos uno nuevo
    if (!audioPlayer) {
        console.log('Creando reproductor de audio...');
        audioPlayer = document.createElement('audio');
        audioPlayer.id = 'station-audio-player';
        audioPlayer.style.display = 'none'; // Oculto, solo para reproducción
        document.body.appendChild(audioPlayer);
        
        // Añadir eventos para gestionar el estado de reproducción
        audioPlayer.addEventListener('play', updatePlayerState);
        audioPlayer.addEventListener('pause', updatePlayerState);
        audioPlayer.addEventListener('ended', resetPlayerState);
        audioPlayer.addEventListener('error', handlePlayerError);
    }
    
    return audioPlayer;
}

/**
 * Configura los eventos para el módulo de estaciones
 */
function setupStationsEvents() {
    // Búsqueda en tiempo real
    const searchInput = document.getElementById('stationSearchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            filterStationsBySearch(this.value);
        });
    }
    
    // Botones de filtro
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            currentFilter = filter;
            
            // Actualizar UI
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Aplicar filtro
            renderStationsModule(stationsData);
        });
    });
    
    // Opciones de ordenamiento
    document.querySelectorAll('.sort-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            
            const sort = this.getAttribute('data-sort');
            currentSort = sort;
            
            // Actualizar UI
            document.querySelectorAll('.sort-option').forEach(o => o.classList.remove('active'));
            this.classList.add('active');
            
            // Aplicar ordenamiento
            renderStationsModule(stationsData);
        });
    });
    
    // Botones de información de estación
    document.querySelectorAll('.station-info-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const stationId = this.getAttribute('data-station');
            const station = stationsData.stations.find(s => s.serverUrl === stationId);
            
            if (station) {
                // Destruir tooltip antes de mostrar el modal
                const tooltip = bootstrap.Tooltip.getInstance(this);
                if (tooltip) {
                    tooltip.dispose();
                }
                
                showStationDetails(station);
            }
        });
    });
    
    // Botones de diagnóstico
    document.querySelectorAll('.station-diag-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const stationId = this.getAttribute('data-station');
            const station = stationsData.stations.find(s => s.serverUrl === stationId);
            
            if (station) {
                showStationDiagnostics(station);
            }
        });
    });
    
    // Configurar eventos para los botones de reproducción
    document.querySelectorAll('.play-pause-btn').forEach(btn => {
        btn.addEventListener('click', handlePlayPause);
    });
}

/**
 * Maneja la reproducción/pausa de una estación
 * @param {Event} event - Evento del clic
 */
function handlePlayPause(event) {
    event.preventDefault(); // Prevenir navegación por defecto
    event.stopPropagation(); // Evitar propagación a elementos padre
    
    const button = event.currentTarget;
    const stationId = button.getAttribute('data-station');
    const audioUrl = button.getAttribute('data-url');
    
    console.log('Play/Pause clicked:', stationId, audioUrl);
    
    // Si ya está reproduciendo esta estación, pausar
    if (currentlyPlaying === stationId) {
        pauseAudio();
        return;
    }
    
    // Si está reproduciendo otra estación, detener primero
    if (currentlyPlaying) {
        resetPlayerState();
    }
    
    // Reproducir la nueva estación
    playAudio(audioUrl, stationId);
    
    // Actualizar el estado visual
    currentlyPlaying = stationId;
    updateButtonState(stationId, true);
    
    // Mostrar una notificación
    const station = stationsData.stations.find(s => s.serverUrl === stationId);
    showPlayingNotification(station);
}

/**
 * Reproduce una URL de audio
 * @param {string} url - URL del stream de audio
 * @param {string} stationId - ID de la estación
 */
function playAudio(url, stationId) {
    if (!audioPlayer) return;
    
    audioPlayer.src = url;
    audioPlayer.crossOrigin = "anonymous"; // Para evitar problemas CORS
    
    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.error('Error al reproducir audio:', error);
            resetPlayerState();
            alert('Error al reproducir la estación: ' + error.message);
        });
    }
    
    currentlyPlaying = stationId;
}

/**
 * Pausa la reproducción actual
 */
function pauseAudio() {
    if (!audioPlayer || !currentlyPlaying) return;
    
    audioPlayer.pause();
    updateButtonState(currentlyPlaying, false);
    currentlyPlaying = null;
}

/**
 * Actualiza el estado de todos los botones de reproducción
 */
function updatePlayerState() {
    if (!currentlyPlaying) return;
    
    document.querySelectorAll('.play-pause-btn').forEach(btn => {
        const stationId = btn.getAttribute('data-station');
        updateButtonState(stationId, stationId === currentlyPlaying && !audioPlayer.paused);
    });
}

/**
 * Actualiza el estado visual de un botón específico
 * @param {string} stationId - ID de la estación
 * @param {boolean} isPlaying - Si está reproduciendo o no
 */
function updateButtonState(stationId, isPlaying) {
    const button = document.querySelector(`.play-pause-btn[data-station="${stationId}"]`);
    if (!button) return;
    
    if (isPlaying) {
        button.classList.remove('btn-success');
        button.classList.add('btn-primary', 'playing');
        button.setAttribute('data-bs-title', 'Detener reproducción');
        button.querySelector('i').className = 'fas fa-pause';
        
        const row = button.closest('tr');
        if (row) {
            row.classList.add('table-active');
        }
    } else {
        button.classList.remove('btn-primary', 'playing');
        button.classList.add('btn-success');
        button.setAttribute('data-bs-title', 'Escuchar estación');
        button.querySelector('i').className = 'fas fa-play';
        
        const row = button.closest('tr');
        if (row) {
            row.classList.remove('table-active');
        }
    }
    
    // Actualizar tooltip
    const tooltip = bootstrap.Tooltip.getInstance(button);
    if (tooltip) {
        tooltip.dispose();
        new bootstrap.Tooltip(button, {
            trigger: 'hover',
            delay: { show: 500, hide: 100 }
        });
    }
    
    // También actualizar el botón en el modal si está abierto
    const modalButton = document.querySelector('.play-pause-modal-btn[data-station="' + stationId + '"]');
    if (modalButton) {
        modalButton.classList.toggle('btn-success', !isPlaying);
        modalButton.classList.toggle('btn-primary', isPlaying);
        modalButton.innerHTML = `
            <i class="fas ${isPlaying ? 'fa-pause' : 'fa-play'} me-1"></i> 
            ${isPlaying ? 'Detener' : 'Escuchar'}
        `;
        modalButton.setAttribute('data-bs-title', isPlaying ? 'Detener reproducción' : 'Escuchar estación');
        
        // Actualizar tooltip del modal
        const tooltipModal = bootstrap.Tooltip.getInstance(modalButton);
        if (tooltipModal) {
            tooltipModal.dispose();
            new bootstrap.Tooltip(modalButton, {
                trigger: 'hover',
                delay: { show: 500, hide: 100 }
            });
        }
    }
}

/**
 * Reinicia el estado del reproductor
 */
function resetPlayerState() {
    if (!audioPlayer) return;
    
    audioPlayer.pause();
    audioPlayer.src = '';
    
    document.querySelectorAll('.play-pause-btn.playing').forEach(btn => {
        const stationId = btn.getAttribute('data-station');
        updateButtonState(stationId, false);
    });
    
    currentlyPlaying = null;
}

/**
 * Maneja errores en la reproducción
 * @param {Event} error - Evento de error
 */
function handlePlayerError(error) {
    console.error('Error en reproducción de audio:', error);
    resetPlayerState();
    alert('Error al reproducir la estación. El stream puede estar caído o no ser compatible.');
}

/**
 * Muestra una notificación de reproducción
 * @param {Object} station - Información de la estación
 */
function showPlayingNotification(station) {
    if (!station) return;
    
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-primary border-0';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-headphones me-2"></i>
                Reproduciendo: ${station.name} - ${station.frecuencia}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
    `;
    
    const toastContainer = document.querySelector('.toast-container');
    if (toastContainer) {
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast, { autohide: true, delay: 3000 });
        bsToast.show();
    }
}

/**
 * Actualiza los datos de las estaciones
 */
function updateStationsData() {
    fetchData('get-listeners.php').then(data => {
        if (data.error) {
            console.error('Error al actualizar datos de estaciones:', data.message);
            return;
        }
        
        stationsData = data;
        updateStationsUI(data);
    }).catch(error => {
        console.error('Error en actualización de estaciones:', error);
    });
}

/**
 * Actualiza la interfaz de usuario con los nuevos datos
 * @param {Object} data - Datos actualizados
 */
function updateStationsUI(data) {
    const stations = data.stations || [];
    
    const totalListenersEl = document.getElementById('stations-total-listeners');
    if (totalListenersEl) {
        const totalListeners = stations.reduce((sum, station) => sum + (station.listeners || 0), 0);
        const oldValue = parseInt(totalListenersEl.textContent);
        
        if (oldValue !== totalListeners) {
            totalListenersEl.textContent = totalListeners;
            totalListenersEl.classList.add('bg-highlight');
            setTimeout(() => {
                totalListenersEl.classList.remove('bg-highlight');
            }, 1500);
        }
    }
    
    const updateTimeEl = document.getElementById('stations-update-time');
    if (updateTimeEl) {
        updateTimeEl.textContent = 'Actualizado: ' + new Date().toLocaleTimeString();
    }
    
    stations.forEach(station => {
        const row = document.querySelector(`tr[data-station="${station.serverUrl}"]`);
        if (row) {
            const listenersCell = row.querySelector('.station-listeners');
            if (listenersCell && station.online) {
                const oldListeners = parseInt(listenersCell.textContent) || 0;
                
                if (oldListeners !== station.listeners) {
                    listenersCell.innerHTML = `<span class="badge bg-info">${station.listeners || 0}</span>`;
                    listenersCell.classList.add('bg-highlight');
                    setTimeout(() => {
                        listenersCell.classList.remove('bg-highlight');
                    }, 1500);
                }
            }
        }
    });
    
    const wasPlaying = currentlyPlaying;
    if (wasPlaying) {
        updateButtonState(wasPlaying, true);
    }
}

/**
 * Filtra estaciones por texto de búsqueda
 * @param {string} query - Texto de búsqueda
 */
function filterStationsBySearch(query) {
    const rows = document.querySelectorAll('#stationsTable tbody tr');
    
    query = query.toLowerCase().trim();
    
    rows.forEach(row => {
        const name = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
        const freq = row.querySelector('td:nth-child(3)').textContent.toLowerCase();
        const mount = row.querySelector('td:nth-child(6)').textContent.toLowerCase(); // Actualizado debido a la nueva columna
        
        if (name.includes(query) || freq.includes(query) || mount.includes(query)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

/**
 * Ordena las estaciones según el criterio seleccionado
 * @param {Array} stations - Array de estaciones
 * @param {string} sortBy - Criterio de ordenamiento
 */
function sortStations(stations, sortBy) {
    switch (sortBy) {
        case 'name':
            stations.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            break;
        case 'listeners':
            stations.sort((a, b) => (b.listeners || 0) - (a.listeners || 0));
            break;
        case 'status':
        default:
            stations.sort((a, b) => {
                if (a.online && !b.online) return -1;
                if (!a.online && b.online) return 1;
                
                if (a.online && b.online) {
                    return (b.listeners || 0) - (a.listeners || 0);
                }
                
                return (a.name || '').localeCompare(b.name || '');
            });
    }
}

/**
 * Obtiene el título según el filtro actual
 * @returns {string} Título del filtro
 */
function getFilterTitle() {
    switch (currentFilter) {
        case 'online': return 'Estaciones Online';
        case 'offline': return 'Estaciones Offline';
        default: return 'Todas las Estaciones';
    }
}

/**
 * Obtiene la clase del badge según el filtro actual
 * @returns {string} Clase CSS para el badge
 */
function getFilterBadgeClass() {
    switch (currentFilter) {
        case 'online': return 'bg-success';
        case 'offline': return 'bg-danger';
        default: return 'bg-info';
    }
}

/**
 * Muestra los detalles de una estación en modal
 * @param {Object} station - Datos de la estación
 */
function showStationDetails(station) {
    const modalContent = document.getElementById('stationModalContent');
    const isPlaying = currentlyPlaying === station.serverUrl;
    
    // Obtener el bitrate de forma más robusta
    const bitrateValue = getBitrateValue(station);
    
    // Extraer información de audio para el tooltip
    const audioInfo = getAudioInfoDetails(station);
    
    // Determinar si es Mono (M) o Estéreo (S)
    const channelBadge = audioInfo.channels === '2' || audioInfo.channels === 2 ? 'S' : 'M';
    // Clase de badge diferente según tipo de canal
    const badgeClass = channelBadge === 'M' ? 'text-bg-light' : 'text-bg-dark';
    
    // Determinar si estamos en modo oscuro
    const isDarkMode = document.body.classList.contains('dark-mode');
    const tableClass = isDarkMode ? 'table-dark' : '';
    
    let html = `
        <div class="text-center mb-3">
            ${station.online ? 
                `<span class="badge bg-success mb-2 px-3 py-2"><i class="fas fa-signal me-1"></i> Online</span>` : 
                `<span class="badge bg-danger mb-2 px-3 py-2"><i class="fas fa-times-circle me-1"></i> Offline</span>`
            }
            <h4>${station.name || 'Sin nombre'}</h4>
            <p class="text-muted">${station.frecuencia || 'N/A'}</p>
            
            ${station.online ? 
                `<div class="mb-3">
                    <span class="badge bg-info me-2">Oyentes: ${station.listeners || 0}</span>
                    <button class="btn ${getBitrateBadgeClass(bitrateValue).replace('badge text-bg', 'btn btn')} btn-sm bitrate-btn"
                           data-bs-toggle="tooltip" 
                           data-bs-placement="top"
                           title="${audioInfo.channelsText}, Tasa Muestreo: ${audioInfo.samplerate} Hz">
                        ${bitrateValue}k
                        <span class="badge ${badgeClass}">${channelBadge}</span>
                    </button>
                </div>
                ${station.listenurl ? 
                    `<div class="mb-3">
                        <button type="button" class="btn ${isPlaying ? 'btn-primary' : 'btn-success'} play-pause-modal-btn" 
                              data-station="${station.serverUrl}" 
                              data-url="${station.listenurl}">
                            <i class="fas ${isPlaying ? 'fa-pause' : 'fa-play'} me-1"></i> 
                            ${isPlaying ? 'Detener' : 'Escuchar'}
                        </button>
                        <div class="mt-2 text-muted">
                            <small><code>${station.listenurl}</code></small>
                        </div>
                    </div>` : ''
                }` : 
                `<div class="alert alert-warning">
                    <i class="fas fa-exclamation-triangle me-2"></i> Esta estación no está transmitiendo actualmente
                </div>`
            }
        </div>
        <div class="card ${isDarkMode ? 'text-white bg-dark' : ''} mt-3">
            <div class="card-header ${isDarkMode ? 'border-secondary' : 'bg-light'}">Detalles técnicos</div>
            <div class="card-body">
                <table class="table table-sm table-bordered ${tableClass} table-station-details">
                    <tr><th style="width: 30%">Mount Point:</th><td><code>${station.serverUrl || 'N/A'}</code></td></tr>
                    ${station.description ? `<tr><th>Descripción:</th><td>${station.description}</td></tr>` : ''}
                    ${station.genre ? `<tr><th>Género:</th><td>${station.genre}</td></tr>` : ''}
                    <tr><th>Bitrate:</th><td>${bitrateValue} kbps</td></tr>
                    <tr><th>Canales:</th><td>${audioInfo.channelsText} (${audioInfo.channels})</td></tr>
                    <tr><th>Tasa de Muestreo:</th><td>${audioInfo.samplerate} Hz</td></tr>
                </table>
            </div>
        </div>
    `;
    
    modalContent.innerHTML = html;
    
    // Estilizar el modal según el modo
    const stationModal = document.getElementById('stationModal');
    const modalDialog = stationModal.querySelector('.modal-content');
    
    if (isDarkMode) {
        modalDialog.classList.add('bg-dark', 'text-white', 'border-secondary');
        modalDialog.querySelector('.modal-header').classList.add('border-secondary');
        modalDialog.querySelector('.modal-footer').classList.add('border-secondary');
    } else {
        modalDialog.classList.remove('bg-dark', 'text-white', 'border-secondary');
        modalDialog.querySelector('.modal-header').classList.remove('border-secondary');
        modalDialog.querySelector('.modal-footer').classList.remove('border-secondary');
    }
    
    // Añadir evento al botón de reproducción en el modal
    setTimeout(() => {
        if (station.online && station.listenurl) {
            const playBtn = modalContent.querySelector('.play-pause-modal-btn');
            if (playBtn) {
                playBtn.addEventListener('click', handlePlayPause);
            }
        }
        
        // Inicializar tooltips dentro del modal
        const modalTooltips = modalContent.querySelectorAll('[data-bs-toggle="tooltip"]');
        modalTooltips.forEach(el => {
            new bootstrap.Tooltip(el, {
                trigger: 'hover',
                placement: 'top',
                delay: { show: 200, hide: 100 }
            });
        });
    }, 100);
    
    // CORRECCIÓN: Mostrar el modal después de configurar su contenido
    const modal = new bootstrap.Modal(stationModal);
    modal.show();
}

/**
 * Muestra los diagnósticos de una estación
 * @param {Object} station - Datos de la estación
 */
function showStationDiagnostics(station) {
    alert(`Diagnóstico de estación "${station.name}" en desarrollo`);
    // Por ahora, solo mostramos un mensaje
    // En una implementación real, aquí se cargaría información de diagnóstico
}

/**
 * Obtiene el valor del bitrate de forma robusta probando diferentes posibles propiedades
 * @param {Object} station - Objeto de estación
 * @returns {string|number} Valor del bitrate o 'N/A' si no se encuentra
 */
function getBitrateValue(station) {
    if (!station || !station.online) return 'N/A';
    
    // Log completo de depuración para esta estación
    console.log(`Buscando bitrate para estación: ${station.name}`);
    console.log('Propiedades disponibles:', Object.keys(station));
    
    // Verificar primero 'ice-bitrate' ya que es nuestra principal propiedad objetivo
    if (station['ice-bitrate'] !== undefined) {
        console.log(`Encontrado ice-bitrate: ${station['ice-bitrate']}`);
        return station['ice-bitrate'];
    }
    
    // Verificar bitrate regular
    if (station.bitrate !== undefined) {
        console.log(`Usando bitrate estándar: ${station.bitrate}`);
        return station.bitrate;
    }
    
    // Verificar audio_info
    if (station.audio_info) {
        console.log('Encontrado audio_info:', station.audio_info);
        
        // El audio_info puede ser un objeto o una cadena con formato "clave=valor;clave=valor"
        if (typeof station.audio_info === 'string') {
            const bitrateMatch = station.audio_info.match(/bitrate=(\d+)/i);
            if (bitrateMatch && bitrateMatch[1]) {
                console.log(`Extraído bitrate de audio_info string: ${bitrateMatch[1]}`);
                return bitrateMatch[1];
            }
        } else if (typeof station.audio_info === 'object') {
            if (station.audio_info.bitrate !== undefined) {
                console.log(`Encontrado bitrate en audio_info: ${station.audio_info.bitrate}`);
                return station.audio_info.bitrate;
            }
            if (station.audio_info['ice-bitrate'] !== undefined) {
                console.log(`Encontrado ice-bitrate en audio_info: ${station.audio_info['ice-bitrate']}`);
                return station.audio_info['ice-bitrate'];
            }
        }
    }
    
    // Buscar cualquier propiedad que contenga 'bit' en su nombre
    for (const key in station) {
        if (key.toLowerCase().includes('bit') && station[key] !== undefined) {
            console.log(`Encontrada propiedad alternativa de bitrate: ${key} = ${station[key]}`);
            return station[key];
        }
    }
    
    // Si no se encuentra ninguna propiedad, buscar en el servidor original si existe
    if (station.server && typeof station.server === 'object') {
        console.log('Buscando en objeto server...');
        for (const key in station.server) {
            if (key.toLowerCase().includes('bit') && station.server[key] !== undefined) {
                console.log(`Encontrado bitrate en server.${key}: ${station.server[key]}`);
                return station.server[key];
            }
        }
    }
    
    console.log('No se encontró ningún valor de bitrate para esta estación');
    return 'N/A';
}

/**
 * Determina la clase CSS para el badge del bitrate según su valor
 * @param {number|string} bitrate - Valor del bitrate
 * @returns {string} Clase CSS para el badge
 */
function getBitrateBadgeClass(bitrate) {
    console.log('Clasificando bitrate:', bitrate);
    
    // Convertir a número si es string
    const rate = parseInt(bitrate) || 0;
    
    if (rate < 64) {
        return 'badge text-bg-secondary';
    } else if (rate === 64) {
        return 'badge text-bg-success';
    } else if (rate === 96) {
        return 'badge text-bg-primary';
    } else if (rate === 128) {
        return 'badge text-bg-warning';
    } else if (rate > 128) {
        return 'badge text-bg-danger';
    } else {
        return 'badge text-bg-secondary';
    }
}

/**
 * Extrae información de audio_info de una estación
 * @param {Object} station - Objeto de estación
 * @returns {Object} Objeto con información de audio
 */
function getAudioInfoDetails(station) {
    // Valores por defecto
    let channels = 'N/A';
    let channelsText = 'N/A';
    let samplerate = 'N/A';
    
    if (!station || !station.online) return { channels, channelsText, samplerate };
    
    // Si tenemos audio_info como objeto
    if (station.audio_info && typeof station.audio_info === 'object') {
        channels = station.audio_info['ice-channels'] || station.audio_info.channels || channels;
        samplerate = station.audio_info['ice-samplerate'] || station.audio_info.samplerate || samplerate;
    } 
    // Si tenemos audio_info como cadena
    else if (station.audio_info && typeof station.audio_info === 'string') {
        const channelsMatch = station.audio_info.match(/ice-channels=(\d+)/i) || 
                            station.audio_info.match(/channels=(\d+)/i);
        const samplerateMatch = station.audio_info.match(/ice-samplerate=(\d+)/i) || 
                             station.audio_info.match(/samplerate=(\d+)/i);
        
        if (channelsMatch && channelsMatch[1]) {
            channels = channelsMatch[1];
        }
        
        if (samplerateMatch && samplerateMatch[1]) {
            samplerate = samplerateMatch[1];
        }
    }
    // Buscar propiedades directamente en el objeto estación
    else {
        if (station['ice-channels'] !== undefined) {
            channels = station['ice-channels'];
        } else if (station.channels !== undefined) {
            channels = station.channels;
        }
        
        if (station['ice-samplerate'] !== undefined) {
            samplerate = station['ice-samplerate'];
        } else if (station.samplerate !== undefined) {
            samplerate = station.samplerate;
        }
    }
    
    // Determinar el texto para los canales
    if (channels === '1' || channels === 1) {
        channelsText = 'Mono';
    } else if (channels === '2' || channels === 2) {
        channelsText = 'Estéreo';
    } else {
        channelsText = `${channels} canales`;
    }
    
    return {
        channels: channels,
        channelsText: channelsText,
        samplerate: samplerate
    };
}

