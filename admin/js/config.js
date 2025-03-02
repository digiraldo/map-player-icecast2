/**
 * Módulo de Configuración
 * Permite gestionar los ajustes del reproductor Icecast2
 */

// Variables globales del módulo
let configData = null;
let originalConfig = null;
let unsavedChanges = false;

/**
 * Carga la sección de configuración
 */
function loadConfig() {
    console.log('Cargando módulo de configuración...');
    
    // Mostrar loader mientras se cargan los datos
    showLoader();
    
    // Obtener la configuración actual
    fetchData('get-config.php')
        .then(data => {
            if (data.error) {
                showError(data.message || 'Error al cargar los datos de configuración');
                return;
            }
            
            console.log('Configuración cargada correctamente:', data);
            
            // Almacenar datos originales
            configData = JSON.parse(JSON.stringify(data)); // Copia profunda
            originalConfig = JSON.parse(JSON.stringify(data)); // Copia para comparar cambios
            
            // Renderizar el módulo
            renderConfigModule(data);
            
            // Configurar eventos y validaciones
            setupConfigEvents();
            
        })
        .catch(error => {
            console.error('Error al cargar configuración:', error);
            showError('Error al cargar la configuración: ' + error.message);
        });
}

/**
 * Renderiza el módulo de configuración
 * @param {Object} data - Datos de configuración
 */
function renderConfigModule(data) {
    const contentEl = document.getElementById('content');
    
    // Determinar la URL del logo actual
    const logoUrl = data.reproductor.url_logo && data.reproductor.url_logo.trim() !== '' 
        ? data.reproductor.url_logo 
        : '../img/DiGiraldo-Logo.png';
    
    // Construir HTML del módulo
    let html = `
        <div class="alert alert-info mb-4">
            <i class="fas fa-info-circle me-2"></i>
            Esta sección permite configurar los parámetros del reproductor de mapa de emisoras.
            Los cambios realizados afectarán al funcionamiento de la aplicación.
        </div>
        
        <!-- Formulario de configuración -->
        <div class="card shadow mb-4">
            <div class="card-header py-3 d-flex justify-content-between align-items-center">
                <h6 class="m-0 font-weight-bold text-primary">
                    <i class="fas fa-cog me-1"></i> Configuración General
                </h6>
                <div>
                    <span class="text-muted" id="config-status"></span>
                </div>
            </div>
            <div class="card-body">
                <form id="configForm" novalidate>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="hostUrl" class="form-label">URL del Servidor Icecast <small class="text-danger">*</small></label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="fas fa-server"></i></span>
                                <input type="url" class="form-control" id="hostUrl" name="hostUrl" 
                                    value="${data.reproductor.hostUrl || ''}" required
                                    placeholder="https://tuservidor.com:8080">
                                <button class="btn btn-outline-secondary" type="button" onclick="testIcecastConnection()">
                                    <i class="fas fa-stethoscope"></i>
                                </button>
                            </div>
                            <div class="form-text">URL completa del servidor Icecast incluyendo puerto</div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <label for="statusUrl" class="form-label">Ruta al archivo de estado</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="fas fa-file-code"></i></span>
                                <input type="text" class="form-control" id="statusUrl" name="statusUrl" 
                                    value="${data.reproductor.statusUrl || 'status-json.xsl'}" 
                                    placeholder="status-json.xsl">
                            </div>
                            <div class="form-text">Normalmente status-json.xsl (valor por defecto)</div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="estacion" class="form-label">Nombre general de la estación</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="fas fa-broadcast-tower"></i></span>
                                <input type="text" class="form-control" id="estacion" name="estacion" 
                                    value="${data.reproductor.estacion || ''}" 
                                    placeholder="Ej: Radio Nacional">
                            </div>
                            <div class="form-text">Nombre general de la estación radial</div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <label for="genero" class="form-label">Género musical</label>
                            <div class="input-group">
                                <span class="input-group-text"><i class="fas fa-music"></i></span>
                                <input type="text" class="form-control" id="genero" name="genero" 
                                    value="${data.reproductor.genero || ''}" 
                                    placeholder="Tropical, Rock, etc.">
                            </div>
                            <div class="form-text">Género musical predominante de las emisoras</div>
                        </div>
                    </div>
                    
                    <!-- Configuración visual del mapa -->
                    <h5 class="mt-4 mb-3">Configuración Visual</h5>
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="r" class="form-label">Radio de los puntos</label>
                            <div class="input-group">
                                <input type="number" class="form-control" id="r" name="r" 
                                    value="${data.reproductor.r || '8'}" min="1" max="20" step="0.5">
                                <span class="input-group-text">px</span>
                            </div>
                            <div class="form-text">Tamaño de los puntos de cada emisora en el mapa</div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <label for="url_logo" class="form-label">URL del Logo</label>
                            <div class="input-group">
                                <span class="input-group-text logo-preview-container">
                                    <img src="${logoUrl}" alt="Logo Preview" id="logo-preview" 
                                         style="max-width: 20px; max-height: 20px; object-fit: contain;">
                                </span>
                                <input type="url" class="form-control" id="url_logo" name="url_logo" 
                                    value="${data.reproductor.url_logo || ''}"
                                    placeholder="https://ejemplo.com/logo.png"
                                    onchange="updateLogoPreview(this.value)">
                            </div>
                            <div class="form-text">URL de la imagen del logo (opcional)</div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label for="infoCardLeft" class="form-label">Posición tarjeta info - Izquierda</label>
                            <div class="input-group">
                                <input type="number" class="form-control" id="infoCardLeft" name="infoCardLeft" 
                                    value="${data.reproductor.infoCard?.left.replace('px', '') || '20'}" min="0">
                                <span class="input-group-text">px</span>
                            </div>
                            <div class="form-text">Posición horizontal de la tarjeta de información</div>
                        </div>
                        
                        <div class="col-md-6 mb-3">
                            <label for="infoCardTop" class="form-label">Posición tarjeta info - Superior</label>
                            <div class="input-group">
                                <input type="number" class="form-control" id="infoCardTop" name="infoCardTop" 
                                    value="${data.reproductor.infoCard?.top.replace('px', '') || '20'}" min="0">
                                <span class="input-group-text">px</span>
                            </div>
                            <div class="form-text">Posición vertical de la tarjeta de información</div>
                        </div>
                    </div>

                    <!-- Campo informativo del desarrollador (solo lectura) -->
                    <div class="row mt-4">
                        <div class="col-12">
                            <div class="alert alert-secondary">
                                <i class="fas fa-code me-2"></i>
                                <strong>Desarrollador:</strong> ${data.reproductor.desarrollador || 'No especificado'}
                            </div>
                        </div>
                    </div>
                    
                    <div class="d-flex justify-content-between mt-4">
                        <button type="button" class="btn btn-secondary" id="resetConfigBtn">
                            <i class="fas fa-undo me-1"></i> Restaurar valores
                        </button>
                        <button type="submit" class="btn btn-primary" id="saveConfigBtn">
                            <i class="fas fa-save me-1"></i> Guardar configuración
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    contentEl.innerHTML = html;
}

/**
 * Actualiza la vista previa del logo cuando se cambia la URL
 * @param {string} url - Nueva URL del logo
 */
function updateLogoPreview(url) {
    const logoPreview = document.getElementById('logo-preview');
    if (!logoPreview) return;
    
    if (url && url.trim() !== '') {
        logoPreview.src = url;
    } else {
        logoPreview.src = '../img/DiGiraldo-Logo.png';
    }
    
    // Manejar errores de carga de la imagen
    logoPreview.onerror = function() {
        this.src = '../img/DiGiraldo-Logo.png';
        console.warn('Error al cargar la imagen del logo, usando la imagen por defecto');
    };
}

/**
 * Configura los eventos del formulario de configuración
 */
function setupConfigEvents() {
    // Evento de envío del formulario
    const configForm = document.getElementById('configForm');
    if (configForm) {
        configForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveConfig();
        });
    }
    
    // Detectar cambios en el formulario
    const inputs = configForm.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('change', function() {
            markUnsavedChanges();
        });
        input.addEventListener('keyup', function() {
            markUnsavedChanges();
        });
    });
    
    // Botón de reset
    const resetBtn = document.getElementById('resetConfigBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            resetConfigForm();
        });
    }
    
    // Advertir al usuario antes de salir con cambios sin guardar
    window.addEventListener('beforeunload', function(e) {
        if (unsavedChanges) {
            e.preventDefault();
            e.returnValue = ''; // Mensaje estándar del navegador
        }
    });

    // También configurar el evento para actualizar la vista previa cuando se modifica el valor
    const logoUrlInput = document.getElementById('url_logo');
    if (logoUrlInput) {
        logoUrlInput.addEventListener('input', function() {
            updateLogoPreview(this.value);
        });
    }
}

/**
 * Marca el formulario con cambios sin guardar
 */
function markUnsavedChanges() {
    unsavedChanges = true;
    
    const statusEl = document.getElementById('config-status');
    if (statusEl) {
        statusEl.innerHTML = '<span class="text-warning"><i class="fas fa-exclamation-triangle me-1"></i> Hay cambios sin guardar</span>';
    }
}

/**
 * Reinicia el formulario a la configuración original
 */
function resetConfigForm() {
    if (confirm('¿Está seguro de que desea restaurar la configuración a los valores guardados?')) {
        renderConfigModule(originalConfig);
        setupConfigEvents();
        
        const statusEl = document.getElementById('config-status');
        if (statusEl) {
            statusEl.innerHTML = '<span class="text-info"><i class="fas fa-sync-alt me-1"></i> Valores restaurados</span>';
        }
        
        unsavedChanges = false;
    }
}

/**
 * Prueba la conexión con el servidor Icecast
 */
function testIcecastConnection() {
    const hostUrl = document.getElementById('hostUrl').value.trim();
    const statusUrl = document.getElementById('statusUrl').value.trim() || 'status-json.xsl';
    
    if (!hostUrl) {
        alert('Por favor, ingrese la URL del servidor Icecast');
        return;
    }
    
    // Mostrar indicador de carga
    const testBtn = event.currentTarget;
    const originalText = testBtn.innerHTML;
    testBtn.disabled = true;
    testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    // Realizar prueba de conexión
    fetch(`api/test-connection.php?url=${encodeURIComponent(hostUrl)}&status=${encodeURIComponent(statusUrl)}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showErrorAlert(`Error al conectar con el servidor: ${data.message}`);
            } else {
                showSuccessAlert('Conexión exitosa con el servidor Icecast', data.server);
            }
        })
        .catch(error => {
            showErrorAlert(`Error: ${error.message}`);
        })
        .finally(() => {
            // Restaurar botón
            testBtn.disabled = false;
            testBtn.innerHTML = originalText;
        });
}

/**
 * Muestra alerta de error
 * @param {string} message - Mensaje de error
 */
function showErrorAlert(message) {
    alert(message);
}

/**
 * Muestra alerta de éxito
 * @param {string} message - Mensaje de éxito
 * @param {Object} serverInfo - Información del servidor (opcional)
 */
function showSuccessAlert(message, serverInfo) {
    if (serverInfo) {
        message += `\n\nServidor: ${serverInfo.version || 'N/A'}\nFuentes activas: ${serverInfo.sources || 0}`;
    }
    alert(message);
}

/**
 * Guarda la configuración actual
 */
function saveConfig() {
    // Validar el formulario
    const configForm = document.getElementById('configForm');
    if (!configForm.checkValidity()) {
        configForm.reportValidity();
        return;
    }
    
    // Recopilar datos del formulario
    const configUpdates = {
        reproductor: {
            hostUrl: document.getElementById('hostUrl').value.trim(),
            statusUrl: document.getElementById('statusUrl').value.trim(),
            estacion: document.getElementById('estacion').value.trim(),
            genero: document.getElementById('genero').value.trim(),
            r: document.getElementById('r').value,
            url_logo: document.getElementById('url_logo').value.trim(),
            infoCard: {
                left: document.getElementById('infoCardLeft').value + 'px',
                top: document.getElementById('infoCardTop').value + 'px'
            }
        }
    };
    
    // Asegurarse de no perder datos importantes como la lista de ciudades
    configUpdates.reproductor.ciudades = configData.reproductor.ciudades;
    configUpdates.reproductor.desarrollador = configData.reproductor.desarrollador; // Mantener el desarrollador original
    
    // Deshabilitar botón de guardar y mostrar indicador de carga
    const saveBtn = document.getElementById('saveConfigBtn');
    const originalText = saveBtn.innerHTML;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Guardando...';
    
    // Enviar datos al servidor
    fetch('api/save-config.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(configUpdates),
    })
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showErrorAlert(`Error al guardar la configuración: ${data.message}`);
            } else {
                // Actualizar la configuración actual
                configData = JSON.parse(JSON.stringify(configUpdates));
                originalConfig = JSON.parse(JSON.stringify(configUpdates));
                
                // Actualizar estado de la UI
                const statusEl = document.getElementById('config-status');
                if (statusEl) {
                    statusEl.innerHTML = '<span class="text-success"><i class="fas fa-check-circle me-1"></i> Configuración guardada correctamente</span>';
                }
                
                // Actualizar información del sidebar
                Config.stationInfo.logo = configUpdates.reproductor.url_logo || '';
                Config.stationInfo.name = configUpdates.reproductor.estacion || '';
                updateSidebarInfo();
                
                // Mostrar mensaje de éxito
                showSuccessAlert('Configuración guardada correctamente');
                
                // Ya no hay cambios sin guardar
                unsavedChanges = false;
            }
        })
        .catch(error => {
            showErrorAlert(`Error: ${error.message}`);
        })
        .finally(() => {
            // Restaurar botón
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
        });
}
