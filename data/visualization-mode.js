/**
 * Archivo específico para el modo visualización (view_stations.bat)
 * Permite almacenar y gestionar la configuración básica del reproductor en localStorage
 */

// Asegurar que solo se ejecuta en el modo visualización
if (document.title.includes('Modo Visualización') || window.location.href.includes('index_view.html')) {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('🔍 Modo visualización activado - Usando localStorage para la configuración');
        
        // Inicializar el sistema de persistencia
        initVisualizationMode();
        
        // Restaurar el botón de edición si fue eliminado
        ensureEditButtonExists();
        
        // Sustituir las funciones originales de guardado por versiones que usan localStorage
        overrideSaveFunctions();
        
        // Habilitar el botón de edición para abrir directamente la configuración
        setupEditButton();
    });
}

/**
 * Inicializa el modo visualización
 * Carga los datos del stations.json en localStorage si no existen
 */
function initVisualizationMode() {
    // Verificar si ya existen datos en localStorage
    if (!localStorage.getItem('stations_data')) {
        // Cargar datos desde el archivo stations.json
        loadInitialData();
    } else {
        console.log('✅ Datos encontrados en localStorage');
        
        // Mostrar indicador de modo localStorage en la interfaz
        showLocalStorageIndicator();
    }
}

/**
 * Carga los datos iniciales desde stations.json
 */
function loadInitialData() {
    console.log('⏳ Cargando datos iniciales desde stations.json...');
    
    fetch('data/stations.json')
        .then(response => response.json())
        .then(data => {
            // Guardar datos completos en localStorage
            localStorage.setItem('stations_data', JSON.stringify(data));
            console.log('✅ Datos guardados en localStorage');
            
            // Mostrar indicador de modo localStorage en la interfaz
            showLocalStorageIndicator();
        })
        .catch(error => {
            console.error('❌ Error al cargar datos iniciales:', error);
        });
}

/**
 * Sobrescribe las funciones originales de guardado para usar localStorage
 */
function overrideSaveFunctions() {
    // Esperar a que las funciones originales estén disponibles
    const checkFunctions = setInterval(() => {
        if (typeof openConfigModal === 'function' && typeof saveConfig === 'function') {
            clearInterval(checkFunctions);
            
            // Guardar referencia a las funciones originales
            const originalOpenConfigModal = openConfigModal;
            const originalSaveConfig = saveConfig;
            
            // Sobrescribir openConfigModal
            window.openConfigModal = function() {
                // Obtener datos desde localStorage
                const storedData = JSON.parse(localStorage.getItem('stations_data'));
                
                // Usar los datos almacenados temporalmente
                window.stationsData = storedData;
                
                // Llamar a la función original
                originalOpenConfigModal();
            };
            
            // Sobrescribir saveConfig
            window.saveConfig = function() {
                // Validar el formulario
                const form = document.getElementById('configForm');
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return;
                }
                
                // Obtener datos actuales desde localStorage
                const storedData = JSON.parse(localStorage.getItem('stations_data'));
                
                // Solo actualizar los campos permitidos: estacion, hostUrl, url_logo
                storedData.reproductor.estacion = document.getElementById('configName').value;
                storedData.reproductor.hostUrl = document.getElementById('configHostUrl').value;
                storedData.reproductor.url_logo = document.getElementById('configLogo').value;
                
                // Guardar los cambios en localStorage
                localStorage.setItem('stations_data', JSON.stringify(storedData));
                
                // Actualizar la variable global
                window.stationsData = storedData;
                
                // Mostrar notificación
                showToast('Configuración guardada en localStorage. Recargando...', 'success');
                
                // Cerrar el modal de configuración
                const configModal = bootstrap.Modal.getInstance(document.getElementById('configModal'));
                configModal.hide();
                
                // Recargar la página para aplicar los cambios
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            };
            
            // Crear un manejador especial para limpiar localStorage
            createLocalStorageResetOption();
            
            console.log('✅ Funciones de guardado modificadas para usar localStorage');
            
            // Sobrescribir saveAllChanges para que funcione con localStorage
            window.saveAllChanges = function() {
                console.log('saveAllChanges sobrescrito para localStorage');
                
                // Obtener datos actuales desde localStorage
                let storedData = JSON.parse(localStorage.getItem('stations_data') || '{"reproductor":{}}');
                if (!storedData.reproductor) storedData.reproductor = {};
                
                // Actualizar solo los campos permitidos en modo visualización
                storedData.reproductor.estacion = document.getElementById('configName').value;
                storedData.reproductor.hostUrl = document.getElementById('configHostUrl').value;
                storedData.reproductor.url_logo = document.getElementById('configLogo').value;
                
                // Guardar en localStorage
                localStorage.setItem('stations_data', JSON.stringify(storedData));
                console.log('Datos guardados en localStorage por saveAllChanges');
                
                // Cerrar modales abiertos
                const modals = document.querySelectorAll('.modal.show');
                modals.forEach(modalEl => {
                    const modal = bootstrap.Modal.getInstance(modalEl);
                    if (modal) modal.hide();
                });
                
                // Cerrar cualquier toast que esté abierto
                document.querySelectorAll('.toast.show').forEach(toast => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                });
                
                // Mostrar confirmación
                showToast('Configuración guardada en localStorage. Recargando...', 'success');
                
                // Recargar para aplicar cambios
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            };
            
            // Sobrescribir showToastWithSaveButton para que llame a nuestra función de guardado
            window.showToastWithSaveButton = function(message) {
                // Cerrar cualquier toast previo
                document.querySelectorAll('.toast.show').forEach(toast => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                });
                
                // Crear un toast personalizado con botón para localStorage
                const toast = document.createElement('div');
                toast.classList.add('toast', 'show');
                toast.style.position = 'fixed';
                toast.style.bottom = '20px';
                toast.style.right = '20px';
                toast.style.backgroundColor = '#28a745';
                toast.style.color = 'white';
                toast.style.padding = '15px 20px';
                toast.style.borderRadius = '5px';
                toast.style.zIndex = '9999';
                toast.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                
                toast.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>${message}</div>
                        <div style="margin-left: 15px; display: flex; gap: 10px;">
                            <button id="saveAllInToastLocal" class="btn btn-sm btn-light">Guardar</button>
                            <button class="btn-close btn-close-white" style="font-size: 0.7rem;"></button>
                        </div>
                    </div>
                `;
                
                document.body.appendChild(toast);
                
                // Configurar evento de cierre
                toast.querySelector('.btn-close').addEventListener('click', () => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                });
                
                // Configurar evento para el botón de guardar
                toast.querySelector('#saveAllInToastLocal').addEventListener('click', () => {
                    window.saveAllChanges(); // Usa nuestra versión sobrescrita
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                });
                
                // Auto-ocultar después de 10 segundos
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }, 10000);
            };
            
            console.log('✅ Funciones de guardado adicionales sobrescritas para localStorage');
        }
    }, 100);

    // Esperar a que la función de alerta esté disponible
    const checkAlertFunction = setInterval(() => {
        if (typeof window.showConfigAlert === 'function') {
            clearInterval(checkAlertFunction);
            
            // Guardar referencia a la función original
            const originalShowConfigAlert = window.showConfigAlert;
            
            // Sobreescribir la función de alerta
            window.showConfigAlert = function(message) {
                // Crear elemento de alerta
                const alertDiv = document.createElement('div');
                alertDiv.className = 'alert alert-warning alert-dismissible fade show config-alert';
                alertDiv.style.position = 'fixed';
                alertDiv.style.top = '50%';
                alertDiv.style.left = '50%';
                alertDiv.style.transform = 'translate(-50%, -50%)';
                alertDiv.style.zIndex = '9999';
                alertDiv.style.maxWidth = '80%';
                alertDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                alertDiv.style.textAlign = 'center';
                
                alertDiv.innerHTML = `
                    <h4 class="alert-heading mb-3"><i class="fas fa-exclamation-triangle me-2"></i>Atención - Modo LocalStorage</h4>
                    <p>${message}</p>
                    <hr>
                    <div class="d-flex justify-content-center">
                        <button type="button" class="btn btn-primary me-2" id="openConfigBtn">
                            <i class="fas fa-cog me-1"></i> Abrir Configuración
                        </button>
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="alert" aria-label="Close">
                            <i class="fas fa-times me-1"></i> Cerrar
                        </button>
                    </div>
                `;
                
                document.body.appendChild(alertDiv);
                
                // Configurar evento para abrir configuración
                document.getElementById('openConfigBtn').addEventListener('click', function() {
                    // Cerrar la alerta
                    alertDiv.remove();
                    
                    // Abrir directamente el modal de configuración
                    setTimeout(() => {
                        // Cargar datos desde localStorage
                        const storedData = JSON.parse(localStorage.getItem('stations_data') || '{}');
                        window.stationsData = storedData;
                        
                        const configModal = document.getElementById('configModal');
                        if (!configModal) {
                            createConfigModal();
                            setTimeout(() => openConfigDirectly(), 100);
                        } else {
                            openConfigDirectly();
                        }
                    }, 100);
                });
            };
            
            console.log('✅ Función de alerta de configuración modificada para usar localStorage');
        }
    }, 100);
}

/**
 * Añade un indicador visual de que se está usando localStorage
 */
function showLocalStorageIndicator() {
    // Crear un indicador visual para mostrar que estamos en modo localStorage
    const indicator = document.createElement('div');
    indicator.style.position = 'fixed';
    indicator.style.bottom = '10px';
    indicator.style.left = '10px';
    indicator.style.backgroundColor = 'rgba(0,123,255,0.8)';
    indicator.style.color = 'white';
    indicator.style.padding = '5px 10px';
    indicator.style.borderRadius = '5px';
    indicator.style.fontSize = '12px';
    indicator.style.zIndex = '9999';
    indicator.style.display = 'flex';
    indicator.style.alignItems = 'center';
    indicator.style.gap = '5px';
    indicator.innerHTML = '<i class="fas fa-database"></i> Datos cargados desde LocalStorage';
    
    // Añadir botón para limpiar localStorage
    const resetBtn = document.createElement('button');
    resetBtn.style.marginLeft = '10px';
    resetBtn.style.padding = '2px 5px';
    resetBtn.style.fontSize = '10px';
    resetBtn.style.backgroundColor = '#dc3545';
    resetBtn.style.border = 'none';
    resetBtn.style.borderRadius = '3px';
    resetBtn.style.color = 'white';
    resetBtn.innerHTML = '<i class="fas fa-redo-alt"></i> Reset';
    resetBtn.title = 'Restablecer desde stations.json';
    
    resetBtn.addEventListener('click', function() {
        if (confirm('¿Está seguro de que desea restablecer la configuración desde stations.json?')) {
            localStorage.removeItem('stations_data');
            window.location.reload();
        }
    });
    
    indicator.appendChild(resetBtn);
    document.body.appendChild(indicator);
}

/**
 * Crea una opción para limpiar localStorage en el modal de configuración
 */
function createLocalStorageResetOption() {
    const checkConfigForm = setInterval(() => {
        const configForm = document.getElementById('configForm');
        if (configForm) {
            clearInterval(checkConfigForm);
            
            // Crear un botón de reset en el modal de configuración
            const resetBtn = document.createElement('button');
            resetBtn.type = 'button';
            resetBtn.className = 'btn btn-outline-danger btn-sm mt-3';
            resetBtn.innerHTML = '<i class="fas fa-undo"></i> Restablecer desde stations.json';
            
            resetBtn.addEventListener('click', function(e) {
                e.preventDefault();
                
                if (confirm('¿Está seguro de que desea restablecer todos los datos desde stations.json?')) {
                    localStorage.removeItem('stations_data');
                    window.location.reload();
                }
            });
            
            // Añadir al formulario
            configForm.appendChild(document.createElement('hr'));
            configForm.appendChild(resetBtn);
        }
    }, 100);
}

/**
 * Función personalizada para mostrar toast en modo visualización
 */
function showToast(message, type) {
    // Usar la función existente si está disponible
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
    }
    
    // De lo contrario, crear un toast básico
    const toast = document.createElement('div');
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.right = '20px';
    toast.style.backgroundColor = type === 'success' ? '#28a745' : '#dc3545';
    toast.style.color = 'white';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.style.zIndex = '9999';
    toast.textContent = message;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

/**
 * Función para sobrescribir la carga inicial de datos del player
 * Esta función se ejecuta automáticamente al cargar la página
 */
(function() {
    // Sobrescribir la función fetch de webplayer.js
    const originalFetch = window.fetch;
    
    window.fetch = function(url, options) {
        // Si es una solicitud a stations.json y tenemos datos en localStorage
        if (url === 'data/stations.json' && localStorage.getItem('stations_data')) {
            console.log('🔄 Interceptando solicitud a stations.json, usando datos de localStorage');
            
            // Crear una promesa que devuelve los datos del localStorage
            return new Promise((resolve) => {
                // Simular una pequeña latencia para asemejarse a una solicitud fetch real
                setTimeout(() => {
                    resolve({
                        ok: true,
                        json: function() {
                            // Loguear datos para depuración
                            const localData = JSON.parse(localStorage.getItem('stations_data'));
                            console.log('Datos cargados desde localStorage:', localData);
                            return Promise.resolve(localData);
                        }
                    });
                }, 100);
            });
        }
        
        // Para cualquier otra solicitud, usar el fetch original
        return originalFetch(url, options);
    };
    
    // Asegurarse de que webplayer.js use la imagen predeterminada cuando no hay URL
    const checkWebplayer = setInterval(() => {
        const stationLogo = document.getElementById('stationLogo');
        if (stationLogo) {
            clearInterval(checkWebplayer);
            
            // Sobrescribir el src original y agregar manejo de errores
            const originalSrc = stationLogo.src;
            if (!originalSrc || originalSrc.endsWith('/')) {
                stationLogo.src = 'img/DiGiraldo-Logo.png';
            }
            
            stationLogo.onerror = function() {
                this.src = 'img/DiGiraldo-Logo.png';
            };
        }
    }, 100);
})();

/**
 * Configura el botón de edición para abrir directamente el modal de configuración
 */
function setupEditButton() {
    // Esperar a que exista el botón (podría haberse agregado dinámicamente)
    const checkButton = setInterval(() => {
        const editButton = document.getElementById('editButton');
        if (editButton) {
            clearInterval(checkButton);
            
            // Reemplazar el comportamiento del botón de edición
            editButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation(); // Importante para detener otros eventos
                
                console.log('Botón de edición clickeado');
                
                try {
                    // Cargar datos desde localStorage
                    const storedData = JSON.parse(localStorage.getItem('stations_data') || '{}');
                    window.stationsData = storedData;
                    
                    // Abrir directamente el modal de configuración (sin pasar por el modal de estaciones)
                    setTimeout(() => {
                        const configModal = document.getElementById('configModal');
                        if (!configModal) {
                            // Si no existe, creamos el modal de configuración
                            createConfigModal();
                            // Esperamos a que se cree y luego lo abrimos
                            setTimeout(() => openConfigDirectly(), 100);
                        } else {
                            // Si ya existe, lo abrimos directamente
                            openConfigDirectly();
                        }
                    }, 10);
                } catch (error) {
                    console.error('Error al procesar click en botón editar:', error);
                }
            });
            
            console.log('✅ Botón de edición configurado para abrir modal directamente');
        }
    }, 100);
}

/**
 * Abre directamente el modal de configuración sin pasar por modal de estaciones
 */
function openConfigDirectly() {
    // Cargar datos almacenados en localStorage
    const storedData = JSON.parse(localStorage.getItem('stations_data') || '{}');
    
    if (!storedData.reproductor) {
        console.error('❌ Error: Datos inválidos en localStorage');
        return;
    }
    
    const config = storedData.reproductor;
    
    // Llenar el formulario con los datos del reproductor
    const configName = document.getElementById('configName');
    const configHostUrl = document.getElementById('configHostUrl');
    const configRadius = document.getElementById('configRadius');
    const configLogo = document.getElementById('configLogo');
    
    if (configName) configName.value = config.estacion || '';
    if (configHostUrl) configHostUrl.value = config.hostUrl || '';
    if (configRadius) {
        configRadius.value = config.r || '7';
        const radiusValue = document.getElementById('radiusValue');
        if (radiusValue) radiusValue.textContent = config.r || '7';
    }
    if (configLogo) configLogo.value = config.url_logo || '';
    
    // Actualizar la previsualización del logo si existe
    const logoUrl = config.url_logo;
    if (logoUrl && configLogo) {
        const logoPreviewIcon = document.getElementById('logoPreviewIcon');
        if (logoPreviewIcon) {
            logoPreviewIcon.src = logoUrl;
            logoPreviewIcon.onerror = function() {
                this.src = 'img/radio-ico.ico';
            };
        }
        
        const previewDiv = document.getElementById('logoPreview');
        if (previewDiv) {
            previewDiv.innerHTML = `<img src="${logoUrl}" alt="Logo Preview" style="max-width: 100px; max-height: 100px;">`;
        }
    }
    
    // Mostrar el modal
    const configModalElement = document.getElementById('configModal');
    if (configModalElement) {
        const bsConfigModal = new bootstrap.Modal(configModalElement);
        bsConfigModal.show();
    }
}

/**
 * Crea el modal de configuración si no existe
 * Específico para cuando se accede directamente desde el botón de edición
 */
function createConfigModal() {
    // Si ya existe, no hacer nada
    if (document.getElementById('configModal')) return;
    
    // Crear el HTML del modal
    const configModalHTML = `
    <div class="modal fade" id="configModal" tabindex="-1" aria-labelledby="configModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="configModalLabel">Configuración del Reproductor</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <form id="configForm">
                        <div class="mb-3">
                            <label for="configName" class="form-label">Nombre</label>
                            <input type="text" class="form-control" id="configName" required>
                        </div>
                        <div class="mb-3">
                            <label for="configHostUrl" class="form-label">Host URL</label>
                            <input type="url" class="form-control" id="configHostUrl" required>
                        </div>
                        <div class="mb-3">
                            <label for="configRadius" class="form-label">Tamaño del Circulo: <span id="radiusValue">7</span></label>
                            <input type="range" class="form-range" id="configRadius" min="5" max="10" step="0.5" value="7" required disabled>
                            <div class="d-flex justify-content-between">
                                <small>Min: 5</small>
                                <small>Max: 10</small>
                            </div>
                            <div class="form-text">El radio determina el tamaño de los círculos de las estaciones (sólo lectura en modo visual)</div>
                        </div>
                        <div class="mb-3">
                            <label for="configLogo" class="form-label">URL Logo</label>
                            <div class="input-group">
                                <span class="input-group-text" id="logoPreviewSpan">
                                    <img id="logoPreviewIcon" src="img/radio-ico.ico" alt="Logo" style="height: 24px; width: auto;">
                                </span>
                                <input type="url" class="form-control" id="configLogo" placeholder="URL de la imagen del logo">
                            </div>
                            <div class="mt-2" id="logoPreview" style="text-align: center;"></div>
                        </div>
                        <hr>
                        <button type="button" class="btn btn-outline-danger btn-sm mt-2" id="resetLocalStorageBtn">
                            <i class="fas fa-undo"></i> Restablecer desde stations.json
                        </button>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="saveConfigBtn">Guardar en LocalStorage</button>
                </div>
            </div>
        </div>
    </div>`;
    
    // Agregar el modal al DOM
    document.body.insertAdjacentHTML('beforeend', configModalHTML);
    
    // Configurar eventos
    document.getElementById('configRadius').addEventListener('input', function() {
        document.getElementById('radiusValue').textContent = this.value;
    });
    
    document.getElementById('configLogo').addEventListener('input', function() {
        const logoUrl = this.value;
        const previewDiv = document.getElementById('logoPreview');
        const logoPreviewIcon = document.getElementById('logoPreviewIcon');
        
        if (logoUrl) {
            // Actualizar el icono en el input-group-text
            logoPreviewIcon.src = logoUrl;
            logoPreviewIcon.onerror = function() {
                this.src = 'img/radio-ico.ico'; // Imagen predeterminada si falla la carga
            };
            
            // Mostrar la previsualización más grande debajo
            previewDiv.innerHTML = `<img src="${logoUrl}" alt="Logo Preview" style="max-width: 100px; max-height: 100px;">`;
            
            // Manejar errores en la imagen grande
            const previewImg = previewDiv.querySelector('img');
            previewImg.onerror = function() {
                previewDiv.innerHTML = '<div class="alert alert-warning">No se pudo cargar la imagen</div>';
            };
        } else {
            // Si no hay URL, mostrar el icono predeterminado
            logoPreviewIcon.src = 'img/radio-ico.ico';
            previewDiv.innerHTML = '';
        }
    });
    
    // Asignar el event listener directamente para guardar
    const saveBtn = document.getElementById('saveConfigBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation(); // Importante para detener otros eventos
            console.log('Botón guardar en localStorage clickeado');
            
            // Llamar directamente a nuestra función de guardado
            saveConfigToLocalStorage();
        });
    }
    
    document.getElementById('resetLocalStorageBtn').addEventListener('click', function(e) {
        e.preventDefault();
        
        if (confirm('¿Está seguro de que desea restablecer todos los datos desde stations.json?')) {
            localStorage.removeItem('stations_data');
            window.location.reload();
        }
    });
}

/**
 * Guarda la configuración directamente a localStorage
 */
function saveConfigToLocalStorage() {
    // Validar el formulario
    const form = document.getElementById('configForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    try {
        // Obtener datos actuales desde localStorage
        let storedData;
        try {
            storedData = JSON.parse(localStorage.getItem('stations_data') || '{"reproductor":{}}');
        } catch (e) {
            console.error("Error al analizar datos de localStorage:", e);
            storedData = {"reproductor":{}};
        }
        
        if (!storedData.reproductor) storedData.reproductor = {};
        
        // Guardar valores de los campos en variables temporales
        const estacionValue = document.getElementById('configName').value;
        const hostUrlValue = document.getElementById('configHostUrl').value;
        const logoValue = document.getElementById('configLogo').value;
        
        console.log('Valores a guardar:', {
            estacion: estacionValue,
            hostUrl: hostUrlValue,
            url_logo: logoValue
        });
        
        // Actualizar solo los campos permitidos
        storedData.reproductor.estacion = estacionValue;
        storedData.reproductor.hostUrl = hostUrlValue;
        storedData.reproductor.url_logo = logoValue;
        
        // Asegurar que statusUrl esté presente
        if (!storedData.reproductor.statusUrl) {
            storedData.reproductor.statusUrl = "status-json.xsl";
        }
        
        console.log('Guardando en localStorage:', storedData);
        
        // Guardar los cambios en localStorage
        localStorage.setItem('stations_data', JSON.stringify(storedData));
        
        // Verificar que se haya guardado correctamente
        const verifyData = localStorage.getItem('stations_data');
        console.log('Verificación de localStorage:', verifyData);
        
        // Actualizar la variable global si existe
        if (window.stationsData) {
            window.stationsData = storedData;
        }
        
        // Cerrar cualquier toast que esté abierto
        document.querySelectorAll('.toast.show').forEach(toast => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        });
        
        // Cerrar todos los modales abiertos
        document.querySelectorAll('.modal.show').forEach(modalEl => {
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
        });
        
        // Limpiar cualquier backdrop residual
        document.querySelectorAll('.modal-backdrop').forEach(backdrop => {
            backdrop.classList.remove('show');
            setTimeout(() => backdrop.remove(), 200);
        });
        
        // Mostrar notificación de éxito
        showToast('Configuración guardada en localStorage. Recargando...', 'success');
        
        // Recargar para aplicar cambios
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
        showToast('Error al guardar configuración: ' + error.message, 'error');
    }
}

/**
 * Asegura que el botón de edición existe en la tarjeta
 */
function ensureEditButtonExists() {
    // Esperar a que el DOM esté completamente cargado
    const checkHeader = setInterval(() => {
        const cardHeader = document.querySelector('#infoCard .card-header');
        if (cardHeader) {
            clearInterval(checkHeader);
            
            // Verificar si ya existe el botón de edición
            if (!document.getElementById('editButton')) {
                const editButton = document.createElement('button');
                editButton.id = 'editButton';
                editButton.className = 'btn btn-sm btn-outline-secondary';
                editButton.innerHTML = '<i class="fas fa-edit"></i>';
                cardHeader.appendChild(editButton);
                console.log('✅ Botón de edición creado dinámicamente');
                
                // Configurar evento de clic inmediatamente
                editButton.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Clic en botón de edición (creado dinámicamente)');
                    
                    try {
                        // Abrir modal directamente
                        const configModal = document.getElementById('configModal');
                        if (!configModal) {
                            createConfigModal();
                            setTimeout(() => openConfigDirectly(), 100);
                        } else {
                            openConfigDirectly();
                        }
                    } catch (error) {
                        console.error('Error al procesar clic en botón editar:', error);
                    }
                });
            }
        }
    }, 50);
}

/**
 * Función para sobrescribir la carga inicial de datos del player
 * Esta función se ejecuta automáticamente al cargar la página
 */
(function() {
    // Ejecutar antes que cualquier otro script para asegurar que la intercepción funciona
    const originalFetch = window.fetch;
    
    window.fetch = function(url, options) {
        // Si es una solicitud a stations.json y tenemos datos en localStorage
        if (url === 'data/stations.json' && localStorage.getItem('stations_data')) {
            console.log('🔄 Interceptando solicitud a stations.json, usando datos de localStorage');
            
            // Crear una promesa que devuelve los datos del localStorage
            return new Promise((resolve) => {
                try {
                    // Obtener datos de localStorage y asegurar su integridad
                    let localData = JSON.parse(localStorage.getItem('stations_data'));
                    
                    // Validación de estructura básica
                    if (!localData || typeof localData !== 'object') {
                        throw new Error('Datos inválidos en localStorage');
                    }
                    
                    // Asegurar que reproductor existe
                    if (!localData.reproductor) {
                        localData.reproductor = {};
                    }
                    
                    // Asegurar que los campos necesarios existen
                    const requiredFields = ['estacion', 'hostUrl', 'statusUrl', 'r', 'desarrollador', 'ciudades'];
                    for (const field of requiredFields) {
                        if (!localData.reproductor[field]) {
                            switch (field) {
                                case 'r': localData.reproductor[field] = "8"; break;
                                case 'desarrollador': localData.reproductor[field] = "digiraldo"; break;
                                case 'statusUrl': localData.reproductor[field] = "status-json.xsl"; break;
                                case 'ciudades': localData.reproductor[field] = []; break;
                                default: localData.reproductor[field] = "";
                            }
                        }
                    }
                    
                    console.log('Datos procesados desde localStorage:', localData);
                    
                    // Guardar los datos procesados de vuelta en localStorage
                    localStorage.setItem('stations_data', JSON.stringify(localData));
                    
                    // Para depurar problemas con el mapa
                    console.log('Ciudades en localStorage:', localData.reproductor.ciudades);
                    
                    // Importante: exponer los datos como una variable global para que otros scripts puedan acceder
                    window.stationsData = localData;
                    
                    // Resolver la promesa con una respuesta similar a fetch
                    setTimeout(() => {
                        resolve({
                            ok: true,
                            json: function() {
                                return Promise.resolve(localData);
                            }
                        });
                    }, 0);
                } catch (e) {
                    console.error('Error al procesar datos de localStorage:', e);
                    // Si hay un error, usar el fetch original
                    return originalFetch(url, options);
                }
            });
        }
        
        // Para cualquier otra solicitud, usar el fetch original
        return originalFetch(url, options);
    };
    
    // Registrar esta función para que se ejecute después de que el DOM esté listo
    document.addEventListener('DOMContentLoaded', function() {
        // Forzar una recarga inicial de los datos usando los datos de localStorage
        if (localStorage.getItem('stations_data')) {
            try {
                const storedData = JSON.parse(localStorage.getItem('stations_data'));
                console.log('Asegurando que los datos de localStorage estén disponibles para el mapa');
                
                // Forzar inicialización del mapa con los datos almacenados
                window.stationsData = storedData;
                
                // Verificar si webplayer.js ya ha inicializado el mapa
                if (typeof initializePlayer === 'function') {
                    console.log('Función initializePlayer disponible, reiniciando mapa');
                    
                    // Forzar actualización del mapa usando los datos de localStorage
                    try {
                        const reproductor = storedData.reproductor;
                        const statusUrlCompleta = `${reproductor.hostUrl}/${reproductor.statusUrl}`;
                        const hostSRV = reproductor.hostUrl;
                        
                        // Limpiar el mapa existente
                        const mapContainer = document.getElementById('players-container');
                        if (mapContainer) {
                            mapContainer.innerHTML = '';
                        }
                        
                        // Reiniciar mapa con los datos de localStorage
                        setTimeout(() => {
                            try {
                                initializePlayer(reproductor, statusUrlCompleta, hostSRV);
                            } catch (error) {
                                console.error('Error al inicializar el mapa:', error);
                            }
                        }, 500);
                    } catch (error) {
                        console.error('Error al intentar reiniciar el mapa:', error);
                    }
                }
            } catch (error) {
                console.error('Error al procesar datos para el mapa:', error);
            }
        }
    });
    
    // Observer para detectar cambios en el body y asegurar que se inicialice el mapa
    const observer = new MutationObserver((mutations) => {
        // Buscar si se ha inicializado el mapa
        const mapContainer = document.getElementById('players-container');
        if (mapContainer && mapContainer.children.length === 0 && localStorage.getItem('stations_data')) {
            console.log('Mapa detectado pero vacío, intentando inicializar con localStorage');
            
            try {
                const storedData = JSON.parse(localStorage.getItem('stations_data'));
                window.stationsData = storedData;
                
                // Si el reproductor de webplayer.js ya está disponible, forzar inicialización
                if (window.initializePlayer) {
                    const reproductor = storedData.reproductor;
                    window.initializePlayer(
                        reproductor, 
                        `${reproductor.hostUrl}/${reproductor.statusUrl}`,
                        reproductor.hostUrl
                    );
                    console.log('Mapa forzado a inicializar con datos de localStorage');
                    
                    // Detener el observer una vez inicializado
                    observer.disconnect();
                }
            } catch (error) {
                console.error('Error al inicializar mapa desde observer:', error);
            }
        }
    });
    
    // Comenzar observación después de un corto retraso
    setTimeout(() => {
        observer.observe(document.body, { childList: true, subtree: true });
    }, 1000);
})();

/**
 * Inicializa el sistema de visualización inmediatamente
 * Para asegurar que las funciones estén disponibles temprano
 */
(function() {
    // Verificar si hay datos en localStorage y su integridad
    const checkStoredData = () => {
        const storedData = localStorage.getItem('stations_data');
        if (storedData) {
            try {
                const data = JSON.parse(storedData);
                // Si no hay reproductor o está vacío, limpiar localStorage
                if (!data || !data.reproductor) {
                    localStorage.removeItem('stations_data');
                    return false;
                }
                return true;
            } catch (e) {
                console.error("Datos inválidos en localStorage:", e);
                localStorage.removeItem('stations_data');
                return false;
            }
        }
        return false;
    };
    
    if (!checkStoredData()) {
        // Cargar datos iniciales desde el archivo JSON
        fetch('data/stations.json')
            .then(response => response.json())
            .then(data => {
                localStorage.setItem('stations_data', JSON.stringify(data));
                console.log("Datos iniciales cargados en localStorage:", data);
                
                // Importante: forzar recarga para aplicar los datos
                window.location.reload();
            })
            .catch(error => {
                console.error("Error al cargar datos iniciales:", error);
            });
    }
    
    // Agregar un oyente global para manejar los botones de guardar que se añadan dinámicamente
    document.addEventListener('click', function(e) {
        // Si se hace clic en el botón de guardar cambios del modal
        if (e.target && e.target.id === 'saveAllChangesBtn') {
            console.log('Botón saveAllChangesBtn detectado y procesado');
            e.preventDefault();
            e.stopPropagation();
            
            // Asegurar que usamos nuestra función de localStorage
            if (window.saveAllChanges) {
                window.saveAllChanges();
            }
        }
        
        // Si se hace clic en el botón de guardar en un toast
        if (e.target && e.target.id === 'saveAllInToast') {
            console.log('Botón saveAllInToast detectado y procesado');
            e.preventDefault();
            e.stopPropagation();
            
            // Asegurar que usamos nuestra función de localStorage
            if (window.saveAllChanges) {
                window.saveAllChanges();
            }
        }
    }, true); // Usar captura para asegurar que se procesa antes de otros oyentes
})();

/**
 * Expone la funcionalidad de inicialización para poder llamarla desde otros lugares
 * Esta función permite reinicializar el mapa con los datos de localStorage
 */
window.reinitializeMapFromLocalStorage = function() {
    console.log('Intentando reinicializar mapa desde localStorage...');
    
    try {
        // Cargar datos desde localStorage
        const storedData = JSON.parse(localStorage.getItem('stations_data'));
        if (!storedData || !storedData.reproductor) {
            console.error('Sin datos válidos en localStorage para reinicializar');
            return false;
        }
        
        // Aplicar valores predeterminados en caso de datos faltantes
        if (!storedData.reproductor.estacion || storedData.reproductor.estacion.trim() === '') {
            storedData.reproductor.estacion = 'Diseñado por DiGiraldo';
            console.log('Aplicando título predeterminado');
        }
        
        if (!storedData.reproductor.url_logo || storedData.reproductor.url_logo.trim() === '') {
            storedData.reproductor.url_logo = 'img/DiGiraldo-Logo.png';
            console.log('Aplicando logo predeterminado');
        }
        
        // Guardar de vuelta los datos con valores predeterminados aplicados
        localStorage.setItem('stations_data', JSON.stringify(storedData));
        
        // Establecer stationsData global
        window.stationsData = storedData;
        
        // Aplicar directamente los valores a los elementos DOM
        const stationLogo = document.getElementById('stationLogo');
        if (stationLogo) {
            stationLogo.src = storedData.reproductor.url_logo;
            stationLogo.onerror = function() {
                this.src = 'img/DiGiraldo-Logo.png';
                this.onerror = null; // Prevenir recursión
            };
        }
        
        const stationName = document.getElementById('stationName');
        if (stationName) {
            stationName.textContent = storedData.reproductor.estacion;
            if (!stationName.textContent || stationName.textContent.trim() === '') {
                stationName.textContent = 'Diseñado por DiGiraldo';
            }
        }
        
        // Método 1: Intentar usar el método normal
        if (typeof window.initializePlayer === 'function') {
            const reproductor = storedData.reproductor;
            const mapContainer = document.getElementById('players-container');
            if (mapContainer) mapContainer.innerHTML = '';
            
            try {
                window.initializePlayer(
                    reproductor,
                    `${reproductor.hostUrl}/${reproductor.statusUrl}`,
                    reproductor.hostUrl
                );
                console.log('Mapa reinicializado con initializePlayer');
                return true;
            } catch (error) {
                console.error('Error con initializePlayer:', error);
                // Continuar con el método alternativo
            }
        }
        
        // Método 2: Si el primer método falló, usar recarga controlada
        console.log('Usando método alternativo de reinicialización...');
        
        // Mostrar indicador de carga
        const loadingIndicator = document.createElement('div');
        loadingIndicator.style.position = 'fixed';
        loadingIndicator.style.top = '50%';
        loadingIndicator.style.left = '50%';
        loadingIndicator.style.transform = 'translate(-50%, -50%)';
        loadingIndicator.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        loadingIndicator.style.color = 'white';
        loadingIndicator.style.padding = '15px 20px';
        loadingIndicator.style.borderRadius = '5px';
        loadingIndicator.style.zIndex = '10000';
        loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reiniciando mapa...';
        document.body.appendChild(loadingIndicator);
        
        // Recargar la página, manteniendo el scroll
        setTimeout(() => {
            // Guardar posición de scroll
            const scrollPosition = {
                x: window.scrollX,
                y: window.scrollY
            };
            sessionStorage.setItem('scrollPosition', JSON.stringify(scrollPosition));
            sessionStorage.setItem('forceMapReload', 'true');
            
            // Recargar
            window.location.reload();
        }, 500);
        
        return true;
    } catch (error) {
        console.error('Error al reinicializar mapa:', error);
        return false;
    }
};

/**
 * Añade un botón para forzar la reinicialización del mapa
 */
function addRefreshMapButton() {
    // Crear botón
    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'btn btn-sm btn-info';
    refreshBtn.style.position = 'fixed';
    refreshBtn.style.bottom = '70px'; // Posición ajustada para mejor visibilidad
    refreshBtn.style.left = '10px';
    refreshBtn.style.zIndex = '9999';
    refreshBtn.style.opacity = '0.9';
    refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Reiniciar Mapa';
    refreshBtn.title = 'Forzar reinicio del mapa con datos de LocalStorage';
    
    // Añadir evento
    refreshBtn.addEventListener('click', function() {
        console.log('Botón de reinicio del mapa clickeado');
        if (window.reinitializeMapFromLocalStorage()) {
            showToast('Reinicializando mapa...', 'success');
        } else {
            showToast('Error al reinicializar el mapa. Reintentando...', 'error');
            // Método alternativo: recargar la página
            setTimeout(() => window.location.reload(), 1000);
        }
    });
    
    // Mejorar la apariencia al pasar el cursor
    refreshBtn.addEventListener('mouseover', function() {
        this.style.opacity = '1';
    });
    refreshBtn.addEventListener('mouseout', function() {
        this.style.opacity = '0.9';
    });
    
    // Añadir al cuerpo
    document.body.appendChild(refreshBtn);
    
    console.log('Botón de reinicio del mapa añadido');
}

/**
 * Función para asegurar que se apliquen valores predeterminados
 */
function ensureDefaultValues() {
    // Comprobar si hay elementos del DOM para aplicar valores
    const stationLogo = document.getElementById('stationLogo');
    const stationName = document.getElementById('stationName');
    
    // Aplicar valor predeterminado para el logo
    if (stationLogo) {
        const currentSrc = stationLogo.src;
        if (!currentSrc || currentSrc.endsWith('/') || currentSrc === 'null') {
            console.log('Aplicando logo predeterminado al elemento DOM');
            stationLogo.src = 'img/DiGiraldo-Logo.png';
        }
        
        // Asegurarse de que el error se maneje correctamente
        stationLogo.onerror = function() {
            console.log('Error al cargar logo, usando predeterminado');
            this.src = 'img/DiGiraldo-Logo.png';
            this.onerror = null; // Prevenir recursión
        };
    }
    
    // Aplicar valor predeterminado para el nombre
    if (stationName) {
        const currentText = stationName.textContent;
        if (!currentText || currentText.trim() === '') {
            console.log('Aplicando título predeterminado al elemento DOM');
            stationName.textContent = 'Diseñado por DiGiraldo';
        }
    }
}

// Ejecutar después de que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Añadir botón de reinicio del mapa
    addRefreshMapButton();
    
    // Asegurar que se aplican valores predeterminados
    ensureDefaultValues();
    
    // Comprobar si necesitamos restaurar la posición de scroll
    if (sessionStorage.getItem('forceMapReload')) {
        try {
            const scrollPosition = JSON.parse(sessionStorage.getItem('scrollPosition') || '{"x":0,"y":0}');
            window.scrollTo(scrollPosition.x, scrollPosition.y);
            sessionStorage.removeItem('forceMapReload');
            sessionStorage.removeItem('scrollPosition');
            console.log('Posición de scroll restaurada después de recarga');
        } catch (e) {
            console.error('Error al restaurar posición de scroll:', e);
        }
    }
    
    // Verificar los valores en almacenamiento local y aplicar valores predeterminados si es necesario
    try {
        const storedData = JSON.parse(localStorage.getItem('stations_data') || '{}');
        let needsUpdate = false;
        
        if (storedData.reproductor) {
            if (!storedData.reproductor.estacion || storedData.reproductor.estacion.trim() === '') {
                storedData.reproductor.estacion = 'Diseñado por DiGiraldo';
                needsUpdate = true;
            }
            
            if (!storedData.reproductor.url_logo || storedData.reproductor.url_logo.trim() === '') {
                storedData.reproductor.url_logo = 'img/DiGiraldo-Logo.png';
                needsUpdate = true;
            }
            
            if (needsUpdate) {
                localStorage.setItem('stations_data', JSON.stringify(storedData));
                console.log('Datos en localStorage actualizados con valores predeterminados');
            }
        }
    } catch (e) {
        console.error('Error al procesar datos de localStorage:', e);
    }
});

/**
 * Observer para garantizar que los valores predeterminados se mantengan
 */
(function() {
    // Configurar un observer para detectar cambios en los elementos críticos
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            // Si se modifica el logo y queda vacío
            if (mutation.target.id === 'stationLogo' && 
                (!mutation.target.src || mutation.target.src === 'null' || mutation.target.src.endsWith('/'))) {
                console.log('Corrigiendo logo vacío');
                mutation.target.src = 'img/DiGiraldo-Logo.png';
            }
            
            // Si se modifica el título y queda vacío
            if (mutation.target.id === 'stationName' && 
                (!mutation.target.textContent || mutation.target.textContent.trim() === '')) {
                console.log('Corrigiendo título vacío');
                mutation.target.textContent = 'Diseñado por DiGiraldo';
            }
        });
    });
    
    // Iniciar observación después de un tiempo para permitir que la página cargue completamente
    setTimeout(() => {
        const stationLogo = document.getElementById('stationLogo');
        const stationName = document.getElementById('stationName');
        
        if (stationLogo) {
            observer.observe(stationLogo, { attributes: true, attributeFilter: ['src'] });
        }
        
        if (stationName) {
            observer.observe(stationName, { childList: true, characterData: true });
        }
        
        console.log('Observer para valores predeterminados iniciado');
    }, 1000);
})();
