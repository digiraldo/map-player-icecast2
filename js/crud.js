document.addEventListener("DOMContentLoaded", function() {
    // Variables globales
    let datosEstaciones = {};
    let tablaCiudades;
    let mapaActual;
    let circuloActual;
    
    // Modifica la función cargarDatos() así:
    function cargarDatos() {
        // Intentar cargar desde localStorage primero
        const datosGuardados = localStorage.getItem('radioStations');
        
        if (datosGuardados) {
            try {
                datosEstaciones = JSON.parse(datosGuardados);
                inicializarTabla();
                crearModales();
                configurarEventos();
                return;
            } catch (e) {
                console.error("Error cargando datos desde localStorage:", e);
            }
        }
        
        // Si no hay datos en localStorage o hay un error, cargar desde archivo
        fetch('./data/stations.json')
            .then(response => response.json())
            .then(data => {
                datosEstaciones = data;
                inicializarTabla();
                crearModales();
                configurarEventos();
            })
            .catch(error => console.error('Error al cargar los datos:', error));
    }
    
    // Inicializar DataTable con las ciudades
    function inicializarTabla() {
        // Crear estructura de modal principal si no existe
        if (!document.getElementById('crudModal')) {
            const modalHTML = `
                <div class="modal fade" id="crudModal" tabindex="-1" aria-labelledby="crudModalLabel" aria-hidden="true">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header card-header">
                                <h5 class="modal-title" id="crudModalLabel">Gestionar Estaciones</h5>
                                <div class="ms-auto">
                                    <button type="button" id="btnAgregarCiudad" class="btn btn-sm btn-success me-2">
                                        <i class="fas fa-plus"></i> Nueva Ciudad
                                    </button>
                                    <button type="button" id="btnEditarReproductor" class="btn btn-sm btn-primary me-2">
                                        <i class="fas fa-cog"></i> Editar Reproductor
                                    </button>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                                </div>
                            </div>
                            <div class="modal-body">
                                <table id="tablaCiudades" class="table table-striped" style="width:100%">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Frecuencia</th>
                                            <th>URL del Servidor</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody></tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        // Si la tabla ya fue inicializada, destrúyela antes de recrearla
        if (tablaCiudades) {
            tablaCiudades.destroy();
        }
        
        // Inicializar DataTable
        tablaCiudades = $('#tablaCiudades').DataTable({
            data: datosEstaciones.reproductor.ciudades,
            columns: [
                { data: 'name' },
                { data: 'frecuencia' },
                { data: 'serverUrl' },
                { 
                    data: null,
                    defaultContent: `
                        <button class="btn btn-sm btn-info btnVer"><i class="fas fa-eye"></i></button>
                        <button class="btn btn-sm btn-warning btnEditar"><i class="fas fa-edit"></i></button>
                        <button class="btn btn-sm btn-danger btnBorrar"><i class="fas fa-trash-alt"></i></button>
                    `,
                    orderable: false
                }
            ],
            language: {
                url: '//cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json'
            },
            responsive: true
        });
        
        // Aplicar estilo acorde al tema actual
        actualizarTema();
    }
    
    // Crear modales adicionales para operaciones CRUD
    function crearModales() {
        // Modal para ver/editar/agregar ciudad
        const modalCiudadHTML = `
            <div class="modal fade" id="modalCiudad" tabindex="-1" aria-hidden="true">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header card-header">
                            <h5 class="modal-title" id="modalCiudadTitulo">Ciudad</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                        </div>
                        <div class="modal-body">
                            <form id="formCiudad">
                                <input type="hidden" id="indiceCiudad">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="nombre" class="form-label">Nombre</label>
                                            <input type="text" class="form-control" id="nombre" required>
                                        </div>
                                        <div class="mb-3">
                                            <label for="frecuencia" class="form-label">Frecuencia</label>
                                            <input type="text" class="form-control" id="frecuencia" required>
                                        </div>
                                        <div class="mb-3">
                                            <label for="serverUrl" class="form-label">URL del Servidor</label>
                                            <input type="text" class="form-control" id="serverUrl" required>
                                        </div>
                                        <div class="mb-3">
                                            <label for="cx" class="form-label">Coordenada X</label>
                                            <input type="text" class="form-control" id="cx" required>
                                        </div>
                                        <div class="mb-3">
                                            <label for="cy" class="form-label">Coordenada Y</label>
                                            <input type="text" class="form-control" id="cy" required>
                                        </div>
                                        <div class="mb-3">
                                            <label for="fill" class="form-label">Color de relleno</label>
                                            <input type="color" class="form-control" id="fill" value="#ff0000">
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div id="miniMapa" style="width: 100%; height: 300px; position: relative; overflow: hidden;">
                                            <svg id="mapaPrevisualizacion" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 553.76801" style="width: 100%; height: 100%;">
                                                <image href="img/colombia-mapa.svg" width="100%" height="100%" />
                                                <circle id="circuloPrevisualizacion" cx="150" cy="150" r="7" fill="#ff0000" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="btnGuardarCiudad">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
// Modal para editar reproductor principal
const modalReproductorHTML = `
    <div class="modal fade" id="modalReproductor" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header card-header">
                    <h5 class="modal-title">Configuración del Reproductor</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
                </div>
                <div class="modal-body">
                    <form id="formReproductor">
                        <div class="mb-3">
                            <label for="estacion" class="form-label">Estación</label>
                            <input type="text" class="form-control" id="estacion" required>
                        </div>
                        <div class="mb-3">
                            <label for="hostUrl" class="form-label">Host URL</label>
                            <input type="text" class="form-control" id="hostUrl" required>
                        </div>
                        <div class="mb-3">
                            <label for="statusUrl" class="form-label">Status URL</label>
                            <input type="text" class="form-control" id="statusUrl" required>
                        </div>
                        <div class="mb-3">
                            <label for="total_estaciones" class="form-label">Total Estaciones</label>
                            <input type="number" class="form-control" id="total_estaciones" required>
                        </div>
                        <div class="mb-3">
                            <label for="genero" class="form-label">Género</label>
                            <input type="text" class="form-control" id="genero">
                        </div>
                        <div class="mb-3">
                            <label for="r" class="form-label">Radio del círculo (4-10)</label>
                            <input type="range" class="form-control" id="r" min="4" max="10" step="0.5" required>
                            <div class="d-flex justify-content-between">
                                <span>4</span>
                                <output id="rValue"></output>
                                <span>10</span>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="url_logo" class="form-label">URL del Logo</label>
                            <input type="text" class="form-control" id="url_logo" required>
                        </div>
                        <div class="text-center mb-3">
                            <img id="previewLogo" src="" class="img-fluid" style="max-height: 100px;">
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btnGuardarReproductor">Guardar</button>
                </div>
            </div>
        </div>
    </div>
`;
        
        document.body.insertAdjacentHTML('beforeend', modalCiudadHTML);
        document.body.insertAdjacentHTML('beforeend', modalReproductorHTML);
    }
    
    // Configurar eventos para botones y controles
    function configurarEventos() {
        // Botón para agregar nueva ciudad
        document.getElementById('btnAgregarCiudad').addEventListener('click', function() {
            document.getElementById('modalCiudadTitulo').textContent = 'Agregar Nueva Ciudad';
            document.getElementById('formCiudad').reset();
            document.getElementById('indiceCiudad').value = '';
            
            // Configurar círculo de previsualización con valores predeterminados
            const circulo = document.getElementById('circuloPrevisualizacion');
            circulo.setAttribute('cx', '150');
            circulo.setAttribute('cy', '150');
            circulo.setAttribute('fill', '#ff0000');
            
            const modalCiudad = new bootstrap.Modal(document.getElementById('modalCiudad'));
            modalCiudad.show();
            
            mapaActual = document.getElementById('mapaPrevisualizacion');
            circuloActual = circulo;
        });
        
        // Botón para editar reproductor principal
        document.getElementById('btnEditarReproductor').addEventListener('click', function() {
            const rep = datosEstaciones.reproductor;
            document.getElementById('estacion').value = rep.estacion;
            document.getElementById('hostUrl').value = rep.hostUrl;
            document.getElementById('statusUrl').value = rep.statusUrl;
            document.getElementById('total_estaciones').value = rep.total_estaciones;
            document.getElementById('genero').value = rep.genero;
            document.getElementById('r').value = rep.r;
            document.getElementById('rValue').textContent = rep.r;  // Establecer el valor de salida
            document.getElementById('url_logo').value = rep.url_logo;
            document.getElementById('previewLogo').src = rep.url_logo;
            
            const modalReproductor = new bootstrap.Modal(document.getElementById('modalReproductor'));
            modalReproductor.show();
        });
        
        // Preview de logo al cambiar URL
        document.getElementById('url_logo').addEventListener('input', function() {
            document.getElementById('previewLogo').src = this.value;
        });


        // Añade esto en la función configurarEventos() después del evento url_logo:

        // Mostrar el valor actual del radio
        document.getElementById('r').addEventListener('input', function() {
            document.getElementById('rValue').textContent = this.value;
        });

        
        // Ver ciudad
        $('#tablaCiudades tbody').on('click', '.btnVer', function() {
            const data = tablaCiudades.row($(this).parents('tr')).data();
            document.getElementById('modalCiudadTitulo').textContent = 'Ver Ciudad';
            
            // Llenar formulario
            document.getElementById('nombre').value = data.name;
            document.getElementById('frecuencia').value = data.frecuencia;
            document.getElementById('serverUrl').value = data.serverUrl;
            document.getElementById('cx').value = data.cx;
            document.getElementById('cy').value = data.cy;
            document.getElementById('fill').value = data.fill || '#ff0000';
            
            // Configurar formulario como solo lectura
            const inputs = document.getElementById('formCiudad').querySelectorAll('input');
            inputs.forEach(input => input.setAttribute('readonly', true));
            document.getElementById('btnGuardarCiudad').style.display = 'none';
            
            // Mostrar ubicación en el mapa
            const circulo = document.getElementById('circuloPrevisualizacion');
            circulo.setAttribute('cx', data.cx);
            circulo.setAttribute('cy', data.cy);
            circulo.setAttribute('fill', data.fill || '#ff0000');
            
            const modalCiudad = new bootstrap.Modal(document.getElementById('modalCiudad'));
            modalCiudad.show();
        });
        
        // Editar ciudad
        $('#tablaCiudades tbody').on('click', '.btnEditar', function() {
            const data = tablaCiudades.row($(this).parents('tr')).data();
            const index = tablaCiudades.row($(this).parents('tr')).index();
            document.getElementById('modalCiudadTitulo').textContent = 'Editar Ciudad';
            document.getElementById('indiceCiudad').value = index;
            
            // Llenar formulario
            document.getElementById('nombre').value = data.name;
            document.getElementById('frecuencia').value = data.frecuencia;
            document.getElementById('serverUrl').value = data.serverUrl;
            document.getElementById('cx').value = data.cx;
            document.getElementById('cy').value = data.cy;
            document.getElementById('fill').value = data.fill || '#ff0000';
            
            // Quitar readonly de los inputs
            const inputs = document.getElementById('formCiudad').querySelectorAll('input');
            inputs.forEach(input => input.removeAttribute('readonly'));
            document.getElementById('btnGuardarCiudad').style.display = 'block';
            
            // Mostrar ubicación en el mapa
            const circulo = document.getElementById('circuloPrevisualizacion');
            circulo.setAttribute('cx', data.cx);
            circulo.setAttribute('cy', data.cy);
            circulo.setAttribute('fill', data.fill || '#ff0000');
            
            const modalCiudad = new bootstrap.Modal(document.getElementById('modalCiudad'));
            modalCiudad.show();
            
            // Guardar referencias para actualización en tiempo real
            mapaActual = document.getElementById('mapaPrevisualizacion');
            circuloActual = circulo;
        });
        
        // Borrar ciudad
        $('#tablaCiudades tbody').on('click', '.btnBorrar', function() {
            if (confirm('¿Está seguro de que desea eliminar esta ciudad?')) {
                const index = tablaCiudades.row($(this).parents('tr')).index();
                datosEstaciones.reproductor.ciudades.splice(index, 1);
                tablaCiudades.clear().rows.add(datosEstaciones.reproductor.ciudades).draw();
                guardarDatos();
            }
        });
        
        // Guardar ciudad
        document.getElementById('btnGuardarCiudad').addEventListener('click', function() {
            const index = document.getElementById('indiceCiudad').value;
            const ciudad = {
                name: document.getElementById('nombre').value,
                frecuencia: document.getElementById('frecuencia').value,
                serverUrl: document.getElementById('serverUrl').value,
                cx: document.getElementById('cx').value,
                cy: document.getElementById('cy').value,
                fill: document.getElementById('fill').value,
                stroke: "#000000",
                "stroke-width": "0"
            };
            
            if (index === '') {
                // Agregar nueva ciudad
                datosEstaciones.reproductor.ciudades.push(ciudad);
            } else {
                // Actualizar ciudad existente
                datosEstaciones.reproductor.ciudades[index] = ciudad;
            }
            
            // Actualizar tabla y guardar datos
            tablaCiudades.clear().rows.add(datosEstaciones.reproductor.ciudades).draw();
            guardarDatos();
            
            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('modalCiudad')).hide();
        });
        
        // Guardar reproductor
        document.getElementById('btnGuardarReproductor').addEventListener('click', function() {
            datosEstaciones.reproductor.estacion = document.getElementById('estacion').value;
            datosEstaciones.reproductor.hostUrl = document.getElementById('hostUrl').value;
            datosEstaciones.reproductor.statusUrl = document.getElementById('statusUrl').value;
            datosEstaciones.reproductor.total_estaciones = document.getElementById('total_estaciones').value;
            datosEstaciones.reproductor.genero = document.getElementById('genero').value;
            datosEstaciones.reproductor.r = document.getElementById('r').value;
            datosEstaciones.reproductor.url_logo = document.getElementById('url_logo').value;
            
            guardarDatos();
            
            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('modalReproductor')).hide();
        });
        
        // Actualización en tiempo real de coordenadas
        document.getElementById('cx').addEventListener('input', function() {
            if (circuloActual) circuloActual.setAttribute('cx', this.value);
        });
        
        document.getElementById('cy').addEventListener('input', function() {
            if (circuloActual) circuloActual.setAttribute('cy', this.value);
        });
        
        document.getElementById('fill').addEventListener('input', function() {
            if (circuloActual) circuloActual.setAttribute('fill', this.value);
        });
        
        // Actualizar tema cuando cambie
        document.getElementById('themeButton').addEventListener('click', function() {
            setTimeout(actualizarTema, 100); // Pequeño retraso para permitir cambio de tema
        });
    }
    
// Reemplaza la función guardarDatos() con esta versión corregida:
function guardarDatos() {
    try {
        // Guardar en localStorage como respaldo
        localStorage.setItem('radioStations', JSON.stringify(datosEstaciones));
        
        // Actualizar tamaños en los círculos existentes si se cambió el radio
        const nuevoRadio = document.getElementById('r').value;
        document.querySelectorAll('.station-circle').forEach(circulo => {
            circulo.style.setProperty('--circle-radius', nuevoRadio);
        });
                    
        // Enviar datos al servidor para actualizar el archivo
        fetch('./data/update-stations.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(datosEstaciones)
        })
        .then(response => {
            // Añadir este debug para ver la respuesta real
            response.clone().text().then(text => {
                console.log('Respuesta del servidor:', text);
            });
            
            if (!response.ok) {
                return response.json().then(errorData => {
                    throw new Error(errorData.message || 'Error del servidor');
                }).catch(e => {
                    throw new Error('El servidor no respondió con un formato JSON válido');
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                console.log("Datos guardados en el servidor:", data.message);
                alert('Datos guardados correctamente en el archivo');
                
                // Reiniciar el reproductor si es necesario
                if (typeof resetPlayers === 'function') resetPlayers();
            } else {
                throw new Error(data.message || 'Error desconocido al guardar');
            }
        })
        .catch(error => {
            console.error('Error al guardar en el servidor:', error);
            alert('Error al guardar los datos en el archivo: ' + error.message);
        });
    } catch (error) {
        console.error('Error:', error);
        alert('Error al guardar los datos. Revise la consola para más detalles.');
    }
}
    
    // Actualizar apariencia según el tema
    function actualizarTema() {
        const isDarkMode = document.body.classList.contains('dark-theme');
        
        // Aplicar tema a DataTables
        if (tablaCiudades) {
            const tablaElement = document.getElementById('tablaCiudades');
            if (isDarkMode) {
                tablaElement.classList.add('table-dark');
                $('.dataTables_wrapper').addClass('text-light bg-dark');
            } else {
                tablaElement.classList.remove('table-dark');
                $('.dataTables_wrapper').removeClass('text-light bg-dark');
            }
        }
        
        // Aplicar tema a los modales
        const modales = document.querySelectorAll('.modal-content');
        modales.forEach(modal => {
            if (isDarkMode) {
                modal.classList.add('bg-dark', 'text-light');
                modal.querySelectorAll('input, select').forEach(input => {
                    input.classList.add('bg-secondary', 'text-light');
                    input.classList.remove('bg-light');
                });
            } else {
                modal.classList.remove('bg-dark', 'text-light');
                modal.querySelectorAll('input, select').forEach(input => {
                    input.classList.remove('bg-secondary', 'text-light');
                    input.classList.add('bg-light');
                });
            }
        });
    }

    // Añadir esta función al archivo crud.js
    // Dentro de la función resetPlayers()

    function resetPlayers() {
        // Esta función se llama después de guardar los cambios
        // Actualizar reproductor con los nuevos datos y reiniciar la visualización
        const nuevoRadio = parseInt(datosEstaciones.reproductor.r);
        
        // Actualizar el tamaño de todos los círculos
        document.querySelectorAll('.station-circle').forEach(circulo => {
            circulo.setAttribute('r', nuevoRadio);
            circulo.style.setProperty('--circle-radius', nuevoRadio);
            
            // Obtener coordenadas exactas del círculo
            const cx = parseInt(circulo.getAttribute('cx'));
            const cy = parseInt(circulo.getAttribute('cy'));
            
            // Buscar icono asociado y actualizar su posición con precisión
            document.querySelectorAll('.station-icon').forEach(icono => {
                // Verificar si este icono pertenece a este círculo
                const iconoX = parseInt(icono.getAttribute('x'));
                const iconoY = parseInt(icono.getAttribute('y'));
                const iconoWidth = parseInt(icono.getAttribute('width')) / 2;
                const iconoCx = iconoX + iconoWidth;
                const iconoCy = iconoY + iconoWidth;
                
                // Si el centro del icono está cerca del centro del círculo
                if (Math.abs(iconoCx - cx) < 15 && Math.abs(iconoCy - cy) < 15) {
                    // Actualizar tamaño y posición del icono con precisión exacta
                    icono.setAttribute('width', nuevoRadio * 2);
                    icono.setAttribute('height', nuevoRadio * 2);
                    icono.setAttribute('x', Math.round(cx - nuevoRadio));
                    icono.setAttribute('y', Math.round(cy - nuevoRadio));
                    
                    // Asegurar que el div interno esté configurado para centrar
                    const iconoDiv = icono.querySelector('div');
                    if (iconoDiv) {
                        iconoDiv.style.width = '100%';
                        iconoDiv.style.height = '100%';
                        iconoDiv.style.display = 'flex';
                        iconoDiv.style.alignItems = 'center';
                        iconoDiv.style.justifyContent = 'center';
                        iconoDiv.style.position = 'relative';
                    }
                    
                    // Asegurar que el icono hijo tenga el tamaño correcto
                    const iconoI = icono.querySelector('i');
                    if (iconoI) {
                        iconoI.style.setProperty('--circle-radius', nuevoRadio);
                        iconoI.style.position = 'absolute';
                        iconoI.style.top = '50%';
                        iconoI.style.left = '50%';
                        iconoI.style.transform = 'translate(-50%, -50%)';
                    }
                }
            });
        });
        
        // Actualizar listeners text
        document.querySelectorAll('.listeners-text').forEach(texto => {
            texto.style.setProperty('--circle-radius', nuevoRadio);
        });
    }

    document.addEventListener('resetPlayers', function() {
        resetPlayers();
    });
    
    // Iniciar el CRUD
    cargarDatos();
});

window.resetPlayers = function() {
    // Busca la instancia de resetPlayers dentro del documento y la ejecuta
    const event = new Event('resetPlayers');
    document.dispatchEvent(event);
};