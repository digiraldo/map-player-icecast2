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

            // Guardar totalEstaciones en una variable
            let totalEstaciones = reproductor.total_estaciones;

            // Elemento para mostrar la información de la emisora en la tarjeta
            const stationInfoElement = document.createElement('p');
            stationInfoElement.classList.add('station-info');

            // Variable para almacenar el audio actual
            let currentAudio = null;
            let currentCircle = null; // Variable para almacenar el círculo actual

            // Analizar y comparar serverUrl
            reproductor.ciudades.forEach(ciudad => {
                if (ciudad.serverUrl) {
                    const ciudadSrv = ciudad.serverUrl;
                    const ciudadServerUrl = reproductor.hostUrl + "/" + ciudadSrv;
                    const playerR = ciudad.r;
                    const playerX = ciudad.cx;
                    const playerY = ciudad.cy;
                    const playerName = ciudad.name;
                    const playerFrecuencia = ciudad.frecuencia;
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

                    // Crear el tooltip
                    const tooltip = document.createElement('div');
                    tooltip.classList.add('tooltip');
                    tooltip.innerHTML = `
                        ${playerName}
                        ${playerFrecuencia}
                    `;
                    document.body.appendChild(tooltip);

                    // Agregar eventos de mouse para mostrar/ocultar el tooltip
                    circle.addEventListener('mousemove', (event) => {
                        tooltip.style.left = (event.pageX + 10) + 'px';
                        tooltip.style.top = (event.pageY + 10) + 'px';
                    });

                    circle.addEventListener('mouseover', () => {
                        tooltip.classList.add('show');
                    });

                    circle.addEventListener('mouseout', () => {
                        tooltip.classList.remove('show');
                    });

                    // Crear el icono de Font Awesome dentro del círculo
                    const icon = document.createElementNS("http://www.w3.org/2000/svg", 'foreignObject');
                    icon.setAttribute('x', playerX - playerR / 2); // Centrar horizontalmente
                    icon.setAttribute('y', playerY - playerR / 2); // Centrar verticalmente
                    icon.setAttribute('width', playerR);
                    icon.setAttribute('height', playerR);
                    icon.setAttribute('class', 'station-icon');
                    icon.style.pointerEvents = 'none'; // Para que los clics se registren en el círculo

                    const iconInner = document.createElement('i');
                    iconInner.setAttribute('class', 'fas'); // Clase base de Font Awesome
                    iconInner.style.fontSize = playerR + 'px'; // Ajustar tamaño del icono
                    iconInner.style.textAlign = 'center'; // Centrar el icono
                    iconInner.style.lineHeight = playerR + 'px'; // Centrar verticalmente
                    icon.appendChild(iconInner);
                    map.appendChild(icon);

                    // Ocultar el icono inicialmente
                    iconInner.style.display = 'none';

                    // Crear el texto para mostrar los listeners
                    const listenersText = document.createElementNS("http://www.w3.org/2000/svg", 'text');
                    listenersText.setAttribute('x', playerX);
                    listenersText.setAttribute('y', playerY + 5); // Ajustar la posición Y para centrar verticalmente
                    listenersText.setAttribute('text-anchor', 'middle'); // Centrar el texto horizontalmente
                    listenersText.setAttribute('class', 'listeners-text'); // Clase para estilos CSS adicionales
                    listenersText.textContent = '0'; // Valor inicial
                    map.appendChild(listenersText);

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

                    // Función para mostrar el toast
                    function showToast(message) {
                        const toast = document.createElement('div');
                        toast.classList.add('toast');
                        toast.textContent = message;
                        document.body.appendChild(toast);

                        // Estilos para el toast
                        toast.style.backgroundColor = 'var(--toast-bg)';
                        toast.style.color = 'var(--toast-text)';
                        toast.style.textAlign = 'center'; // Centrar el texto

                        // Mostrar el toast
                        setTimeout(() => {
                            toast.classList.add('show');
                            // Ocultar el toast después de 3 segundos
                            setTimeout(() => {
                                toast.classList.remove('show');
                                // Eliminar el toast del DOM después de la transición
                                setTimeout(() => {
                                    document.body.removeChild(toast);
                                }, 300);
                            }, 3000);
                        }, 100);
                    }

                    // Agregar evento de clic al círculo para reproducir/pausar el audio
                    circle.addEventListener('click', () => {
                        // Si el círculo está en rojo, mostrar el toast y no hacer nada
                        if (circle.getAttribute('fill') === 'var(--player-offline)') {
                            showToast(`${playerName} - ${playerFrecuencia} No Disponible`);
                            return;
                        }

                        // Si hay un audio reproduciéndose, detenerlo
                        if (currentAudio && !currentAudio.paused) {
                            currentAudio.pause();
                            // Restablecer el color del círculo del audio anterior
                            if (currentCircle) {
                                currentCircle.setAttribute('fill', 'var(--player-online)');
                            }
                        }

                        if (audio.paused) {
                            audio.play();
                            iconInner.classList.remove('fa-play');
                            iconInner.classList.add('fa-pause');
                            circle.setAttribute('fill', 'var(--player-playing)');
                            stationInfoElement.innerHTML = `<i class="fa-solid fa-music"></i> ${playerName} - ${playerFrecuencia}`;
                            currentAudio = audio; // Actualizar el audio actual
                            currentCircle = circle; // Actualizar el círculo actual
                        } else {
                            audio.pause();
                            iconInner.classList.remove('fa-pause');
                            iconInner.classList.add('fa-play');
                            circle.setAttribute('fill', 'var(--player-online)'); // Cambiar a color "online" al pausar
                            stationInfoElement.textContent = "Reproducir Emisora";
                            currentAudio = null; // No hay audio actual
                            currentCircle = null; // No hay círculo actual
                        }
                    });

                    // Escuchar eventos de audio para actualizar el color del círculo
                    audio.addEventListener('playing', () => {
                        iconInner.classList.remove('fa-play');
                        iconInner.classList.add('fa-pause');
                        circle.setAttribute('fill', 'var(--player-playing)');
                        stationInfoElement.innerHTML = `<i class="fa-solid fa-music"></i> ${playerName} - ${playerFrecuencia}`;
                    });

                    audio.addEventListener('pause', () => {
                        iconInner.classList.remove('fa-play');
                        iconInner.classList.add('fa-play');
                        circle.setAttribute('fill', 'var(--player-online)'); // Cambiar a color "online" al pausar
                        stationInfoElement.textContent = "Reproducir Emisora";
                    });

                    audio.addEventListener('ended', () => {
                        iconInner.classList.remove('fa-pause');
                        iconInner.classList.add('fa-play');
                        circle.setAttribute('fill', 'var(--player-offline)'); // Cambiar a color "offline" al finalizar
                        stationInfoElement.textContent = "Reproducir Emisora";
                    });

                    audio.addEventListener('error', () => {
                        iconInner.classList.remove('fa-pause');
                        iconInner.classList.add('fa-play');
                        circle.setAttribute('fill', 'var(--player-offline)'); // Cambiar a color "offline" si hay un error
                        stationInfoElement.textContent = "Reproducir Emisora";
                    });

                    // Eventos de mouse para mostrar/ocultar el icono
                    circle.addEventListener('mouseover', () => {
                        if (circle.getAttribute('fill') === 'var(--player-online)') {
                            iconInner.classList.remove('fa-pause');
                            iconInner.classList.add('fa-play');
                        } else if (circle.getAttribute('fill') === 'var(--player-playing)') {
                            iconInner.classList.remove('fa-play');
                            iconInner.classList.add('fa-pause');
                        }
                        iconInner.style.display = 'block';
                    });

                    circle.addEventListener('mouseout', () => {
                        iconInner.style.display = 'none';
                    });

                    // Obtener datos de la URL de estado y mostrarlos
                    function updateListeners() {
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
                                        iconInner.classList.remove('fa-pause');
                                        iconInner.classList.add('fa-play');
                                        listenersText.textContent = source.listeners;
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

                    // Actualizar los listeners cada 20 segundos
                    setInterval(updateListeners, 20000);

                    // Llamar a la función para actualizar los listeners al cargar la página
                    updateListeners();

                    // Guardar la URL del audio en el círculo para fácil acceso
                    circle.setAttribute('data-audio-src', ciudadServerUrl);
                }
            });

            // Actualizar la tarjeta con la información
            const infoCard = document.getElementById('infoCard');
            const stationLogo = document.getElementById('stationLogo');
            const stationName = document.getElementById('stationName');
            const developerLink = document.createElement('a'); // Elemento para el enlace del desarrollador
            const totalListenersElement = document.createElement('p'); // Elemento para mostrar el total de listeners
            const totalSourcesElement = document.createElement('p'); // Elemento para mostrar el total de sources

            stationLogo.src = reproductor.url_logo;
            stationName.textContent = reproductor.estacion;

            //Estilos del link del desarrollador
            developerLink.href = `https://github.com/${reproductor.desarrollador}`;
            developerLink.classList.add('btn', 'btn-link'); // Agrega clases de Bootstrap
            developerLink.innerHTML = '<i class="fab fa-github"></i> Desarrollador'; // Agrega el icono de GitHub y el texto

            let totalListeners = 0;
            let totalSources = 0;

            // Función para actualizar el total de listeners y sources
            function updateTotalInfo() {
                fetch(statusUrlCompleta)
                    .then(response => response.json())
                    .then(data => {
                        // Verificar si 'data.icestats.source' es un array o un objeto
                        let sources = data.icestats.source;
                        if (!Array.isArray(sources)) {
                            sources = [sources]; // Convertir a array si es un objeto único
                        }

                        totalSources = sources.length;
                        totalListeners = 0;

                        sources.forEach(source => {
                            totalListeners += parseInt(source.listeners);
                        });

                        totalListenersElement.innerHTML = `<i class="fas fa-headphones"></i> Oyentes: ${totalListeners}`;
                        totalSourcesElement.innerHTML = `<i class="fas fa-broadcast-tower"></i> ${totalSources} Emisoras de ${totalEstaciones}`;
                    })
                    .catch(error => {
                        console.error("Error al obtener los datos de estado:", error);
                    });
            }

            // Actualizar la información cada 20 segundos
            setInterval(updateTotalInfo, 20000);

            // Llamar a la función para actualizar la información al cargar la página
            updateTotalInfo();

            // Limpiar el contenido anterior de infoCard
            infoCard.querySelector('.card-body').innerHTML = '';

            // Agregar los elementos a la tarjeta
            infoCard.querySelector('.card-body').appendChild(stationName);
            infoCard.querySelector('.card-body').appendChild(stationInfoElement); // Agrega el elemento de información de la estación
            infoCard.querySelector('.card-body').appendChild(totalListenersElement);
            infoCard.querySelector('.card-body').appendChild(totalSourcesElement);
            infoCard.querySelector('.card-body').appendChild(developerLink);

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