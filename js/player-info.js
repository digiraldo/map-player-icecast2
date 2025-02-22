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
        const reproductorData = localStorage.getItem('reproductor');
        console.log('Reproductor data from localStorage:', reproductorData);

        // Si no hay información en localStorage, cargar la información desde el archivo stations.json
        if (!reproductorData) {
            fetch('data/stations.json')
                .then(response => response.json())
                .then(data => {
                    const reproductor = data.reproductor;
                    console.log('Reproductor data from stations.json:', reproductor);

                    // Llenar el formulario con la información actual
                    stationNameRadioInput.value = reproductor.estacion;
                    stationHostUrlInput.value = reproductor.hostUrl;
                    stationStatusUrlInput.value = reproductor.statusUrl;
                    stationTotalStationsInput.value = reproductor.total_estaciones;
                    stationRInput.value = reproductor.r;
                    stationUrlLogoInput.value = reproductor.url_logo;

                    console.log('Formulario llenado con datos de stations.json:', {
                        estacion: reproductor.estacion,
                        hostUrl: reproductor.hostUrl,
                        statusUrl: reproductor.statusUrl,
                        total_estaciones: reproductor.total_estaciones,
                        r: reproductor.r,
                        url_logo: reproductor.url_logo
                    });

                    // Guardar la información en localStorage
                    localStorage.setItem('reproductor', JSON.stringify(reproductor));
                })
                .catch(error => console.error('Error al cargar el archivo JSON:', error));
        } else {
            // Parsear la información del reproductor desde JSON
            const reproductor = JSON.parse(reproductorData);
            console.log('Parsed reproductor data from localStorage:', reproductor);

            // Llenar el formulario con la información actual
            stationNameRadioInput.value = reproductor.estacion;
            stationHostUrlInput.value = reproductor.hostUrl;
            stationStatusUrlInput.value = reproductor.statusUrl;
            stationTotalStationsInput.value = reproductor.total_estaciones;
            stationRInput.value = reproductor.r;
            stationUrlLogoInput.value = reproductor.url_logo;

            console.log('Formulario llenado con datos de localStorage:', {
                estacion: reproductor.estacion,
                hostUrl: reproductor.hostUrl,
                statusUrl: reproductor.statusUrl,
                total_estaciones: reproductor.total_estaciones,
                r: reproductor.r,
                url_logo: reproductor.url_logo
            });
        }
    }

    // Cargar la información del reproductor al cargar la página
    loadPlayerInfo();

    // Cargar la información en el modal de edición al inicio
    const editStationModal = document.getElementById('editStationModal');
    editStationModal.addEventListener('show.bs.modal', function () {
        // Obtener la información del reproductor desde localStorage
        const reproductorData = localStorage.getItem('reproductor');
        console.log('Reproductor data from localStorage on modal show:', reproductorData);

        // Si hay información en localStorage, cargarla en el formulario
        if (reproductorData) {
            const reproductor = JSON.parse(reproductorData);
            console.log('Parsed reproductor data from localStorage on modal show:', reproductor);

            document.getElementById('stationNameRadio').value = reproductor.estacion;
            document.getElementById('stationHostUrl').value = reproductor.hostUrl;
            document.getElementById('stationStatusUrl').value = reproductor.statusUrl;
            document.getElementById('stationTotalStations').value = reproductor.total_estaciones;
            document.getElementById('stationR').value = reproductor.r;
            document.getElementById('stationUrlLogo').value = reproductor.url_logo;

            console.log('Formulario llenado en modal show:', {
                estacion: reproductor.estacion,
                hostUrl: reproductor.hostUrl,
                statusUrl: reproductor.statusUrl,
                total_estaciones: reproductor.total_estaciones,
                r: reproductor.r,
                url_logo: reproductor.url_logo
            });
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

        console.log('Form values on submit:', {
            newstationNameRadio,
            newStationHostUrl,
            newStationStatusUrl,
            newStationTotalStations,
            newStationR,
            newStationUrlLogo
        });

        // Validar el rango del tamaño de los círculos
        if (newStationR < 4 || newStationR > 10) {
            alert('El tamaño de los círculos debe estar entre 4 y 10.');
            return;
        }

        // Crear un objeto con los datos actualizados
        const updatedReproductor = {
            estacion: newstationNameRadio,
            hostUrl: newStationHostUrl,
            statusUrl: newStationStatusUrl,
            total_estaciones: newStationTotalStations,
            r: newStationR,
            url_logo: newStationUrlLogo
        };

        console.log('Updated reproductor data:', updatedReproductor);

        // Guardar la información actualizada en localStorage
        localStorage.setItem('reproductor', JSON.stringify(updatedReproductor));

        // Cerrar el modal
        const editStationModal = document.getElementById('editStationModal');
        const modal = bootstrap.Modal.getInstance(editStationModal);
        modal.hide();

        // Recargar la página para que los cambios se reflejen
        location.reload();
    });
});