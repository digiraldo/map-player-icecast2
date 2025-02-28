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
                                            <input type="number" class="form-control" id="stationCx" required step="0.1">
                                        </div>
                                    </div>
                                    <div class="col">
                                        <div class="mb-3">
                                            <label for="stationCy" class="form-label">Coordenada Y</label>
                                            <input type="number" class="form-control" id="stationCy" required step="0.1">
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
                            <label for="configStatusUrl" class="form-label">Status URL</label>
                            <input type="text" class="form-control" id="configStatusUrl" required>
                        </div>
                        <div class="mb-3">
                            <label for="configGenero" class="form-label">Género</label>
                            <input type="text" class="form-control" id="configGenero">
                        </div>
                        <div class="mb-3">
                            <label for="configRadius" class="form-label">Radio (r)</label>
                            <input type="number" class="form-control" id="configRadius" min="1" step="1">
                        </div>
                        <div class="mb-3">
                            <label for="configLogo" class="form-label">URL Logo</label>
                            <input type="url" class="form-control" id="configLogo">
                            <div class="mt-2" id="logoPreview" style="text-align: center;"></div>
                        </div>
                        <div class="row">
                            <div class="col">
                                <div class="mb-3">
                                    <label for="configCardLeft" class="form-label">Tarjeta Posición X</label>
                                    <input type="text" class="form-control" id="configCardLeft">
                                </div>
                            </div>
                            <div class="col">
                                <div class="mb-3">
                                    <label for="configCardTop" class="form-label">Tarjeta Posición Y</label>
                                    <input type="text" class="form-control" id="configCardTop">
                                </div>
                            </div>
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
        
        if (logoUrl) {
            previewDiv.innerHTML = `<img src="${logoUrl}" alt="Logo Preview" style="max-width: 100px; max-height: 100px;">`;
        } else {
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
                <button class="btn btn-sm btn-info view-btn" data-index="${index}"><i class="fas fa-eye"></i></button>
                <button class="btn btn-sm btn-primary edit-btn" data-index="${index}"><i class="fas fa-edit"></i></button>
                <button class="btn btn-sm btn-danger delete-btn" data-index="${index}"><i class="fas fa-trash"></i></button>
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
    // console.log('addStation called');
    // Limpiar el formulario
    document.getElementById('stationForm').reset();
    document.getElementById('stationIndex').value = -1;
    
    // Posición inicial del círculo en el centro
    document.getElementById('stationCx').value = "200";
    document.getElementById('stationCy').value = "200";
    
    // Cambiar el título del modal
    document.getElementById('stationFormModalLabel').textContent = 'Agregar Nueva Estación';
    
    // Mostrar el modal
    const stationsModal = bootstrap.Modal.getInstance(document.getElementById('stationsModal'));
    stationsModal.hide();
    
    const formModalElement = document.getElementById('stationFormModal');
    const formModal = new bootstrap.Modal(formModalElement);

    formModalElement.addEventListener('shown.bs.modal', function () {
        // Actualizar el círculo en el mapa
        updateCirclePosition();
    });
    
    formModal.show();
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
    const stationData = {
        name: document.getElementById('stationNameCity').value,
        frecuencia: document.getElementById('stationFreq').value,
        serverUrl: document.getElementById('stationUrl').value,
        cx: document.getElementById('stationCx').value,
        cy: document.getElementById('stationCy').value
    };
    
    if (index === -1) {
        // Agregar nueva estación
        stationsData.reproductor.ciudades.push(stationData);
        showToast('Estación agregada correctamente', 'success');
    } else {
        // Actualizar estación existente
        stationsData.reproductor.ciudades[index] = stationData;
        showToast('Estación actualizada correctamente', 'success');
    }
    
    // Actualizar la cuenta total de estaciones
    stationsData.reproductor.total_estaciones = stationsData.reproductor.ciudades.length;
    
    // Cerrar el modal y actualizar la tabla
    const formModal = bootstrap.Modal.getInstance(document.getElementById('stationFormModal'));
    formModal.hide();
    
    // Reabrir el modal de estaciones
    setTimeout(() => {
        openStationsModal();
    }, 500);
}

// Función para eliminar una estación
function deleteStation(index) {
    if (confirm('¿Está seguro de que desea eliminar esta estación?')) {
        stationsData.reproductor.ciudades.splice(index, 1);
        
        // Actualizar la cuenta total de estaciones
        stationsData.reproductor.total_estaciones = stationsData.reproductor.ciudades.length;
        
        showToast('Estación eliminada correctamente', 'success');
        
        // Actualizar la tabla
        openStationsModal();
    }
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
    document.getElementById('configStatusUrl').value = config.statusUrl;
    document.getElementById('configGenero').value = config.genero;
    document.getElementById('configRadius').value = config.r;
    document.getElementById('configLogo').value = config.url_logo;
    
    // Configuración de la posición de la tarjeta
    if (config.infoCard) {
        document.getElementById('configCardLeft').value = config.infoCard.left;
        document.getElementById('configCardTop').value = config.infoCard.top;
    }
    
    // Previsualizar el logo
    const previewDiv = document.getElementById('logoPreview');
    if (config.url_logo) {
        previewDiv.innerHTML = `<img src="${config.url_logo}" alt="Logo Preview" style="max-width: 100px; max-height: 100px;">`;
    } else {
        previewDiv.innerHTML = '';
    }
    
    // Ocultar el modal de estaciones
    const stationsModal = bootstrap.Modal.getInstance(document.getElementById('stationsModal'));
    stationsModal.hide();
    
    // Mostrar el modal de configuración
    setTimeout(() => {
        const configModal = new bootstrap.Modal(document.getElementById('configModal'));
        configModal.show();
    }, 500);
}

// Función para guardar la configuración
function saveConfig() {
    // Validar el formulario
    const form = document.getElementById('configForm');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    // Actualizar los datos del reproductor
    stationsData.reproductor.estacion = document.getElementById('configName').value;
    stationsData.reproductor.hostUrl = document.getElementById('configHostUrl').value;
    stationsData.reproductor.statusUrl = document.getElementById('configStatusUrl').value;
    stationsData.reproductor.genero = document.getElementById('configGenero').value;
    stationsData.reproductor.r = document.getElementById('configRadius').value;
    stationsData.reproductor.url_logo = document.getElementById('configLogo').value;
    
    // Actualizar la posición de la tarjeta
    if (!stationsData.reproductor.infoCard) {
        stationsData.reproductor.infoCard = {};
    }
    stationsData.reproductor.infoCard.left = document.getElementById('configCardLeft').value;
    stationsData.reproductor.infoCard.top = document.getElementById('configCardTop').value;
    
    showToast('Configuración guardada correctamente', 'success');
    
    // Cerrar el modal de configuración
    const configModal = bootstrap.Modal.getInstance(document.getElementById('configModal'));
    configModal.hide();
    
    // Reabrir el modal de estaciones
    setTimeout(() => {
        openStationsModal();
    }, 500);
}

// Función para actualizar la posición del círculo en el mapa de vista previa
function updateCirclePosition() {
    const stationCx = document.getElementById('stationCx');
    const stationCy = document.getElementById('stationCy');

    if (!stationCx || !stationCy) {
        console.error('stationCx or stationCy not found');
        return;
    }

    const cx = stationCx.value;
    const cy = stationCy.value;
    
    const circle = document.getElementById('stationCircle');
    circle.setAttribute('cx', cx);
    circle.setAttribute('cy', cy);
}

// Función para guardar todos los cambios en el archivo JSON
function saveAllChanges() {
    console.log('saveAllChanges llamada'); // Agregar este console.log
    const jsonData = JSON.stringify(stationsData, null, 4);
    console.log('Datos JSON a enviar:', jsonData); // Agregar este console.log
    
    try {
        // Usar Fetch API para guardar los datos en el servidor
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Timeout de 5 segundos
        
        fetch('../save_stations.php', { // Verificar la ruta aquí
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: jsonData }),
            signal: controller.signal
        })
        .then(response => {
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error('Error al guardar los datos');
            }
            return response.json();
        })
        .then(data => {
            console.log('Respuesta del servidor:', data); // Agregar este console.log
            showToast('Cambios guardados correctamente en el servidor', 'success');
        })
        .catch(error => {
            clearTimeout(timeoutId);
            console.error('Error:', error);
            showToast('Error al guardar los cambios en el servidor', 'error');
        });
    } catch (error) {
        console.error('Error en la solicitud fetch:', error); // Agregar este console.log
        showToast('Error al guardar los cambios en el servidor', 'error');
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
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
}
