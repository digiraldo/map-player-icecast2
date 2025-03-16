// Sistema CRUD para estaciones de radio
let stationsData = null;
let map = null;
let currentTheme = 'light';
let stationCircle = null;

document.addEventListener('DOMContentLoaded', function() {
    // Detectar el tema actual
    currentTheme = document.body.getAttribute('data-theme') || 'light';
    
    // Cargar datos de estaciones
    fetchStationsData();
    
    // Referencia al mapa SVG
    map = document.getElementById('map');
    
    // Configurar evento para el botón de edición
    document.getElementById('editButton').addEventListener('click', openStationsModal);
    
    // Agregar los modales al body
    createModals();

    // Agregar un event listener global para el evento hide.bs.modal
    document.addEventListener('hide.bs.modal', function (event) {
        const modal = event.target;
        
        // Verificar si hay un elemento con foco dentro del modal
        const focusElement = modal.querySelector(':focus');
        
        if (focusElement) {
            // Quitar el foco del elemento
            focusElement.blur();
        }
    });

    // Evento global para limpiar backdrops cuando se oculta un modal
    document.addEventListener('hidden.bs.modal', function (event) {
        // Esperar un poco antes de limpiar para evitar problemas con múltiples modales
        setTimeout(cleanupModalBackdrops, 150);
    });

    // Agregar después de createModals() en el evento DOMContentLoaded existente
    const configRadiusInput = document.getElementById('configRadius');
    if (configRadiusInput) {
        configRadiusInput.addEventListener('input', function() {
            document.getElementById('radiusValue').textContent = this.value;
        });
    }
});

// Función para cargar los datos de estaciones
function fetchStationsData() {
    fetch('data/stations.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Error al cargar los datos de estaciones');
            }
            return response.json();
        })
        .then(data => {
            stationsData = data;
            // console.log('Datos de estaciones cargados correctamente', stationsData);
        })
        .catch(error => {
            console.error('Error:', error);
            showToast('Error al cargar los datos de estaciones', 'error');
        });
}

// Función para crear los modales necesarios
function createModals() {
    // Modal para gestionar estaciones
    const stationsModalHTML = `
    <div class="modal fade" id="stationsModal" tabindex="-1" aria-labelledby="stationsModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl w-100">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="stationsModalLabel">Administrar Estaciones</h5>
                    <div class="ms-auto">
                        <button type="button" class="btn btn-primary me-2" id="addStationBtn">
                            <i class="fas fa-plus"></i> Agregar Ciudad
                        </button>
                        <button type="button" class="btn btn-info me-2" id="configPlayerBtn">
                            <i class="fas fa-cog"></i> Configuración
                        </button>
                        <a name="Estadísticas" id="infoStatistics" class="btn btn-success me-2" href="admin/index.html" role="button"><i class="fas fa-chart-line"></i> Estadísticas</a>
                        
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                </div>
                <div class="modal-body">
                    <table id="stationsTable" class="table table-striped" style="width:100%">
                        <thead>
                            <tr>
                                <th>Estación</th>
                                <th>URL del Servidor</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody></tbody>
                    </table>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    <button type="button" class="btn btn-primary" id="saveAllChangesBtn">Guardar Todos los Cambios</button>
                </div>
            </div>
        </div>
    </div>`;

    // Modal para agregar/editar estación
    const stationFormModalHTML = `
    <div class="modal fade" id="stationFormModal" tabindex="-1" aria-labelledby="stationFormModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg w-100">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="stationFormModalLabel">Datos de la Estación</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <form id="stationForm">
                        <input type="hidden" id="stationIndex">
                        <div class="row mb-3">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="stationNameCity" class="form-label">Nombre</label>
                                    <input type="text" class="form-control" id="stationNameCity" required>
                                </div>
                                <div class="mb-3">
                                    <label for="stationFreq" class="form-label">Frecuencia</label>
                                    <input type="text" class="form-control" id="stationFreq" required>
                                </div>
                                <div class="mb-3">
                                    <label for="stationUrl" class="form-label">URL del Servidor</label>
                                    <input type="text" class="form-control" id="stationUrl" required>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Ubicación en el Mapa</label>
                                    <div class="border" style="height: 300px; position: relative; overflow: hidden;">
                                        <svg id="previewMap" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 553.76801" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%;">
                                            <image href="img/colombia-mapa.svg" width="100%" height="100%" />
                                            <circle id="stationCircle" cx="200" cy="200" r="7" fill="#ff0000" />
                                        </svg>
                                    </div>
                                </div>
                                <div class="row">
                                    <div class="col">
                                        <div class="mb-3">
                                            <label for="stationCx" class="form-label">Coordenada X</label>
                                            <input type="number" class="form-control" id="stationCx" required step="0.5">
                                            <div class="form-text">En incrementos de 0.5</div>
                                        </div>
                                    </div>
                                    <div class="col">
                                        <div class="mb-3">
                                            <label for="stationCy" class="form-label">Coordenada Y</label>
                                            <input type="number" class="form-control" id="stationCy" required step="0.5">
                                            <div class="form-text">En incrementos de 0.5</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="saveStationBtn">Guardar</button>
                </div>
            </div>
        </div>
    </div>`;

    // Modal para configuración del reproductor
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
                            <input type="range" class="form-range" id="configRadius" min="5" max="10" step="0.5" value="7" required>
                            <div class="d-flex justify-content-between">
                                <small>Min: 5</small>
                                <small>Max: 10</small>
                            </div>
                            <div class="form-text">El radio determina el tamaño de los círculos de las estaciones</div>
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
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="saveConfigBtn">Guardar</button>
                </div>
            </div>
        </div>
    </div>`;

    // Modal para ver detalles de la estación
    const viewStationModalHTML = `
    <div class="modal fade" id="viewStationModal" tabindex="-1" aria-labelledby="viewStationModalLabel" aria-hidden="true">
        <div class="modal-dialog modal-lg w-100">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="viewStationModalLabel">Detalles de la Estación</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <dl class="row">
                                <dt class="col-sm-4">Nombre</dt>
                                <dd class="col-sm-8" id="viewName"></dd>
                                
                                <dt class="col-sm-4">Frecuencia</dt>
                                <dd class="col-sm-8" id="viewFreq"></dd>
                                
                                <dt class="col-sm-4">URL del Servidor</dt>
                                <dd class="col-sm-8" id="viewUrl"></dd>
                                
                                <dt class="col-sm-4">Coordenada X</dt>
                                <dd class="col-sm-8" id="viewCx"></dd>
                                
                                <dt class="col-sm-4">Coordenada Y</dt>
                                <dd class="col-sm-8" id="viewCy"></dd>
                            </dl>
                        </div>
                        <div class="col-md-6">
                            <div class="border" style="height: 300px; position: relative; overflow: hidden;">
                                <svg id="viewMap" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 553.76801" preserveAspectRatio="xMidYMid meet" style="width: 100%; height: 100%;">
                                    <image href="img/colombia-mapa.svg" width="100%" height="100%" />
                                    <circle id="viewCircle" cx="200" cy="200" r="7" fill="#ff0000" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>`;

    // Toast para notificaciones
    const toastHTML = `
    <div class="toast-container position-fixed bottom-0 end-0 p-3">
        <div id="notificationToast" class="toast" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="toast-header">
                <strong class="me-auto" id="toastTitle">Notificación</strong>
                <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body" id="toastMessage"></div>
        </div>
    </div>`;

    // Agregar los modales al body
    const modalsContainer = document.createElement('div');
    modalsContainer.innerHTML = stationsModalHTML + stationFormModalHTML + configModalHTML + viewStationModalHTML + toastHTML;
    document.body.appendChild(modalsContainer);

    // Configurar eventos después de crear los modales
    document.getElementById('addStationBtn').addEventListener('click', addStation);
    document.getElementById('saveStationBtn').addEventListener('click', saveStation);
    document.getElementById('configPlayerBtn').addEventListener('click', openConfigModal);
    document.getElementById('saveConfigBtn').addEventListener('click', saveConfig);
    document.getElementById('saveAllChangesBtn').addEventListener('click', saveAllChanges);
    
    // Configurar eventos para actualizar el círculo en tiempo real
    document.getElementById('stationCx').addEventListener('input', updateCirclePosition);
    document.getElementById('stationCy').addEventListener('input', updateCirclePosition);

    // Configurar evento para previsualizar el logo
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
}

// Función para abrir el modal de estaciones
function openStationsModal() {
    if (!stationsData) {
        showToast('Error: No se han cargado los datos de estaciones', 'error');
        return;
    }

    // Limpiar y llenar la tabla
    const tableBody = document.querySelector('#stationsTable tbody');
    tableBody.innerHTML = '';
    
    stationsData.reproductor.ciudades.forEach((ciudad, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${ciudad.name} - ${ciudad.frecuencia}</td>
            <td>${ciudad.serverUrl}</td>
            <td class="text-center">
                <button class="btn btn-sm btn-info view-btn" data-index="${index}" 
                    data-bs-toggle="tooltip" data-bs-title="Ver detalles">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="btn btn-sm btn-primary edit-btn" data-index="${index}" 
                    data-bs-toggle="tooltip" data-bs-title="Editar estación">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-danger delete-btn" data-index="${index}" 
                    data-bs-toggle="tooltip" data-bs-title="Eliminar estación">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    // Inicializar DataTable
    if ($.fn.DataTable.isDataTable('#stationsTable')) {
        $('#stationsTable').DataTable().destroy();
    }
    
    const dataTableOptions = {
        language: {
            url: '//cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json'
        },
        responsive: true,
        columnDefs: [
            { orderable: false, targets: 2 }
        ],
        autoFocus: false // Deshabilitar el enfoque automático
    };
    
    $('#stationsTable').DataTable(dataTableOptions);

    // Configurar eventos para los botones de acción
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            viewStation(parseInt(this.dataset.index));
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            editStation(parseInt(this.dataset.index));
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            deleteStation(parseInt(this.dataset.index));
        });
    });

    // Inicializar los tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Mostrar el modal
    const stationsModalElement = document.getElementById('stationsModal');
    const stationsModal = new bootstrap.Modal(stationsModalElement);
    
    // Restaurar el foco al botón "Editar" al cerrar el modal
    stationsModalElement.addEventListener('hidden.bs.modal', function () {
        document.getElementById('editButton').focus();
    });
    
    stationsModal.show();
}

// Función para ver los detalles de una estación
function viewStation(index) {
    const ciudad = stationsData.reproductor.ciudades[index];
    
    // Llenar datos en el modal de visualización
    document.getElementById('viewName').textContent = ciudad.name;
    document.getElementById('viewFreq').textContent = ciudad.frecuencia;
    document.getElementById('viewUrl').textContent = ciudad.serverUrl;
    document.getElementById('viewCx').textContent = ciudad.cx;
    document.getElementById('viewCy').textContent = ciudad.cy;
    
    // Actualizar el círculo en el mapa
    const viewCircle = document.getElementById('viewCircle');
    viewCircle.setAttribute('cx', ciudad.cx);
    viewCircle.setAttribute('cy', ciudad.cy);
    
    // Mostrar el modal
    const viewModal = new bootstrap.Modal(document.getElementById('viewStationModal'));
    viewModal.show();
}

// Función para abrir el formulario de edición de estación
function editStation(index) {
    const ciudad = stationsData.reproductor.ciudades[index];
    
    // Cambiar el título del modal
    document.getElementById('stationFormModalLabel').textContent = 'Editar Estación';
    
    // Mostrar el modal
    const formModalElement = document.getElementById('stationFormModal');
    const formModal = new bootstrap.Modal(formModalElement);

    formModalElement.addEventListener('shown.bs.modal', function () {
        const stationNameCityInput = document.getElementById('stationNameCity');

        // Llenar el formulario con los datos de la ciudad
        document.getElementById('stationIndex').value = index;
        stationNameCityInput.value = ciudad.name;
        document.getElementById('stationFreq').value = ciudad.frecuencia;
        document.getElementById('stationUrl').value = ciudad.serverUrl;
        document.getElementById('stationCx').value = ciudad.cx;
        document.getElementById('stationCy').value = ciudad.cy;

        // Actualizar el círculo en el mapa
        updateCirclePosition();
    });
    
    formModal.show();
}

// Función para abrir el formulario de agregar estación
function addStation() {
    // Limpiar el formulario
    document.getElementById('stationForm').reset();
    document.getElementById('stationIndex').value = -1;
    
    // Posición inicial del círculo en el centro
    document.getElementById('stationCx').value = "200.0";
    document.getElementById('stationCy').value = "200.0";
    
    // Cambiar el título del modal
    document.getElementById('stationFormModalLabel').textContent = 'Agregar Nueva Estación';
    
    // Cerrar el modal de estaciones antes de abrir el nuevo
    const stationsModal = bootstrap.Modal.getInstance(document.getElementById('stationsModal'));
    stationsModal.hide();
    
    // Remover manualmente cualquier backdrop que pudiera quedar
    setTimeout(() => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => {
            backdrop.classList.remove('show');
            setTimeout(() => backdrop.remove(), 150);
        });
        
        // Mostrar el modal de formulario después de limpiar
        const formModal = new bootstrap.Modal(document.getElementById('stationFormModal'));
        formModal.show();
        
        // Actualizar el círculo en el mapa
        updateCirclePosition();
    }, 300);
}

// Función para guardar una estación (nueva o editada)
function saveStation() {
    // Validar el formulario
    const form = document.getElementById('stationForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Obtener los valores del formulario
    const index = parseInt(document.getElementById('stationIndex').value);
    
    // Validar que las coordenadas tengan incrementos de 0.5
    const cxValue = parseFloat(document.getElementById('stationCx').value);
    const cyValue = parseFloat(document.getElementById('stationCy').value);
    
    // Verificar si las coordenadas son incrementos de 0.5
    if ((cxValue * 10) % 5 !== 0 || (cyValue * 10) % 5 !== 0) {
        showToast('Las coordenadas deben ser en incrementos de 0.5', 'error');
        return;
    }
    
    // Obtener el valor de serverUrl del campo y normalizarlo para coincidencias exactas
    let serverUrl = document.getElementById('stationUrl').value.trim();
    
    // Normalizar serverUrl: quitar el host si está incluido y barras iniciales
    serverUrl = normalizeServerUrl(serverUrl);
    
    const stationData = {
        name: document.getElementById('stationNameCity').value,
        frecuencia: document.getElementById('stationFreq').value,
        serverUrl: serverUrl,
        cx: cxValue.toString(),
        cy: cyValue.toString()
    };
    
    if (index === -1) {
        // Agregar nueva estación
        stationsData.reproductor.ciudades.push(stationData);
        showToast('Estación agregada correctamente', 'success');
    } else {
        // Mantener el serverUrl original si no ha cambiado para no perder las referencias
        const originalServerUrl = stationsData.reproductor.ciudades[index].serverUrl;
        if (originalServerUrl && !stationData.serverUrl) {
            stationData.serverUrl = originalServerUrl;
        }
        
        // Actualizar estación existente
        stationsData.reproductor.ciudades[index] = stationData;
        showToast('Estación actualizada correctamente', 'success');
    }
    
    // Cerrar el modal y actualizar la tabla
    const formModal = bootstrap.Modal.getInstance(document.getElementById('stationFormModal'));
    formModal.hide();
    
    // Eliminar cualquier backdrop residual
    setTimeout(() => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => {
            backdrop.classList.remove('show');
            setTimeout(() => backdrop.remove(), 150);
        });
        
        // Reabrir el modal de estaciones
        openStationsModal();
    }, 300);
}

// Función para eliminar una estación
function deleteStation(index) {
    // Obtener referencia a la estación para mostrar información en el modal
    const ciudad = stationsData.reproductor.ciudades[index];
    
    // Crear modal de confirmación
    const confirmModal = document.getElementById('deleteConfirmModal');
    if (confirmModal) {
        // Si ya existe el modal, actualizar su contenido
        document.getElementById('stationToDelete').textContent = `${ciudad.name} - ${ciudad.frecuencia}`;
        document.getElementById('confirmDeleteBtn').onclick = function() {
            // Ejecutar eliminación al confirmar
            stationsData.reproductor.ciudades.splice(index, 1);
            showToast('Estación eliminada correctamente', 'success');
            
            // Cerrar el modal y actualizar la tabla
            const bsModal = bootstrap.Modal.getInstance(confirmModal);
            bsModal.hide();
            openStationsModal();
        };
    } else {
        // Si no existe, crear un nuevo modal en el DOM
        const modalHTML = `
        <div class="modal fade" id="deleteConfirmModal" tabindex="-1" aria-labelledby="deleteConfirmModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="deleteConfirmModalLabel">Confirmar eliminación</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                    </div>
                    <div class="modal-body">
                        <p>¿Está seguro de que desea eliminar la estación <strong id="stationToDelete">${ciudad.name} - ${ciudad.frecuencia}</strong>?</p>
                        <p class="text-danger"><i class="fas fa-exclamation-triangle"></i> Esta acción no se puede deshacer.</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-danger" id="confirmDeleteBtn">Eliminar</button>
                    </div>
                </div>
            </div>
        </div>`;
        
        // Añadir el modal al DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Configurar el evento para el botón de confirmación
        document.getElementById('confirmDeleteBtn').onclick = function() {
            // Ejecutar eliminación al confirmar
            stationsData.reproductor.ciudades.splice(index, 1);
            showToast('Estación eliminada correctamente', 'success');
            
            // Cerrar el modal y actualizar la tabla
            const confirmModal = document.getElementById('deleteConfirmModal');
            const bsModal = bootstrap.Modal.getInstance(confirmModal);
            bsModal.hide();
            openStationsModal();
        };
    }
    
    // Mostrar el modal de confirmación
    const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
    modal.show();
}

// Función para abrir el modal de configuración
function openConfigModal() {
    if (!stationsData) {
        showToast('Error: No se han cargado los datos de configuración', 'error');
        return;
    }
    
    const config = stationsData.reproductor;
    
    // Llenar el formulario con los datos del reproductor
    document.getElementById('configName').value = config.estacion;
    document.getElementById('configHostUrl').value = config.hostUrl;
    
    // Actualizar el valor del slider y el texto
    const radiusInput = document.getElementById('configRadius');
    radiusInput.value = config.r;
    document.getElementById('radiusValue').textContent = config.r;
    
    document.getElementById('configLogo').value = config.url_logo;
    
    // Actualizar la previsualización del logo
    const logoUrl = config.url_logo;
    if (logoUrl) {
        const logoPreviewIcon = document.getElementById('logoPreviewIcon');
        logoPreviewIcon.src = logoUrl;
        logoPreviewIcon.onerror = function() {
            this.src = 'img/radio-ico.ico';
        };
        
        const previewDiv = document.getElementById('logoPreview');
        previewDiv.innerHTML = `<img src="${logoUrl}" alt="Logo Preview" style="max-width: 100px; max-height: 100px;">`;
    }
    
    // Cerrar el modal de estaciones antes de abrir el nuevo
    const stationsModal = bootstrap.Modal.getInstance(document.getElementById('stationsModal'));
    stationsModal.hide();
    
    // Remover manualmente cualquier backdrop que pudiera quedar
    setTimeout(() => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => {
            backdrop.classList.remove('show');
            setTimeout(() => backdrop.remove(), 150);
        });
        
        // Mostrar el modal de configuración después de limpiar
        const configModal = new bootstrap.Modal(document.getElementById('configModal'));
        configModal.show();
    }, 300);
}

// Función para guardar la configuración
function saveConfig() {
    // Validar el formulario
    const form = document.getElementById('configForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Validar específicamente el radio
    const radiusValue = parseFloat(document.getElementById('configRadius').value);
    if (radiusValue < 4 || radiusValue > 10 || (radiusValue * 10) % 5 !== 0) {
        alert("El radio debe estar entre 4 y 10, en incrementos de 0.5");
        return;
    }
    
    // Actualizar los datos del reproductor
    stationsData.reproductor.estacion = document.getElementById('configName').value;
    stationsData.reproductor.hostUrl = document.getElementById('configHostUrl').value;
    // No modificamos statusUrl para conservar su valor original
    stationsData.reproductor.r = document.getElementById('configRadius').value;
    stationsData.reproductor.url_logo = document.getElementById('configLogo').value;
    
    // Mostrar toast con botón de guardar todos los cambios
    showToastWithSaveButton('Configuración guardada correctamente');
    
    // Cerrar el modal de configuración
    const configModal = bootstrap.Modal.getInstance(document.getElementById('configModal'));
    configModal.hide();
    
    // Eliminar cualquier backdrop residual
    setTimeout(() => {
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(backdrop => {
            backdrop.classList.remove('show');
            setTimeout(() => backdrop.remove(), 150);
        });
        
        // Reabrir el modal de estaciones
        openStationsModal();
    }, 300);
}

// Nueva función para mostrar toast con botón de guardar
function showToastWithSaveButton(message) {
    // Crear un toast personalizado con botón
    const toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) return;
    
    // Crear un nuevo elemento toast
    const customToast = document.createElement('div');
    customToast.classList.add('toast');
    customToast.setAttribute('role', 'alert');
    customToast.setAttribute('aria-live', 'assertive');
    customToast.setAttribute('aria-atomic', 'true');
    
    // Añadir clases de tema oscuro si es necesario
    if (document.body.getAttribute('data-theme') === 'dark') {
        customToast.classList.add('toast-dark');
    }
    
    // Contenido del toast con botón adaptado al tema
    customToast.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">Éxito</strong>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            <div class="d-flex justify-content-between align-items-center">
                <div>${message}</div>
                <button id="saveAllInToast" class="btn btn-primary btn-sm">Guardar Todo</button>
            </div>
        </div>
    `;
    
    // Agregar el toast al contenedor
    toastContainer.appendChild(customToast);
    
    // Inicializar el toast
    const bsToast = new bootstrap.Toast(customToast, {
        autohide: false
    });
    
    // Mostrar el toast
    bsToast.show();
    
    // Agregar evento al botón de guardar
    const saveButton = customToast.querySelector('#saveAllInToast');
    if (saveButton) {
        saveButton.addEventListener('click', function() {
            saveAllChanges();
            bsToast.hide();
        });
    }
    
    // Eliminar el toast del DOM cuando se oculte
    customToast.addEventListener('hidden.bs.toast', function() {
        if (customToast.parentNode) {
            customToast.parentNode.removeChild(customToast);
        }
    });
}

// Función para mostrar notificaciones Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('notificationToast');
    const toastMessage = document.getElementById('toastMessage');
    const toastTitle = document.getElementById('toastTitle');
    
    toastMessage.textContent = message;
    toastTitle.textContent = type === 'success' ? 'Éxito' : 'Error';
    
    if (type === 'success') {
        toast.classList.remove('text-bg-danger');
        toast.classList.add('text-bg-success');
    } else {
        toast.classList.remove('text-bg-success');
        toast.classList.add('text-bg-danger');
    }
    
    // Asegurar que el botón de cierre tenga las clases correctas
    const closeBtn = toast.querySelector('.btn-close');
    if (closeBtn) {
        closeBtn.classList.add('btn-close-white');
    }
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Función para actualizar la posición del círculo en el mapa de vista previa
function updateCirclePosition() {
    const stationCx = document.getElementById('stationCx');
    const stationCy = document.getElementById('stationCy');

    if (!stationCx || !stationCy) {
        console.error('stationCx or stationCy not found');
        return;
    }

    // Obtener y ajustar valores a incrementos de 0.5
    let cx = parseFloat(stationCx.value);
    let cy = parseFloat(stationCy.value);
    
    // Ajustar el valor más cercano a 0.5
    if (!isNaN(cx) && (cx * 10) % 5 !== 0) {
        cx = Math.round(cx * 2) / 2;
        stationCx.value = cx;
    }
    
    if (!isNaN(cy) && (cy * 10) % 5 !== 0) {
        cy = Math.round(cy * 2) / 2;
        stationCy.value = cy;
    }
    
    const circle = document.getElementById('stationCircle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
}

// Función para guardar todos los cambios en el archivo JSON
function saveAllChanges() {
    console.log('saveAllChanges llamada');
    
    // NUEVO: Mostrar spinner de carga antes de comenzar el proceso
    showLoadingSpinner('Guardando cambios...');
    
    // NUEVO: Ordenar las ciudades alfabéticamente por nombre antes de guardar
    stationsData.reproductor.ciudades.sort((a, b) => {
        // Ignorar mayúsculas/minúsculas en la comparación
        const nameA = a.name.toLowerCase();
        const nameB = b.name.toLowerCase();
        
        if (nameA < nameB) return -1;
        if (nameA > nameB) return 1;
        return 0;
    });
    
    // NUEVO: Normalizar todas las URLs de servidores antes de guardar
    stationsData.reproductor.ciudades.forEach(ciudad => {
        if (ciudad.serverUrl) {
            ciudad.serverUrl = normalizeServerUrl(ciudad.serverUrl);
        }
    });
    
    const jsonData = JSON.stringify(stationsData, null, 4);
    console.log('Longitud de datos JSON:', jsonData.length);
    
    try {
        // Usar Fetch API para guardar los datos en el servidor
        fetch('save_stations.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache' // Evitar caché
            },
            body: JSON.stringify({ data: jsonData }),
            redirect: 'follow'
        })
        .then(response => {
            console.log('Respuesta recibida:', response.status, response.statusText);
            
            // Convertir a texto para depuración en caso de error
            return response.text().then(text => {
                try {
                    // Intentar parsear como JSON
                    const data = JSON.parse(text);
                    if (response.ok) {
                        console.log('Operación exitosa:', data);
                        
                        // Cerrar el modal de estaciones si está abierto
                        const stationsModal = bootstrap.Modal.getInstance(document.getElementById('stationsModal'));
                        if (stationsModal) {
                            stationsModal.hide();
                        }
                        
                        // MODIFICADO: En lugar de recargar, forzar reinicio del mapa
                        hideLoadingSpinner();
                        reinitializeMapWithSpinner();
                    } else {
                        console.error('Error del servidor:', data);
                        hideLoadingSpinner();
                        showToast(`Error: ${data.message || 'Error desconocido'}`, 'error');
                    }
                    return data;
                } catch (e) {
                    // Si no es JSON, mostrar el texto completo
                    console.error('Respuesta no es JSON:', text);
                    hideLoadingSpinner();
                    showToast('Error: Respuesta del servidor inválida', 'error');
                    throw new Error('Respuesta del servidor inválida');
                }
            });
        })
        .catch(error => {
            console.error('Error en fetch:', error);
            hideLoadingSpinner();
            showToast(`Error al guardar: ${error.message}`, 'error');
        });
    } catch (error) {
        console.error('Error en la solicitud:', error);
        hideLoadingSpinner();
        showToast(`Error en la solicitud: ${error.message}`, 'error');
    }
}

// Función para mostrar notificaciones Toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('notificationToast');
    const toastMessage = document.getElementById('toastMessage');
    const toastTitle = document.getElementById('toastTitle');
    
    toastMessage.textContent = message;
    toastTitle.textContent = type === 'success' ? 'Éxito' : 'Error';
    
    if (type === 'success') {
        toast.classList.remove('text-bg-danger');
        toast.classList.add('text-bg-success');
    } else {
        toast.classList.remove('text-bg-success');
        toast.classList.add('text-bg-danger');
    }
    
    // Asegurar que el botón de cierre tenga las clases correctas
    const closeBtn = toast.querySelector('.btn-close');
    if (closeBtn) {
        closeBtn.classList.add('btn-close-white');
    }
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}

// Agregar esta función para limpiar backdrops residuales
function cleanupModalBackdrops() {
    const backdrops = document.querySelectorAll('.modal-backdrop');
    if (backdrops.length > 0) {
        backdrops.forEach(backdrop => {
            backdrop.classList.remove('show');
            setTimeout(() => backdrop.remove(), 150);
        });
    }
}

// También añadir una función de ayuda para normalizar las URLs de servidores
function normalizeServerUrl(url) {
    if (!url) return '';
    
    // Quitar protocolo y host si están presentes
    let normalized = url;
    if (url.includes('//')) {
        try {
            const urlObj = new URL(url);
            normalized = urlObj.pathname.startsWith('/') ? urlObj.pathname.substring(1) : urlObj.pathname;
        } catch (e) {
            console.warn('Error al normalizar URL:', e);
        }
    }
    
    // Quitar barras iniciales y finales
    normalized = normalized.replace(/^\/+|\/+$/g, '');
    
    return normalized;
}

// Agregar esta función para limpiar los tooltips cuando se cierran los modales
document.addEventListener('hidden.bs.modal', function () {
    // Destruir todos los tooltips para evitar elementos huérfanos en el DOM
    const tooltips = bootstrap.Tooltip.getInstance('[data-bs-toggle="tooltip"]');
    if (tooltips) {
        tooltips.dispose();
    }
});

/**
 * Muestra un spinner de carga durante los procesos que requieren tiempo
 * @param {string} message - Mensaje a mostrar durante la carga
 */
function showLoadingSpinner(message = 'Cargando...') {
    // Verificar si ya existe un spinner y eliminarlo
    hideLoadingSpinner();
    
    // Crear overlay para el spinner
    const spinnerOverlay = document.createElement('div');
    spinnerOverlay.id = 'spinnerOverlay';
    spinnerOverlay.style.position = 'fixed';
    spinnerOverlay.style.top = '0';
    spinnerOverlay.style.left = '0';
    spinnerOverlay.style.width = '100%';
    spinnerOverlay.style.height = '100%';
    spinnerOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    spinnerOverlay.style.display = 'flex';
    spinnerOverlay.style.justifyContent = 'center';
    spinnerOverlay.style.alignItems = 'center';
    spinnerOverlay.style.zIndex = '9999';
    spinnerOverlay.style.flexDirection = 'column';
    
    // Crear el spinner
    const spinnerContainer = document.createElement('div');
    spinnerContainer.style.textAlign = 'center';
    spinnerContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    spinnerContainer.style.padding = '25px';
    spinnerContainer.style.borderRadius = '10px';
    spinnerContainer.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
    
    spinnerContainer.innerHTML = `
        <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Cargando...</span>
        </div>
        <div class="mt-3" style="color: #333; font-weight: bold;">${message}</div>
    `;
    
    // Añadir el spinner al overlay
    spinnerOverlay.appendChild(spinnerContainer);
    
    // Añadir el overlay al body
    document.body.appendChild(spinnerOverlay);
}

/**
 * Oculta el spinner de carga
 */
function hideLoadingSpinner() {
    const existingOverlay = document.getElementById('spinnerOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
}

/**
 * Reinicializa el mapa forzando una recarga y mostrando un spinner
 */
function reinitializeMapWithSpinner() {
    showLoadingSpinner('Reinicializando mapa...');
    
    try {
        // Limpiar contenedor de estaciones
        const playersContainer = document.getElementById('players-container');
        if (playersContainer) {
            playersContainer.innerHTML = '';
        }
        
        // Fetch reciente de los datos (sin caché)
        fetch('data/stations.json?nocache=' + new Date().getTime())
            .then(response => response.json())
            .then(data => {
                console.log('Datos recargados:', data);
                
                // Actualizar la variable global
                window.stationsData = data;
                
                setTimeout(() => {
                    if (typeof window.initializePlayer === 'function') {
                        try {
                            const reproductor = data.reproductor;
                            const statusUrlCompleta = `${reproductor.hostUrl}/${reproductor.statusUrl}`;
                            const hostSRV = reproductor.hostUrl;
                            
                            // Reinicializar el mapa con los datos frescos
                            window.initializePlayer(reproductor, statusUrlCompleta, hostSRV);
                            
                            // Mostrar mensaje de éxito
                            setTimeout(() => {
                                hideLoadingSpinner();
                                showToast('Mapa reinicializado con éxito', 'success');
                            }, 500);
                        } catch (error) {
                            console.error('Error al reinicializar el mapa:', error);
                            hideLoadingSpinner();
                            showToast('Error al reinicializar el mapa. Recargando página...', 'error');
                            setTimeout(() => window.location.reload(), 1500);
                        }
                    } else {
                        // Si la función no está disponible, recargar la página
                        console.error('Función initializePlayer no disponible');
                        hideLoadingSpinner();
                        showToast('Reiniciando aplicación...', 'info');
                        setTimeout(() => window.location.reload(), 1000);
                    }
                }, 800); // Pequeño retraso para asegurar que el DOM está listo
            })
            .catch(error => {
                console.error('Error al cargar datos actualizados:', error);
                hideLoadingSpinner();
                showToast('Error al reiniciar el mapa. Recargando página...', 'error');
                setTimeout(() => window.location.reload(), 1500);
            });
    } catch (error) {
        console.error('Error en reinicialización:', error);
        hideLoadingSpinner();
        showToast('Error crítico. Recargando página...', 'error');
        setTimeout(() => window.location.reload(), 1000);
    }
}
