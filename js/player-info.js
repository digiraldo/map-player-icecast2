document.addEventListener('DOMContentLoaded', () => {
    // Cachear elementos del DOM
    const stationNameRadioInput = document.getElementById('stationNameRadio');
    const stationHostUrlInput = document.getElementById('stationHostUrl');
    const stationStatusUrlInput = document.getElementById('stationStatusUrl');
    const stationTotalStationsInput = document.getElementById('stationTotalStations');
    const stationRInput = document.getElementById('stationR');
    const stationUrlLogoInput = document.getElementById('stationUrlLogo');
    const playerInfoForm = document.getElementById('stationForm');

    // Función para cargar la información del reproductor desde localStorage
    function loadPlayerInfo() {
        // Obtener la información del reproductor desde localStorage
        let reproductorData = localStorage.getItem('reproductor');

        // Si no hay información en localStorage, cargar la información desde el archivo stations.json
        if (!reproductorData) {
            fetch('data/stations.json')
                .then(response => response.json())
                .then(data => {
                    const reproductor = data.reproductor;

                    // Llenar el formulario con la información actual
                    stationNameRadioInput.value = reproductor.estacion;
                    stationHostUrlInput.value = reproductor.hostUrl;
                    stationStatusUrlInput.value = reproductor.statusUrl;
                    stationTotalStationsInput.value = reproductor.total_estaciones;
                    stationRInput.value = reproductor.r;
                    stationUrlLogoInput.value = reproductor.url_logo;

                    // Guardar la información en localStorage
                    localStorage.setItem('reproductor', JSON.stringify(reproductor));
                })
                .catch(error => console.error('Error al cargar el archivo JSON:', error));
        } else {
            // Parsear la información del reproductor desde JSON
            const reproductor = JSON.parse(reproductorData);

            // Llenar el formulario con la información actual
            stationNameRadioInput.value = reproductor.estacion;
            stationHostUrlInput.value = reproductor.hostUrl;
            stationStatusUrlInput.value = reproductor.statusUrl;
            stationTotalStationsInput.value = reproductor.total_estaciones;
            stationRInput.value = reproductor.r;
            stationUrlLogoInput.value = reproductor.url_logo;
        }
    }

    // Cargar la información del reproductor al cargar la página
    loadPlayerInfo();

    // Cargar la información en el modal de edición al inicio
    const editStationModal = document.getElementById('editStationModal');
    editStationModal.addEventListener('show.bs.modal', function () {
        // Cachear elementos del DOM del modal
        const editStationNameRadioInput = document.getElementById('stationNameRadio');
        const editStationHostUrlInput = document.getElementById('stationHostUrl');
        const editStationStatusUrlInput = document.getElementById('stationStatusUrl');
        const editStationTotalStationsInput = document.getElementById('stationTotalStations');
        const editStationRInput = document.getElementById('stationR');
        const editStationUrlLogoInput = document.getElementById('stationUrlLogo');

        // Obtener la información del reproductor desde localStorage
        const reproductorData = localStorage.getItem('reproductor');

        // Si hay información en localStorage, cargarla en el formulario
        if (reproductorData) {
            const reproductor = JSON.parse(reproductorData);

            editStationNameRadioInput.value = reproductor.estacion;
            editStationHostUrlInput.value = reproductor.hostUrl;
            editStationStatusUrlInput.value = reproductor.statusUrl;
            editStationTotalStationsInput.value = reproductor.total_estaciones;
            editStationRInput.value = reproductor.r;
            editStationUrlLogoInput.value = reproductor.url_logo;
        }
    });

    // Agregar evento de submit al formulario
    playerInfoForm.addEventListener('submit', (event) => {
        event.preventDefault();

        // Obtener los valores del formulario
        const newstationNameRadio = stationNameRadioInput.value;
        const newStationHostUrl = stationHostUrlInput.value;
        const newStationStatusUrl = stationStatusUrlInput.value;
        const newStationTotalStations = stationTotalStationsInput.value;
        const newStationR = stationRInput.value;
        const newStationUrlLogo = stationUrlLogoInput.value;

        // Validar el rango del tamaño de los círculos
        if (newStationR < 4 || newStationR > 10) {
            alert('El tamaño de los círculos debe estar entre 4 y 10.');
            return;
        }

        // Obtener la información existente del localStorage
        const existingReproductorData = localStorage.getItem('reproductor');
        let existingReproductor = {};

        if (existingReproductorData) {
            existingReproductor = JSON.parse(existingReproductorData);
        }

        // Crear un objeto con los datos actualizados, fusionando los valores existentes
        const updatedReproductor = {
            ...existingReproductor, // Mantener los valores existentes
            estacion: newstationNameRadio,
            hostUrl: newStationHostUrl,
            statusUrl: newStationStatusUrl,
            total_estaciones: newStationTotalStations,
            r: newStationR,
            url_logo: newStationUrlLogo
        };

        // Guardar la información actualizada del reproductor en localStorage
        localStorage.setItem('reproductor', JSON.stringify(updatedReproductor));

        // Enviar los datos actualizados al servidor
        fetch('/update_stations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reproductor: updatedReproductor })
        })
            .then(response => response.text())
            .then(message => {
                console.log(message); // Mostrar mensaje de éxito
            })
            .catch(error => console.error('Error al actualizar el archivo stations.json:', error));

        // Cerrar el modal
        const editStationModal = document.getElementById('editStationModal');
        const modal = bootstrap.Modal.getInstance(editStationModal);
        modal.hide();

        // Recargar la página para que los cambios se reflejen
        location.reload();
    });
});