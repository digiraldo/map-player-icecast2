// filepath: /C:/laragon/www/map-player-icecast2/js/crud.js

$(document).ready(function() {
    let ciudades = [];
    let table;
    let previewWindow;
    let currentCityIndex = -1; // Índice de la ciudad actualmente editada

    function initializeDataTable() {
        table = $('#citiesTable').DataTable({
            "language": {
                "url": "//cdn.datatables.net/plug-ins/1.10.25/i18n/Spanish.json"
            },
            "columnDefs": [{
                "targets": -1,
                "orderable": false,
                "searchable": false
            }]
        });
    }

    function loadCiudades() {
        $.getJSON('data/stations.json', function(data) {
            ciudades = data.reproductor.ciudades;
            renderTable();
        });
    }

    function renderTable() {
        if (!table) {
            initializeDataTable();
        } else {
            table.clear();
        }

        ciudades.forEach((ciudad, index) => {
            table.row.add([
                ciudad.name,
                ciudad.frecuencia,
                ciudad.serverUrl,
                `<button class="btn btn-info view-btn" data-index="${index}"><i class="fa-solid fa-eye"></i></button>
                 <button class="btn btn-warning edit-btn" data-index="${index}"><i class="fa-solid fa-pen-to-square"></i></button>
                 <button class="btn btn-danger delete-btn" data-index="${index}"><i class="fa-solid fa-trash-can"></i></button>`
            ]);
        });
        table.draw();
    }

    $('#cityForm').on('submit', function(e) {
        e.preventDefault();
        const index = $('#cityIndex').val();
        const updatedCity = {
            name: $('#cityName').val(),
            frecuencia: $('#cityFrequency').val(),
            cx: $('#cityCx').val(),
            cy: $('#cityCy').val(),
            r: "7",
            fill: "#ff0000",
            stroke: "#000000",
            "stroke-width": "0",
            serverUrl: $('#cityServerUrl').val()
        };

        if (index) {
            ciudades[index] = updatedCity;
        } else {
            ciudades.push(updatedCity);
        }

        // Cerrar la ventana de vista previa si está abierta
        if (previewWindow && !previewWindow.closed) {
            previewWindow.close();
        }

        renderTable();
        $('#addCityModal').modal('hide');
        $('#crudModal').modal('show');
        this.reset();
        updateMap();
        saveCiudades(); // Guardar los cambios en el archivo stations.json
    });

    $(document).on('click', '.edit-btn', function() {
        const index = $(this).data('index');
        currentCityIndex = index; // Guarda el índice de la ciudad actual
        const ciudad = ciudades[index];
        $('#cityName').val(ciudad.name);
        $('#cityFrequency').val(ciudad.frecuencia);
        $('#cityServerUrl').val(ciudad.serverUrl);
        $('#cityCx').val(ciudad.cx);
        $('#cityCy').val(ciudad.cy);
        $('#cityIndex').val(index);
        $('#addCityModal').modal('show');
        $('#crudModal').modal('hide');

        // Actualizar la vista previa con las coordenadas iniciales
        updatePreview(ciudad.cx, ciudad.cy);

        // Agregar eventos input para actualizar la vista previa en tiempo real
        $('#cityCx, #cityCy').on('input', function() {
            const cx = $('#cityCx').val();
            const cy = $('#cityCy').val();
            updatePreview(cx, cy);
        });
    });

    $(document).on('click', '.delete-btn', function() {
        const index = $(this).data('index');
        ciudades.splice(index, 1);
        renderTable();
        updateMap();
    });

    $(document).on('click', '.view-btn', function() {
        const index = $(this).data('index');
        const ciudad = ciudades[index];

        // Crear un modal para mostrar la información y el mapa
        const viewModal = $(`
            <div class="modal fade" id="viewCityModal" tabindex="-1" aria-labelledby="viewCityModalLabel" aria-hidden="true">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title" id="viewCityModalLabel">Información de ${ciudad.name}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <p><strong>Nombre:</strong> ${ciudad.name}</p>
                            <p><strong>Frecuencia:</strong> ${ciudad.frecuencia}</p>
                            <p><strong>URL del servidor:</strong> ${ciudad.serverUrl}</p>
                            <p><strong>Coordenada X:</strong> ${ciudad.cx}</p>
                            <p><strong>Coordenada Y:</strong> ${ciudad.cy}</p>
                            <svg id="viewMap" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 553.76801" preserveAspectRatio="xMidYMid meet" width="100%">
                                <image href="img/colombia-mapa.svg" width="100%" height="100%" />
                                <circle cx="${ciudad.cx}" cy="${ciudad.cy}" r="7" fill="#ff0000" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
        `);

        // Mostrar el modal
        viewModal.modal('show');

        // Eliminar el modal del DOM cuando se cierre
        viewModal.on('hidden.bs.modal', function (e) {
            $(this).remove();
        });
    });

    $('#crudModal').on('shown.bs.modal', function() {
        loadCiudades();
    });

    $('#addCityModal').on('hidden.bs.modal', function() {
        $('#crudModal').modal('show');
    });

    function openPreviewWindow(ciudad) {
        if (previewWindow && !previewWindow.closed) {
            previewWindow.close();
        }

        previewWindow = window.open('', 'Preview', 'width=400,height=553');
        previewWindow.document.body.innerHTML = `
            <svg id="previewMap" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 553.76801" preserveAspectRatio="xMidYMid meet">
                <image href="img/colombia-mapa.svg" width="100%" height="100%" />
                <circle id="previewCircle" cx="${ciudad.cx}" cy="${ciudad.cy}" r="7" fill="#ff0000" />
            </svg>
        `;
    }

    function updatePreview(cx, cy) {
        const circle = document.getElementById('previewCircle');
        circle.setAttribute('cx', cx);
        circle.setAttribute('cy', cy);
    }

    function updateMap() {
        const map = $('#map');

        ciudades.forEach((ciudad, index) => {
            const stationName = ciudad.name;
            let circle = map.find(`circle[data-station-name="${stationName}"]`);

            if (circle.length === 0) {
                // Si el círculo no existe, crear uno nuevo
                circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
                circle.setAttribute('class', 'station-circle');
                circle.setAttribute('data-station-name', stationName); // Agregar el atributo data-station-name
                map.append(circle);
            } else {
                circle = circle[0]; // Obtener el elemento DOM del objeto jQuery
            }

            // Actualizar los atributos del círculo
            circle.setAttribute('cx', ciudad.cx);
            circle.setAttribute('cy', ciudad.cy);
            circle.setAttribute('r', ciudad.r);
            circle.setAttribute('fill', ciudad.fill);
            circle.setAttribute('data-station-frecuencia', ciudad.frecuencia);
            circle.setAttribute('data-audio-url', ciudad.serverUrl);
        });

        // Eliminar los círculos que no están en el array ciudades
        map.find('circle.station-circle').each((index, circle) => {
            const stationName = circle.getAttribute('data-station-name');
            const cityIndex = ciudades.findIndex(ciudad => ciudad.name === stationName);

            if (cityIndex === -1) {
                $(circle).remove();
            }
        });
    }

    function saveCiudades() {
        $.ajax({
            url: 'http://localhost:3000/update_stations', // Cambiar la URL al script del lado del servidor
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ "reproductor": { "ciudades": ciudades } }), // Enviar los datos como una cadena JSON
            success: function(response) {
                console.log('Archivo stations.json actualizado correctamente');
                // Mostrar un mensaje de éxito al usuario
                alert('Cambios guardados correctamente');

                // Actualizar el localStorage
                updateLocalStorage();
            },
            error: function(xhr, status, error) {
                console.error('Error al actualizar el archivo stations.json:', error);
                // Mostrar un mensaje de error al usuario
                alert('Error al guardar los cambios: ' + error);
                // Imprimir información detallada sobre el error
                console.log('Código de estado:', xhr.status);
                console.log('Respuesta del servidor:', xhr.responseText);
            }
        });
    }

    function updateLocalStorage() {
        console.log('updateLocalStorage() ejecutado'); // Agregar este console.log()

        // Obtener la información del reproductor desde localStorage
        let reproductorData = localStorage.getItem('reproductor');
        let reproductor = {};

        // Si no hay información en localStorage, usar un objeto vacío
        if (reproductorData) {
            reproductor = JSON.parse(reproductorData);
        }

        // Verificar si el objeto reproductor tiene la propiedad ciudades
        if (!reproductor.ciudades) {
            reproductor.ciudades = [];
        }

        // Actualizar la información de las ciudades en el objeto reproductor
        reproductor.ciudades = ciudades;

        console.log('Datos a guardar en localStorage:', reproductor); // Agregar este console.log()

        // Guardar la información actualizada en localStorage
        localStorage.setItem('reproductor', JSON.stringify(reproductor));
    }

    loadCiudades();
});