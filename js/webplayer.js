document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos del archivo JSON
    fetch('data/stations.json')
        .then(response => response.json())
        .then(data => {
            const reproductor = data.reproductor;
            

            // Unir hostUrl con statusUrl
            const statusUrlCompleta = reproductor.hostUrl + "/" + reproductor.statusUrl;
            /* console.log("URL completa del estado:", statusUrlCompleta); */

            // Arrays para almacenar los resultados
            const iguales = [];

            // Analizar y comparar serverUrl
            reproductor.ciudades.forEach(ciudad => {
                if (ciudad.serverUrl) {
                    const ciudadSrv = ciudad.serverUrl;
                    const ciudadServerUrl = reproductor.hostUrl + "/" + ciudadSrv;
                    const playerR = ciudad.r;
                    const playerX = ciudad.cx;
                    const playerY = ciudad.cy;
                    const playerName = ciudad.name;
                    /* console.log(playerX, playerY, playerR); */
                    /* console.log("URL de la ciudad:", ciudadServerUrl); */

                    // Obtener datos de la URL de estado y mostrarlos
                    fetch(statusUrlCompleta)
                        .then(response => response.json())
                        .then(data => {
                            // Verificar si 'data.icestats.source' es un array o un objeto
                            let sources = data.icestats.source;
                            if (!Array.isArray(sources)) {
                                sources = [sources]; // Convertir a array si es un objeto único
                            }

                            sources.forEach(source => {
                                const sonIguales = ciudadSrv === source.server_url;
                                if (sonIguales) {
                                    iguales.push({
                                        ciudad: ciudad.name,
                                        ciudadServerUrl: ciudadServerUrl,
                                        ciudadSrv: ciudadSrv,
                                        statusUrlServerUrl: source.server_url
                                    });
                                }
                            });

                            // Mostrar los resultados en la consola
                            /* console.log("URLs Iguales:"); */
                            iguales.forEach(item => {
                                /* console.log(`    Ciudad: ${item.ciudad}, JSON: ${item.ciudadSrv}, XSL: ${item.statusUrlServerUrl}`); */
                            });
                        })
                        .catch(error => {
                            console.error("Error al obtener los datos de estado:", error);
                        });
                }
            });

            // Actualizar la tarjeta con la información
            const infoCard = document.getElementById('infoCard');
            const stationLogo = document.getElementById('stationLogo');
            const stationName = document.getElementById('stationName');
            const developerLink = document.getElementById('developerLink');

            stationLogo.src = reproductor.url_logo;
            stationName.textContent = reproductor.estacion;
            developerLink.href = `https://github.com/${reproductor.desarrollador}`;

            // Función para determinar la ubicación de la tarjeta
            function setInfoCardPosition() {
                const screenWidth = window.innerWidth;
                const screenHeight = window.innerHeight;
                const cardWidth = infoCard.offsetWidth;
                const cardHeight = infoCard.offsetHeight;

                // Márgenes predeterminados
                const margin = 20;

                let left, top;

                // Ubicación en la esquina superior izquierda para pantallas grandes
                if (screenWidth > 860) {
                    left = margin;
                    top = margin;
                    infoCard.classList.remove('small-card'); // Remover la clase para pantallas pequeñas
                }
                // Ubicación en la parte superior derecha para pantallas pequeñas
                else {
                    left = screenWidth - cardWidth - margin;
                    top = margin;
                    infoCard.classList.add('small-card'); // Agregar la clase para pantallas pequeñas
                }

                // Aplicar estilos de ubicación
                infoCard.style.left = `${left}px`;
                infoCard.style.top = `${top}px`;
            }

            // Establecer la posición inicial
            setInfoCardPosition();

            // Actualizar la posición al cambiar el tamaño de la ventana
            window.addEventListener('resize', setInfoCardPosition);
        })
        .catch(error => console.error('Error al cargar el archivo JSON:', error));
});