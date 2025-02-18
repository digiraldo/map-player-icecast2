document.addEventListener('DOMContentLoaded', () => {
    // Cachear elementos del DOM
    const stationNameModal = document.getElementById('stationNameModal');
    const stationGenreModal = document.getElementById('stationGenreModal');
    const stationNameInput = document.getElementById('stationNameInput');
    const stationGenreInput = document.getElementById('stationGenreInput');
    const stationUrlLogoInput = document.getElementById('stationUrlLogoInput');
    const stationHostUrlInput = document.getElementById('stationHostUrlInput');
    const stationStatusUrlInput = document.getElementById('stationStatusUrlInput');
    const stationTotalStationsInput = document.getElementById('stationTotalStationsInput');
    const stationRInput = document.getElementById('stationRInput');
    const playerInfoForm = document.getElementById('playerInfoForm');

    // Función para cargar la información del reproductor desde localStorage
    function loadPlayerInfo() {
        // Obtener la información del reproductor desde localStorage
        const reproductorData = localStorage.getItem('reproductor');

        // Si no hay información en localStorage, cargar la información desde el archivo stations.json
        if (!reproductorData) {
            fetch('data/stations.json')
                .then(response => response.json())
                .then(data => {
                    const reproductor = data.reproductor;

                    // Mostrar la información en el modal-header
                    stationNameModal.textContent = `Estación: ${reproductor.estacion}`;
                    stationGenreModal.textContent = `Género: ${reproductor.genero}`;

                    // Llenar el formulario con la información actual
                    stationNameInput.value = reproductor.estacion;
                    stationGenreInput.value = reproductor.genero;
                    stationUrlLogoInput.value = reproductor.url_logo;
                    stationHostUrlInput.value = reproductor.hostUrl;
                    stationStatusUrlInput.value = reproductor.statusUrl;
                    stationTotalStationsInput.value = reproductor.total_estaciones;
                    stationRInput.value = reproductor.r;

                    // Guardar la información en localStorage
                    localStorage.setItem('reproductor', JSON.stringify(reproductor));
                })
                .catch(error => console.error('Error al cargar el archivo JSON:', error));
        } else {
            // Parsear la información del reproductor desde JSON
            const reproductor = JSON.parse(reproductorData);

            // Mostrar la información en el modal-header
            stationNameModal.textContent = `Estación: ${reproductor.estacion}`;
            stationGenreModal.textContent = `Género: ${reproductor.genero}`;

            // Llenar el formulario con la información actual
            stationNameInput.value = reproductor.estacion;
            stationGenreInput.value = reproductor.genero;
            stationUrlLogoInput.value = reproductor.url_logo;
            stationHostUrlInput.value = reproductor.hostUrl;
            stationStatusUrlInput.value = reproductor.statusUrl;
            stationTotalStationsInput.value = reproductor.total_estaciones;
            stationRInput.value = reproductor.r;
        }
    }

    // Cargar la información del reproductor al cargar la página
    loadPlayerInfo();

    // Agregar evento de submit al formulario
    playerInfoForm.addEventListener('submit', (event) => {
        event.preventDefault();

        // Obtener los valores del formulario
        const newStationName = stationNameInput.value;
        const newStationGenre = stationGenreInput.value;
        const newStationUrlLogo = stationUrlLogoInput.value;
        const newStationHostUrl = stationHostUrlInput.value;
        const newStationStatusUrl = stationStatusUrlInput.value;
        const newStationTotalStations = stationTotalStationsInput.value;
        const newStationR = stationRInput.value;

        // Validar el rango del tamaño de los círculos
        if (newStationR < 4 || newStationR > 10) {
            alert('El tamaño de los círculos debe estar entre 4 y 10.');
            return;
        }

        // Crear un objeto con los datos actualizados
        const updatedReproductor = {
            estacion: newStationName,
            genero: newStationGenre,
            url_logo: newStationUrlLogo,
            hostUrl: newStationHostUrl,
            statusUrl: newStationStatusUrl,
            total_estaciones: newStationTotalStations,
            r: newStationR
        };

        // Guardar la información actualizada en localStorage
        localStorage.setItem('reproductor', JSON.stringify(updatedReproductor));

        // Mostrar la información actualizada en el modal-header
        stationNameModal.textContent = `Estación: ${newStationName} Género: ${newStationGenre}`;
        // stationGenreModal.textContent = `Género: ${newStationGenre}`;

        // Cerrar el modal
        $('#editPlayerInfoModal').modal('hide');
    });
});