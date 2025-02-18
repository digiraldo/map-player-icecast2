document.addEventListener('DOMContentLoaded', () => {
    fetch('data/stations.json')
        .then(response => response.json())
        .then(data => {
            const reproductor = data.reproductor;

            // Unir hostUrl con statusUrl
            const statusUrlCompleta = reproductor.hostUrl + "/" + reproductor.statusUrl;
            const hostSRV = reproductor.hostUrl;

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

            // Crear un mapa para almacenar los círculos por URL
            const circles = new Map();

            // Declarar ciudadSrv en un ámbito superior
            let ciudadSrv;

            // Analizar y comparar serverUrl
            reproductor.ciudades.forEach(ciudad => {
                if (ciudad.serverUrl) {
                    ciudadSrv = ciudad.serverUrl;
                    const ciudadServerUrl = reproductor.hostUrl + "/" + ciudadSrv;
                    const playerR = reproductor.r;
                    const playerX = ciudad.cx;
                    const playerY = ciudad.cy;
                    const playerName = ciudad.name;
                    const playerFrecuencia = ciudad.frecuencia;

                    // Crear el círculo del reproductor
                    const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
                    circle.setAttribute('cx', playerX);
                    circle.setAttribute('cy', playerY);
                    circle.setAttribute('r', playerR);
                    circle.setAttribute('fill', 'var(--player-offline)'); // Color inicial
                    circle.setAttribute('class', 'station-circle'); // Clase para estilos CSS adicionales
                    circle.setAttribute('data-station-name', playerName); // Agregar atributo para identificar la estación
                    circle.setAttribute('data-station-frecuencia', playerFrecuencia); // Agregar atributo para identificar la estación
                    circle.setAttribute('data-audio-url', ciudadServerUrl); // Agregar atributo para identificar la estación
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
                    iconInner.setAttribute('class', 'fas fa-play'); // Clase base de Font Awesome
                    iconInner.style.fontSize = playerR + 'px'; // Ajustar tamaño del icono
                    iconInner.style.textAlign = 'center'; // Centrar el icono
                    iconInner.style.lineHeight = playerR + 'px'; // Centrar verticalmente

                    // Agregar el icono interno al foreignObject
                    icon.appendChild(iconInner);

                    map.appendChild(icon);

                    // Ocultar el icono inicialmente
                    iconInner.style.display = 'none';

                    // Agregar eventos de mouse para mostrar/ocultar el icono
                    circle.addEventListener('mouseover', () => {
                        iconInner.style.display = 'block';
                        listenersText.style.display = 'none'; // Ocultar listeners
                        if (currentAudio && !currentAudio.paused && currentCircle === circle) {
                            iconInner.className = 'fas fa-pause'; // Mostrar el icono de pausa si está reproduciendo
                        } else {
                            iconInner.className = 'fas fa-play'; // Mostrar el icono de play si no está reproduciendo
                        }
                    });

                    circle.addEventListener('mouseout', () => {
                        iconInner.style.display = 'none';
                        listenersText.style.display = 'block'; // Mostrar listeners
                    });

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

                    // Guardar el círculo y el texto de listeners en el mapa
                    circles.set(ciudadSrv, { circle: circle, listenersText: listenersText, iconInner: iconInner });
                }
            });

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

            // Función para actualizar los listeners
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
                            const ciudadSrv = source.server_url;
                            const circleData = circles.get(ciudadSrv);

                            if (circleData) {
                                const { circle, listenersText, iconInner } = circleData;

                                // Verificar si el círculo actual es el mismo que el círculo que está reproduciendo audio
                                if (circle !== currentCircle) {
                                    // Si la URL coincide, cambiar el color del círculo a "online" y mostrar los listeners
                                    circle.setAttribute('fill', 'var(--player-online)');
                                    iconInner.classList.remove('fa-pause');
                                    iconInner.classList.add('fa-play');
                                    listenersText.textContent = source.listeners;
                                }
                            }
                        });
                    })
                    .catch(error => {
                        console.error("Error al obtener los datos de estado:", error);
                        // Si hay un error, poner todos los círculos en rojo
                        circles.forEach(({ circle }) => {
                            circle.setAttribute('fill', 'var(--player-offline)');
                        });
                    });
            }

            // Función para actualizar el badge de oyentes
            function updateListenersBadge(playerName, playerFrecuencia, ciudadServerUrl, ciudadSrv) {
                if (currentAudio && currentCircle) {
                    // Obtener el número de oyentes de la emisora que está reproduciendo
                    fetch(statusUrlCompleta)
                        .then(response => response.json())
                        .then(data => {
                            // Verificar si 'data.icestats.source' es un array o un objeto
                            let sources = data.icestats.source;
                            if (!Array.isArray(sources)) {
                                sources = [sources]; // Convertir a array si es un objeto único
                            }

                            // Encontrar la fuente que coincide con la URL del audio actual
                            const source = sources.find(source => {
                                const sourceServerUrl = hostSRV + "/" + source.server_url;
                                return sourceServerUrl === ciudadServerUrl;
                            });

                            if (source) {
                                // Actualizar el texto de los listeners
                                const numOyentes = source.listeners;
                                stationInfoElement.innerHTML = `<button type="button" class="btn btn-primary position-relative" style="pointer-events: none"><i class="fas fa-music"></i>  ${playerName} - ${playerFrecuencia}<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">${numOyentes}<span class="visually-hidden">unread messages</span></span></button>`;
                            } else {
                                stationInfoElement.innerHTML = `<button type="button" class="btn btn-primary position-relative" style="pointer-events: none"><i class="fas fa-music"></i>  ${playerName} - ${playerFrecuencia}</button>`;
                            }
                        })
                        .catch(error => {
                            console.error("Error al obtener los datos de estado:", error);
                            stationInfoElement.innerHTML = `<button type="button" class="btn btn-primary position-relative" style="pointer-events: none"><i class="fas fa-music"></i>  ${playerName} - ${playerFrecuencia}<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">Error<span class="visually-hidden">unread messages</span></span></button>`;
                        });
                }
            }

            // Variable para almacenar el ID del intervalo
            let listenersBadgeInterval;

            // Agregar evento de clic al contenedor SVG
            map.addEventListener('click', (event) => {
                const target = event.target;

                // Verificar si el clic fue en un círculo
                if (target.tagName === 'circle') {
                    const playerName = target.getAttribute('data-station-name');
                    const playerFrecuencia = target.getAttribute('data-station-frecuencia');
                    const ciudadServerUrl = target.getAttribute('data-audio-url');

                    // Si el círculo está en rojo, mostrar el toast y no hacer nada
                    if (target.getAttribute('fill') === 'var(--player-offline)') {
                        showToast(`${playerName} - ${playerFrecuencia} No Disponible`);
                        return;
                    }

                    // Si hay un audio reproduciéndose, detenerlo
                    if (currentAudio && !currentAudio.paused) {
                        currentAudio.pause();
                        // Restablecer el color del círculo del audio anterior
                        if (currentCircle) {
                            currentCircle.setAttribute('fill', 'var(--player-online)');
                            // Encontrar el icono interno del círculo anterior y actualizarlo
                            const prevIconInner = currentCircle.parentNode.querySelector('.station-icon i');
                            if (prevIconInner) {
                                prevIconInner.classList.remove('fa-pause');
                                prevIconInner.classList.add('fa-play');
                            }
                        }
                    }

                    // Crear el elemento de audio
                    const audio = new Audio(ciudadServerUrl);

                    // Encontrar el icono interno del círculo actual
                    const iconInner = target.parentNode.querySelector('.station-icon i');

                    // Remover todos los event listeners existentes
                    audio.removeEventListener('playing', audio.playingHandler);
                    audio.removeEventListener('pause', audio.pauseHandler);
                    audio.removeEventListener('ended', audio.endedHandler);
                    audio.removeEventListener('error', audio.errorHandler);

                    // Definir los handlers de eventos
                    audio.playingHandler = () => {
                        console.log('playing');
                        iconInner.classList.remove('fa-play');
                        iconInner.classList.add('fa-pause');
                        target.setAttribute('fill', 'var(--player-playing)');
                        iconInner.className = 'fas fa-pause'; // Mostrar el icono de pausa

                        // Actualizar el badge inmediatamente al comenzar la reproducción
                        updateListenersBadge(playerName, playerFrecuencia, ciudadServerUrl, ciudadSrv);

                        // Actualizar el badge cada 10 segundos
                        listenersBadgeInterval = setInterval(() => updateListenersBadge(playerName, playerFrecuencia, ciudadServerUrl, ciudadSrv), 10000);
                    };

                    audio.pauseHandler = () => {
                        console.log('pause');
                        // console.log('Deteniendo intervalo:', listenersBadgeInterval);
                        iconInner.classList.remove('fa-pause');
                        iconInner.classList.add('fa-play');
                        target.setAttribute('fill', 'var(--player-online)'); // Cambiar a color "online" al pausar

                        // Detener el intervalo
                        clearTimeout(listenersBadgeInterval);
                    };

                    audio.endedHandler = () => {
                        console.log('ended');
                        iconInner.classList.remove('fa-pause');
                        iconInner.classList.add('fa-play');
                        target.setAttribute('fill', 'var(--player-offline)'); // Cambiar a color "offline" al finalizar
                        stationInfoElement.textContent = "Reproducir Emisora";
                    };

                    audio.errorHandler = () => {
                        console.log('error');
                        iconInner.classList.remove('fa-pause');
                        iconInner.classList.add('fa-play');
                        target.setAttribute('fill', 'var(--player-offline)'); // Cambiar a color "offline" si hay un error
                        stationInfoElement.textContent = "Reproducir Emisora";
                    };

                    // Agregar los event listeners
                    audio.addEventListener('playing', audio.playingHandler);
                    audio.addEventListener('pause', audio.pauseHandler);
                    audio.addEventListener('ended', audio.endedHandler);
                    audio.addEventListener('error', audio.errorHandler);

                    if (audio.paused) {
                        audio.play();
                        if (iconInner) {
                            iconInner.classList.remove('fa-play');
                            iconInner.classList.add('fa-pause');
                        }
                        target.setAttribute('fill', 'var(--player-playing)'); // Cambiar a --player-playing
                        stationInfoElement.innerHTML = `<button type="button" class="btn btn-primary position-relative" style="pointer-events: none"><i class="fas fa-music"></i>  ${playerName} - ${playerFrecuencia}</button>`;
                        currentAudio = audio; // Actualizar el audio actual
                        currentCircle = target; // Actualizar el círculo actual

                        // Actualizar el badge al hacer clic en el círculo
                        updateListenersBadge(playerName, playerFrecuencia, ciudadServerUrl, ciudadSrv);
                    } else {
                        audio.pause();
                        if (iconInner) {
                            iconInner.classList.remove('fa-pause');
                            iconInner.classList.add('fa-play');
                        }
                        target.setAttribute('fill', 'var(--player-online)'); // Cambiar a --player-online
                        stationInfoElement.textContent = "Mapa Emisora";
                        currentAudio = null; // No hay audio actual
                        currentCircle = null; // No hay círculo actual
                    }
                }
            });

            // Actualizar la tarjeta con la información
            const infoCard = document.getElementById('infoCard');
            const stationLogo = document.getElementById('stationLogo');
            const stationName = document.getElementById('stationName');
            const developerLink = document.getElementById('developerLink');
            const totalListenersElement = document.getElementById('totalListenersElement');
            const totalSourcesElement = document.getElementById('totalSourcesElement');

            stationLogo.src = reproductor.url_logo;
            stationName.textContent = reproductor.estacion;

            //Estilos del link del desarrollador
            developerLink.href = `https://github.com/${reproductor.desarrollador}`;
            developerLink.classList.add('btn', 'btn-link'); // Agrega clases de Bootstrap
            developerLink.innerHTML = '<i class="fab fa-github"></i>'; // Agrega el icono de GitHub y el texto

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

                        // Actualizar la tarjeta con la información
                        const infoCard = document.getElementById('infoCard');
                        const stationLogo = document.getElementById('stationLogo');
                        const stationName = document.getElementById('stationName');
                        const developerLink = document.getElementById('developerLink');
                        const totalListenersElement = document.getElementById('totalListenersElement');
                        const totalSourcesElement = document.getElementById('totalSourcesElement');

                        stationLogo.src = reproductor.url_logo;
                        stationName.textContent = reproductor.estacion;

                        //Estilos del link del desarrollador
                        developerLink.href = `https://github.com/${reproductor.desarrollador}`;
                        developerLink.classList.add('btn', 'btn-link'); // Agrega clases de Bootstrap
                        developerLink.innerHTML = '<i class="fab fa-github"></i>'; // Agrega el icono de GitHub y el texto

                        totalListenersElement.innerHTML = `<i class="fas fa-headphones"></i> Oyentes: ${totalListeners}`;
                        totalSourcesElement.innerHTML = `<i class="fas fa-broadcast-tower"></i> ${totalSources} Emisoras de ${totalEstaciones}`;

                        // Limpiar el contenido anterior de infoCard
                        infoCard.querySelector('.card-body').innerHTML = '';

                        // Agregar los elementos a la tarjeta
                        infoCard.querySelector('.card-body').appendChild(stationName);
                        infoCard.querySelector('.card-body').appendChild(stationInfoElement); // Agrega el elemento de información de la estación
                        infoCard.querySelector('.card-body').appendChild(totalListenersElement);
                        infoCard.querySelector('.card-body').appendChild(totalSourcesElement);
                        infoCard.querySelector('.card-body').appendChild(developerLink);
                    })
                    .catch(error => {
                        console.error("Error al obtener los datos de estado:", error);
                    });
            }

            // Actualizar la información cada 20 segundos
            setInterval(updateTotalInfo, 20000);

            // Llamar a la función para actualizar la información al cargar la página
            setTimeout(updateTotalInfo, 500); // Retrasar la llamada en 500m

            // Actualizar los listeners cada 20 segundos
            setInterval(updateListeners, 20000);

            // Llamar a la función para actualizar los listeners al cargar la página
            updateListeners();

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