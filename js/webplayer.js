document.addEventListener('DOMContentLoaded', () => {
    fetch('data/stations.json')
        .then(response => response.json())
        .then(data => {
            const reproductor = data.reproductor;
            const statusUrlCompleta = `${reproductor.hostUrl}/${reproductor.statusUrl}`;
            const hostSRV = reproductor.hostUrl;
            const map = document.getElementById('map');
            const waveCanvas = document.getElementById('waveCanvas');
            const waveCtx = waveCanvas.getContext('2d');
            const stationInfoElement = document.createElement('p');
            stationInfoElement.classList.add('station-info');
            let currentAudio = null;
            let currentCircle = null;
            const circles = new Map();
            let waveAnimation;

            // Función para dibujar la onda de audio
            function drawWave() {
                waveCtx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
                const numberOfWaves = 6;
                const baseAmplitude = 15;
                const baseFrequency = 0.02;
                const baseSpeed = 0.1;

                for (let j = 0; j < numberOfWaves; j++) {
                    waveCtx.beginPath();
                    waveCtx.strokeStyle = `rgba(0, 200, 81, ${0.7 - j * 0.2})`;
                    waveCtx.lineWidth = 2;
                    const amplitude = baseAmplitude + j * 5;
                    const frequency = baseFrequency + j * 0.01;
                    const speed = baseSpeed + j * 0.05;

                    for (let i = 0; i < waveCanvas.width; i++) {
                        const y = waveCanvas.height / 2 + amplitude * Math.sin(frequency * i + Date.now() * speed);
                        waveCtx.lineTo(i, y);
                    }

                    waveCtx.stroke();
                }

                waveAnimation = requestAnimationFrame(drawWave);
            }

            // Función para iniciar la animación de la onda de audio
            function startWave() {
                waveCanvas.style.display = 'block';
                drawWave();
            }

            // Función para detener la animación de la onda de audio
            function stopWave() {
                waveCanvas.style.display = 'none';
                cancelAnimationFrame(waveAnimation);
                waveCtx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
            }

            // Función para mostrar un mensaje emergente (toast)
            function showToast(message) {
                const toast = document.createElement('div');
                toast.classList.add('toast');
                toast.textContent = message;
                document.body.appendChild(toast);
                toast.style.backgroundColor = 'var(--toast-bg)';
                toast.style.color = 'var(--toast-text)';
                toast.style.textAlign = 'center';

                setTimeout(() => {
                    toast.classList.add('show');
                    setTimeout(() => {
                        toast.classList.remove('show');
                        setTimeout(() => {
                            document.body.removeChild(toast);
                        }, 300);
                    }, 3000);
                }, 100);
            }

            // Función para actualizar la información de los oyentes
            function updateListeners() {
                fetch(statusUrlCompleta)
                    .then(response => response.json())
                    .then(data => {
                        let sources = Array.isArray(data.icestats.source) ? data.icestats.source : [data.icestats.source];
                        
                        // Debug para ayudar a identificar problemas
                        console.debug('Fuentes disponibles:', sources.map(s => s.server_url));
                        console.debug('Círculos mapeados:', Array.from(circles.keys()));
                        
                        // Primero marcar todas las estaciones como offline
                        circles.forEach(({ circle, listenersText }, serverUrl) => {
                            if (circle !== currentCircle) {
                                circle.setAttribute('fill', 'var(--player-offline)');
                                listenersText.textContent = '0';
                            }
                        });
                        
                        // Luego actualizamos solo las que tienen coincidencia exacta
                        sources.forEach(source => {
                            const serverPath = source.server_url;
                            
                            // Solo considerar coincidencia exacta
                            const circleData = circles.get(serverPath);
                            
                            if (circleData && circleData.circle !== currentCircle) {
                                // Actualizar estación que coincide exactamente
                                circleData.circle.setAttribute('fill', 'var(--player-online)');
                                circleData.iconInner.classList.replace('fa-pause', 'fa-play');
                                circleData.listenersText.textContent = source.listeners;
                                circleData.listenersText.style.display = 'block';
                            }
                        });
                    })
                    .catch(error => {
                        console.error('Error al actualizar oyentes:', error);
                        circles.forEach(({ circle }) => {
                            if (circle !== currentCircle) {
                                circle.setAttribute('fill', 'var(--player-offline)');
                            }
                        });
                    });
            }

            // Función para actualizar la insignia de oyentes
            function updateListenersBadge(playerName, playerFrecuencia, ciudadServerUrl) {
                if (currentAudio && currentCircle) {
                    fetch(statusUrlCompleta)
                        .then(response => response.json())
                        .then(data => {
                            let sources = Array.isArray(data.icestats.source) ? data.icestats.source : [data.icestats.source];
                            
                            // Extraer solo la parte serverUrl del ciudadServerUrl completo
                            const serverUrlPart = ciudadServerUrl.replace(hostSRV + '/', '');
                            
                            // Buscar coincidencia exacta
                            const source = sources.find(source => source.server_url === serverUrlPart);
                            const numOyentes = source ? source.listeners : '0';
                            
                            stationInfoElement.innerHTML = `<button type="button" class="btn btn-primary position-relative" style="pointer-events: none"><i class="fas fa-music fixed-color"></i> ${playerName} - ${playerFrecuencia}<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">${numOyentes}<span class="visually-hidden">unread messages</span></span></button>`;
                        })
                        .catch(() => {
                            stationInfoElement.innerHTML = `<button type="button" class="btn btn-primary position-relative" style="pointer-events: none"><i class="fas fa-music fixed-color"></i> ${playerName} - ${playerFrecuencia}<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">0<span class="visually-hidden">unread messages</span></span></button>`;
                        });
                }
            }

            // Función para restablecer la apariencia del círculo
            function resetCircleAppearance(circle) {
                if (circle) {
                    circle.setAttribute('fill', 'var(--player-online)');
                    const prevIconInner = circle.parentNode.querySelector('.station-icon i');
                    if (prevIconInner) {
                        prevIconInner.classList.replace('fa-pause', 'fa-play');
                    }
                }
            }

            // Crear círculos para cada ciudad
            reproductor.ciudades.forEach(ciudad => {
                if (ciudad.serverUrl) {
                    const ciudadServerUrl = `${reproductor.hostUrl}/${ciudad.serverUrl}`;
                    const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
                    circle.setAttribute('cx', ciudad.cx);
                    circle.setAttribute('cy', ciudad.cy);
                    circle.setAttribute('r', reproductor.r);
                    circle.setAttribute('fill', 'var(--player-offline)');
                    circle.setAttribute('class', 'station-circle');
                    circle.setAttribute('data-station-name', ciudad.name);
                    circle.setAttribute('data-station-frecuencia', ciudad.frecuencia);
                    circle.setAttribute('data-audio-url', ciudadServerUrl);
                    circle.setAttribute('data-server-url', ciudad.serverUrl); // Añadir atributo para identificación directa
                    map.appendChild(circle);

                    // Crear tooltip para mostrar información de la ciudad
                    const tooltip = document.createElement('div');
                    tooltip.classList.add('tooltip');
                    tooltip.innerHTML = `${ciudad.name} ${ciudad.frecuencia}`;
                    document.body.appendChild(tooltip);

                    circle.addEventListener('mousemove', (event) => {
                        tooltip.style.left = `${event.pageX + 10}px`;
                        tooltip.style.top = `${event.pageY + 10}px`;
                    });

                    circle.addEventListener('mouseover', () => {
                        tooltip.classList.add('show');
                    });

                    circle.addEventListener('mouseout', () => {
                        tooltip.classList.remove('show');
                    });

                    // Crear icono de reproducción/pausa
                    const icon = document.createElementNS("http://www.w3.org/2000/svg", 'foreignObject');
                    icon.setAttribute('x', ciudad.cx - reproductor.r / 2);
                    icon.setAttribute('y', ciudad.cy - reproductor.r / 2);
                    icon.setAttribute('width', reproductor.r);
                    icon.setAttribute('height', reproductor.r);
                    icon.setAttribute('class', 'station-icon');
                    icon.style.pointerEvents = 'none';

                    const iconInner = document.createElement('i');
                    iconInner.setAttribute('class', 'fas fa-play');
                    iconInner.style.fontSize = `${reproductor.r}px`;
                    iconInner.style.textAlign = 'center';
                    iconInner.style.lineHeight = `${reproductor.r}px`;
                    icon.appendChild(iconInner);
                    map.appendChild(icon);
                    iconInner.style.display = 'none';

                    circle.addEventListener('mouseover', () => {
                        iconInner.style.display = 'block';
                        listenersText.style.display = 'none';
                        iconInner.className = currentAudio && !currentAudio.paused && currentCircle === circle ? 'fas fa-pause' : 'fas fa-play';
                    });

                    circle.addEventListener('mouseout', () => {
                        iconInner.style.display = 'none';
                        listenersText.style.display = 'block';
                    });

                    // Crear texto para mostrar el número de oyentes
                    const listenersText = document.createElementNS("http://www.w3.org/2000/svg", 'text');
                    listenersText.setAttribute('x', ciudad.cx);
                    listenersText.setAttribute('y', ciudad.cy + 5);
                    listenersText.setAttribute('text-anchor', 'middle');
                    listenersText.setAttribute('class', 'listeners-text');
                    listenersText.textContent = '0';
                    map.appendChild(listenersText);

                    // Crear texto para mostrar el nombre de la estación
                    const text = document.createElementNS("http://www.w3.org/2000/svg", 'text');
                    text.setAttribute('x', ciudad.cx);
                    text.setAttribute('y', parseFloat(ciudad.cy) + parseFloat(reproductor.r) + 5);
                    text.setAttribute('text-anchor', 'middle');
                    text.setAttribute('class', 'station-name');
                    text.textContent = ciudad.name;
                    map.appendChild(text);

                    // Modificar cómo se almacena la referencia en el mapa de círculos
                    // Usar el nombre del stream (sin host) como clave principal para mayor robustez
                    circles.set(ciudad.serverUrl, { circle, listenersText, iconInner });
                    
                    // Ya no necesitamos almacenar referencias alternativas
                    // Eliminar el siguiente bloque:
                    /*
                    if (ciudad.name) {
                        circles.set(`name:${ciudad.name.toLowerCase()}`, { circle, listenersText, iconInner });
                    }
                    */
                }
            });

            // Manejar el evento de clic en el mapa
            map.addEventListener('click', (event) => {
                const target = event.target;
                if (target.tagName === 'circle') {
                    const playerName = target.getAttribute('data-station-name');
                    const playerFrecuencia = target.getAttribute('data-station-frecuencia');
                    const ciudadServerUrl = target.getAttribute('data-audio-url');

                    if (target.getAttribute('fill') === 'var(--player-offline)') {
                        showToast(`${playerName} - ${playerFrecuencia} No Disponible`);
                        return;
                    }

                    if (currentAudio) {
                        if (!currentAudio.paused && currentCircle === target) {
                            currentAudio.pause();
                            stopWave();
                            return;
                        } else {
                            currentAudio.pause();
                            resetCircleAppearance(currentCircle);
                            stopWave();
                        }
                    }

                    const audio = new Audio(ciudadServerUrl);
                    const iconInner = target.parentNode.querySelector('.station-icon i');

                    audio.removeEventListener('playing', audio.playingHandler);
                    audio.removeEventListener('pause', audio.pauseHandler);
                    audio.removeEventListener('ended', audio.endedHandler);
                    audio.removeEventListener('error', audio.errorHandler);

                    audio.playingHandler = () => {
                        iconInner.classList.replace('fa-play', 'fa-pause');
                        target.setAttribute('fill', 'var(--player-playing)');
                        waveCanvas.width = stationLogo.offsetWidth;
                        waveCanvas.height = stationLogo.offsetHeight;
                        startWave();
                        updateListenersBadge(playerName, playerFrecuencia, ciudadServerUrl);
                        listenersBadgeInterval = setInterval(() => updateListenersBadge(playerName, playerFrecuencia, ciudadServerUrl), 10000);
                    };

                    audio.pauseHandler = () => {
                        iconInner.classList.replace('fa-pause', 'fa-play');
                        target.setAttribute('fill', 'var(--player-online)');
                        stopWave();
                        clearTimeout(listenersBadgeInterval);
                        stationInfoElement.innerHTML = '';
                    };

                    audio.endedHandler = () => {
                        iconInner.classList.replace('fa-pause', 'fa-play');
                        target.setAttribute('fill', 'var(--player-offline)');
                        stationInfoElement.textContent = "Reproducir Emisora";
                        stopWave();
                    };

                    audio.errorHandler = () => {
                        iconInner.classList.replace('fa-pause', 'fa-play');
                        target.setAttribute('fill', 'var(--player-offline)');
                        stationInfoElement.textContent = "Reproducir Emisora";
                        stopWave();
                    };

                    audio.addEventListener('playing', audio.playingHandler);
                    audio.addEventListener('pause', audio.pauseHandler);
                    audio.addEventListener('ended', audio.endedHandler);
                    audio.addEventListener('error', audio.errorHandler);

                    audio.play();
                    iconInner.classList.replace('fa-play', 'fa-pause');
                    target.setAttribute('fill', 'var(--player-playing)');
                    stationInfoElement.innerHTML = `<button type="button" class="btn btn-primary position-relative" style="pointer-events: none"><i class="fas fa-music fixed-color"></i> ${playerName} - ${playerFrecuencia}</button>`;
                    currentAudio = audio;
                    currentCircle = target;
                    updateListenersBadge(playerName, playerFrecuencia, ciudadServerUrl);
                }
            });

            const infoCard = document.getElementById('infoCard');
            const stationLogo = document.getElementById('stationLogo');
            const stationName = document.getElementById('stationName');
            const developerLink = document.getElementById('developerLink');
            const totalListenersElement = document.getElementById('totalListenersElement');
            const totalSourcesElement = document.getElementById('totalSourcesElement');

            stationLogo.src = reproductor.url_logo;
            stationName.textContent = reproductor.estacion;
            developerLink.href = `https://github.com/${reproductor.desarrollador}`;
            developerLink.classList.add('btn', 'btn-link');
            developerLink.innerHTML = '<i class="fab fa-github"></i>';

            // Función para actualizar la información total de oyentes y emisoras
            function updateTotalInfo() {
                fetch(statusUrlCompleta)
                    .then(response => response.json())
                    .then(data => {
                        let sources = Array.isArray(data.icestats.source) ? data.icestats.source : [data.icestats.source];
                        const totalListeners = sources.reduce((acc, source) => acc + parseInt(source.listeners), 0);
                        const totalSources = sources.length;

                        totalListenersElement.innerHTML = `<i class="fas fa-headphones"></i>  Total Oyentes: <span class="total-listeners">${totalListeners}</span>`;
                        totalSourcesElement.innerHTML = `<i class="fas fa-broadcast-tower"></i>  <span class="total-sources">${totalSources}</span> Emisoras de  <span class="total-estaciones">${reproductor.total_estaciones}</span>`;

                        infoCard.querySelector('.card-body').innerHTML = '';
                        infoCard.querySelector('.card-body').append(stationName, stationInfoElement, totalListenersElement, totalSourcesElement);
                    })
                    .catch(console.error);
            }

            // Actualizar la información total cada 20 segundos
            setInterval(updateTotalInfo, 20000);
            setTimeout(updateTotalInfo, 500);
            setInterval(updateListeners, 20000);
            updateListeners();

            infoCard.querySelector('.card-body').innerHTML = '';
            infoCard.querySelector('.card-body').append(stationName, stationInfoElement, totalListenersElement, totalSourcesElement);

            // Función para establecer la posición de la tarjeta de información
            function setInfoCardPosition() {
                const screenWidth = window.innerWidth;
                // console.log(screenWidth);
                const margin = 20;
                let left = screenWidth > 1028 ? margin : screenWidth - infoCard.offsetWidth - margin;
                let top = margin;
                let scale = 1; // Escala por defecto
                let right = 'auto'; // Inicializa right en 'auto'

                if (screenWidth <= 430) {
                    // console.log("Menor a 430 > " + screenWidth);
                    // Ajustes para pantallas menores a 430px
                    top = 100;
                    left = 'auto';
                    right = 5;
                    scale = 0.55;
                    infoCard.style.transformOrigin = 'top right';
                } else if (screenWidth <= 490) {
                    // console.log("Menor a 490 -> " + screenWidth);
                    // Ajustes para pantallas menores a 490px
                    top = 50;
                    left = 'auto';
                    right = 5;
                    scale = 0.62;
                    infoCard.style.transformOrigin = 'top right';
                } else if (screenWidth <= 538) {
                    // console.log("Menor a 538 --> " + screenWidth);
                    // Ajustes para pantallas menores a 538px
                    top = 40;
                    left = 'auto';
                    right = 5;
                    scale = 0.7;
                    infoCard.style.transformOrigin = 'top right';
                } else if (screenWidth <= 629) {
                    // console.log("Menor a 629 ---> " + screenWidth);
                    // Ajustes para pantallas menores a 629px
                    top = 20;
                    left = 'auto';
                    right = 10;
                    scale = 0.75;
                    infoCard.style.transformOrigin = 'top right';
                } else if (screenWidth <= 720) {
                    // console.log("Menor a 720 ----> " + screenWidth);
                    // Ajustes para pantallas menores a 720px
                    top = 20;
                    left = 'auto';
                    right = 15;
                    scale = 0.8;
                    infoCard.style.transformOrigin = 'top right';
                } else if (screenWidth <= 990) {
                    // console.log("Menor a 990 -----> " + screenWidth);
                    // Ajustes para pantallas menores a 990px
                    top = 20;
                    left = 'auto';
                    right = 20;
                    scale = 0.87;
                    infoCard.style.transformOrigin = 'top right';
                } else {
                    // Restablece el origen de la transformación para resoluciones mayores
                    infoCard.style.transformOrigin = 'top left';
                    right = 'auto'; // Restablece el right
                }

                infoCard.style.left = left === 'auto' ? 'auto' : `${left}px`; // Establece left o auto
                infoCard.style.right = right === 'auto' ? 'auto' : `${right}px`; // Establece right o auto
                infoCard.style.top = `${top}px`;
                infoCard.style.transform = `scale(${scale})`; // Aplica la escala
                infoCard.classList.toggle('small-card', screenWidth <= 1028);
            }

            setInfoCardPosition();
            window.addEventListener('resize', setInfoCardPosition);
        })
        .catch(console.error);
});