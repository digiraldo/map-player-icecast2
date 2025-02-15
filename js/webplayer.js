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

            // Obtener el elemento SVG
            const map = document.getElementById('map');

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

                    // Crear el círculo del reproductor
                    const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
                    circle.setAttribute('cx', playerX);
                    circle.setAttribute('cy', playerY);
                    circle.setAttribute('r', playerR);
                    circle.setAttribute('fill', 'var(--player-offline)'); // Color inicial
                    circle.setAttribute('class', 'station-circle'); // Clase para estilos CSS adicionales
                    map.appendChild(circle);

                    // Crear el texto debajo del círculo
                    const text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
                    text.setAttribute('x', playerX);
                    text.setAttribute('y', parseFloat(playerY) + parseFloat(playerR) + 5); // Ajustar la posición Y
                    text.setAttribute('text-anchor', 'middle'); // Centrar el texto horizontalmente
                    text.setAttribute('class', 'station-name'); // Clase para estilos CSS adicionales
                    text.textContent = playerName;
                    map.appendChild(text);

                    // Crear el elemento de audio
                    const audio = new Audio(ciudadServerUrl);

                    // Agregar evento de clic al círculo para reproducir/pausar el audio
                    circle.addEventListener('click', () => {
                        if (audio.paused) {
                            audio.play();
                            circle.setAttribute('fill', 'var(--player-playing)');
                        } else {
                            audio.pause();
                            circle.setAttribute('fill', 'var(--player-online)'); // Cambiar a color "online" al pausar
                        }
                    });

                    // Escuchar eventos de audio para actualizar el color del círculo
                    audio.addEventListener('playing', () => {
                        circle.setAttribute('fill', 'var(--player-playing)');
                    });

                    audio.addEventListener('pause', () => {
                        circle.setAttribute('fill', 'var(--player-online)'); // Cambiar a color "online" al pausar
                    });

                    audio.addEventListener('ended', () => {
                        circle.setAttribute('fill', 'var(--player-offline)'); // Cambiar a color "offline" al finalizar
                    });

                    audio.addEventListener('error', () => {
                        circle.setAttribute('fill', 'var(--player-offline)'); // Cambiar a color "offline" si hay un error
                    });

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
                                    // Si la URL coincide, cambiar el color del círculo a "online"
                                    circle.setAttribute('fill', 'var(--player-online)');
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
                            circle.setAttribute('fill', 'var(--player-offline)'); // Asegurar que el círculo esté "offline" en caso de error
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