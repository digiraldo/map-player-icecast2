document.addEventListener('DOMContentLoaded', () => {
    // Añadir esta función para cerrar todos los tooltips activos
    function closeAllTooltips() {
        document.querySelectorAll('.tooltip.show').forEach(tooltip => {
            tooltip.classList.remove('show');
        });
    }
    
    // Cerrar tooltips al hacer clic en cualquier parte (importante para táctiles)
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.station-circle')) {
            closeAllTooltips();
        }
    });
    
    // Cerrar tooltips al tocar la pantalla en un área diferente
    document.addEventListener('touchstart', function(event) {
        if (!event.target.closest('.station-circle')) {
            closeAllTooltips();
        }
    });

    fetch('data/stations.json')
        .then(response => response.json())
        .then(data => {
            const reproductor = data.reproductor;
            
            // Establecer valores predeterminados desde el principio
            setDefaultValues(reproductor);
            
            // Verificar si hostUrl está vacío
            if (!reproductor.hostUrl || reproductor.hostUrl.trim() === '') {
                showConfigAlert('La URL del servidor (hostUrl) no está configurada');
                return; // Detener la ejecución si no hay hostUrl
            }
            
            const statusUrlCompleta = `${reproductor.hostUrl}/${reproductor.statusUrl}`;
            const hostSRV = reproductor.hostUrl;
            
            // Verificar conexión al servidor
            checkServerConnection(statusUrlCompleta)
                .then(isConnected => {
                    if (!isConnected) {
                        showConfigAlert('No se pudo conectar al servidor. Verifique la URL del servidor en la configuración.');
                    }
                    
                    // Continuar con la inicialización normal
                    initializePlayer(reproductor, statusUrlCompleta, hostSRV);
                })
                .catch(error => {
                    console.error('Error al verificar la conexión:', error);
                    showConfigAlert('Error al verificar la conexión con el servidor.');
                });
        })
        .catch(console.error);
        
    // Función para verificar la conexión al servidor
    function checkServerConnection(url) {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                // Verificar si hay fuentes disponibles
                const sources = data.icestats && data.icestats.source ? 
                    (Array.isArray(data.icestats.source) ? data.icestats.source : [data.icestats.source]) : [];
                
                return sources.length > 0; // Devolver true si hay al menos una fuente
            })
            .catch(error => {
                console.error('Error de conexión:', error);
                return false; // Devolver false si hay error
            });
    }
    
    // Función para mostrar alerta con botón de configuración
    function showConfigAlert(message) {
        // Crear elemento de alerta
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-warning alert-dismissible fade show config-alert';
        alertDiv.style.position = 'fixed';
        alertDiv.style.top = '50%';
        alertDiv.style.left = '50%';
        alertDiv.style.transform = 'translate(-50%, -50%)';
        alertDiv.style.zIndex = '9999';
        alertDiv.style.maxWidth = '80%';
        alertDiv.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        alertDiv.style.textAlign = 'center';
        
        alertDiv.innerHTML = `
            <h4 class="alert-heading mb-3"><i class="fas fa-exclamation-triangle me-2"></i>Atención</h4>
            <p>${message}</p>
            <hr>
            <div class="d-flex justify-content-center">
                <button type="button" class="btn btn-primary me-2" id="openConfigBtn">
                    <i class="fas fa-cog me-1"></i> Abrir Configuración
                </button>
                <button type="button" class="btn btn-secondary" data-bs-dismiss="alert" aria-label="Close">
                    <i class="fas fa-times me-1"></i> Cerrar
                </button>
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Configurar evento para abrir configuración
        document.getElementById('openConfigBtn').addEventListener('click', function() {
            // Cerrar la alerta
            alertDiv.remove();
            
            // Simular clic en el botón de edición para abrir el modal de estaciones
            const editButton = document.getElementById('editButton');
            if (editButton) {
                editButton.click();
                
                // Añadir un pequeño retraso para asegurarse de que el modal de estaciones se abre primero
                setTimeout(() => {
                    // Luego simular clic en el botón de configuración
                    const configBtn = document.getElementById('configPlayerBtn');
                    if (configBtn) configBtn.click();
                }, 300);
            }
        });
    }
    
    // Función para inicializar el reproductor (mover el código existente aquí)
    function initializePlayer(reproductor, statusUrlCompleta, hostSRV) {
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

        // Crear círculos para cada ciudad - Modificar el orden de creación de elementos
        reproductor.ciudades.forEach(ciudad => {
            if (ciudad.serverUrl) {
                const ciudadServerUrl = `${reproductor.hostUrl}/${ciudad.serverUrl}`;
                
                // Crear un grupo SVG para mantener todos los elementos de la estación juntos
                const stationGroup = document.createElementNS("http://www.w3.org/2000/svg", 'g');
                stationGroup.setAttribute('class', 'station-group');
                stationGroup.setAttribute('data-station-name', ciudad.name);
                stationGroup.setAttribute('data-server-url', ciudad.serverUrl);
                
                // Crear círculo de la estación
                const circle = document.createElementNS("http://www.w3.org/2000/svg", 'circle');
                circle.setAttribute('cx', ciudad.cx);
                circle.setAttribute('cy', ciudad.cy);
                circle.setAttribute('r', reproductor.r);
                circle.setAttribute('fill', 'var(--player-offline)');
                circle.setAttribute('class', 'station-circle');
                circle.setAttribute('data-station-name', ciudad.name);
                circle.setAttribute('data-station-frecuencia', ciudad.frecuencia);
                circle.setAttribute('data-audio-url', ciudadServerUrl);
                circle.setAttribute('data-server-url', ciudad.serverUrl);
                stationGroup.appendChild(circle);

                // Crear texto para mostrar el número de oyentes - Modificar para usar tamaño dinámico
                const listenersText = document.createElementNS("http://www.w3.org/2000/svg", 'text');
                listenersText.setAttribute('x', ciudad.cx);
                listenersText.setAttribute('y', ciudad.cy);
                listenersText.setAttribute('text-anchor', 'middle');
                listenersText.setAttribute('dominant-baseline', 'central');
                listenersText.setAttribute('class', 'listeners-text');
                
                // Calcular el tamaño de la fuente basado en el radio (r * 2)
                const fontSize = parseFloat(reproductor.r) * 0.065; // r*2 / 10 para tener una escala razonable (r*2 sería demasiado grande)
                listenersText.style.fontSize = `${fontSize}em`; // Usando em para mejor escalabilidad
                
                listenersText.textContent = '0';
                listenersText.style.pointerEvents = 'none';
                stationGroup.appendChild(listenersText);
                
                // Crear icono de reproducción/pausa
                const icon = document.createElementNS("http://www.w3.org/2000/svg", 'foreignObject');
                icon.setAttribute('x', parseFloat(ciudad.cx) - parseFloat(reproductor.r) / 2);
                icon.setAttribute('y', parseFloat(ciudad.cy) - parseFloat(reproductor.r) / 2);
                icon.setAttribute('width', reproductor.r);
                icon.setAttribute('height', reproductor.r);
                icon.setAttribute('class', 'station-icon');
                icon.style.pointerEvents = 'none';

                const iconInner = document.createElement('i');
                iconInner.setAttribute('class', 'fas fa-play');
                iconInner.style.fontSize = `${reproductor.r * 1.2}px`; // AQUÍ se establece el tamaño del icono
                iconInner.style.textAlign = 'center';
                iconInner.style.lineHeight = `${reproductor.r}px`;
                icon.appendChild(iconInner);
                stationGroup.appendChild(icon);
                iconInner.style.display = 'none';

                // Crear texto para mostrar el nombre de la estación
                const stationNameText = document.createElementNS("http://www.w3.org/2000/svg", 'text');
                stationNameText.setAttribute('x', ciudad.cx);
                stationNameText.setAttribute('y', parseFloat(ciudad.cy) + parseFloat(reproductor.r) + 5);
                stationNameText.setAttribute('text-anchor', 'middle');
                stationNameText.setAttribute('class', 'station-name');
                stationNameText.textContent = ciudad.name;
                stationGroup.appendChild(stationNameText);
                
                // Agregar el grupo al mapa
                map.appendChild(stationGroup);

                // Crear tooltip para mostrar información de la ciudad
                const tooltip = document.createElement('div');
                tooltip.classList.add('tooltip');
                tooltip.innerHTML = `${ciudad.name} ${ciudad.frecuencia}`;
                document.body.appendChild(tooltip);

                // Variable para almacenar el temporizador del tooltip
                let tooltipTimeout;

                // Mejorar eventos del mouse para mostrar/ocultar elementos
                circle.addEventListener('mousemove', (event) => {
                    tooltip.style.left = `${event.pageX + 10}px`;
                    tooltip.style.top = `${event.pageY + 10}px`;
                });

                // Mostrar tooltip también en touchstart para dispositivos táctiles
                circle.addEventListener('touchstart', (event) => {
                    // Cerrar primero otros tooltips
                    closeAllTooltips();
                    
                    const touch = event.touches[0];
                    tooltip.style.left = `${touch.pageX + 10}px`;
                    tooltip.style.top = `${touch.pageY + 10}px`;
                    
                    // Mostrar el tooltip
                    showTooltip();
                    
                    // Evitar propagación para que no se dispare el cierre global
                    event.stopPropagation();
                });

                // Función para mostrar el tooltip con temporizador
                function showTooltip() {
                    // Limpiar cualquier temporizador existente
                    if (tooltipTimeout) {
                        clearTimeout(tooltipTimeout);
                    }
                    
                    tooltip.classList.add('show');
                    iconInner.style.display = 'block';
                    listenersText.style.visibility = 'hidden';
                    iconInner.className = currentAudio && !currentAudio.paused && currentCircle === circle ? 'fas fa-pause' : 'fas fa-play';
                    
                    // Configurar un nuevo temporizador para ocultar el tooltip después de 5 segundos
                    tooltipTimeout = setTimeout(() => {
                        tooltip.classList.remove('show');
                        if (!currentCircle || currentCircle !== circle) {
                            iconInner.style.display = 'none';
                            listenersText.style.visibility = 'visible';
                        }
                    }, 5000);
                }

                circle.addEventListener('mouseover', showTooltip);

                circle.addEventListener('mouseout', () => {
                    // Limpiar el temporizador si el mouse sale antes
                    if (tooltipTimeout) {
                        clearTimeout(tooltipTimeout);
                        tooltipTimeout = null;
                    }
                    
                    tooltip.classList.remove('show');
                    iconInner.style.display = 'none';
                    listenersText.style.visibility = 'visible';
                });

                // Modificar cómo se almacena la referencia en el mapa de círculos
                circles.set(ciudad.serverUrl, { 
                    circle, 
                    listenersText, 
                    iconInner,
                    stationGroup,
                    serverUrl: ciudad.serverUrl,
                    name: ciudad.name
                });
            }
        });

        // Función para actualizar la información de los oyentes - optimizada
        function updateListeners() {
            fetch(statusUrlCompleta)
                .then(response => response.json())
                .then(data => {
                    let sources = Array.isArray(data.icestats.source) ? data.icestats.source : [data.icestats.source];
                    
                    // Crear un mapa de fuentes para búsqueda rápida
                    const sourcesMap = new Map();
                    sources.forEach(source => {
                        sourcesMap.set(source.server_url, source);
                    });
                    
                    // Primero marcar todas las estaciones como offline
                    circles.forEach(({ circle, listenersText }, serverUrl) => {
                        if (circle !== currentCircle) {
                            circle.setAttribute('fill', 'var(--player-offline)');
                            listenersText.textContent = '0';
                        }
                    });
                    
                    // Debug - registrar información sobre estaciones
                    // console.group("Actualización de oyentes");
                    // console.log("Estaciones configuradas:", Array.from(circles.keys()));
                    // console.log("Fuentes disponibles:", Array.from(sourcesMap.keys()));
                    
                    // Actualizar cada estación según coincidencia exacta
                    circles.forEach(({ circle, listenersText, serverUrl, name }, key) => {
                        const source = sourcesMap.get(serverUrl);
                        
                        if (source) {
                            if (circle !== currentCircle) {
                                circle.setAttribute('fill', 'var(--player-online)');
                            }
                            
                            // Actualizar el número de oyentes y asegurar su visibilidad
                            listenersText.textContent = source.listeners;
                            listenersText.style.visibility = 'visible';
                            
                            // console.log(`Estación "${name}" (${serverUrl}): ${source.listeners} oyentes - ONLINE`);
                        } else {
                            // console.log(`Estación "${name}" (${serverUrl}): sin datos - OFFLINE`);
                        }
                    });
                    
                    console.groupEnd();
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

        // Manejar el evento de clic en el mapa
        map.addEventListener('click', (event) => {
            // Cerrar todos los tooltips al hacer clic
            closeAllTooltips();
            
            let target = event.target;
            
            // Si el clic no fue directamente en un círculo, verificar si fue en otro elemento de la estación
            if (target.tagName !== 'circle' && target.closest('.station-group')) {
                const group = target.closest('.station-group');
                target = group.querySelector('circle');
                if (!target) return;
            }
            
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

        // Usar imagen predeterminada si url_logo está vacío
        stationLogo.src = reproductor.url_logo && reproductor.url_logo.trim() !== '' ? 
            reproductor.url_logo : 'img/DiGiraldo-Logo.png';

        // Garantizar que la imagen se carga, incluso si hay error
        stationLogo.onerror = function() {
            console.log('Error al cargar logo, usando predeterminado');
            this.src = 'img/DiGiraldo-Logo.png';
            // En algunos navegadores, puede ocurrir recursión si img/DiGiraldo-Logo.png también falla
            this.onerror = null; 
        };

        // Usar texto predeterminado si estacion está vacío
        stationName.textContent = reproductor.estacion && reproductor.estacion.trim() !== '' ? 
            reproductor.estacion : 'Diseñado por DiGiraldo';
        console.log("Texto del título establecido a:", stationName.textContent);

        // Forzar valor predeterminado si quedó en blanco por alguna razón
        if (!stationName.textContent || stationName.textContent.trim() === '') {
            stationName.textContent = 'Diseñado por DiGiraldo';
            console.log("Título corregido a valor predeterminado");
        }

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
                    
                    // Calcular el número real de estaciones configuradas
                    const totalConfiguredStations = reproductor.ciudades.length;
                    
                    // Contar estaciones online (círculos verdes)
                    let onlineStationsCount = 0;
                    circles.forEach(({ circle }) => {
                        if (circle !== currentCircle && circle.getAttribute('fill') === 'var(--player-online)') {
                            onlineStationsCount++;
                        }
                    });
                    
                    // Calcular la diferencia entre fuentes disponibles y círculos verdes
                    const unmappedSources = totalSources - onlineStationsCount;
                    
                    totalListenersElement.innerHTML = `<i class="fas fa-headphones"></i>  Total Oyentes: <span class="total-listeners">${totalListeners}</span>`;
                    
                    // Crear wrapper con tooltip para fuentes sin mapear
                    const sourcesSpan = document.createElement('span');
                    sourcesSpan.classList.add('total-sources');
                    sourcesSpan.textContent = totalSources;
                    sourcesSpan.setAttribute('data-bs-toggle', 'tooltip');
                    sourcesSpan.setAttribute('data-bs-placement', 'top');
                    sourcesSpan.setAttribute('title', `${unmappedSources} fuentes sin mapear`);
                    
                    // Actualizar el contenedor de fuentes
                    totalSourcesElement.innerHTML = '';
                    const towerIcon = document.createElement('i');
                    towerIcon.className = 'fas fa-broadcast-tower';
                    totalSourcesElement.appendChild(towerIcon);
                    totalSourcesElement.appendChild(document.createTextNode('  '));
                    totalSourcesElement.appendChild(sourcesSpan);
                    totalSourcesElement.appendChild(document.createTextNode(` Emisoras de `));
                    
                    const stationsSpan = document.createElement('span');
                    stationsSpan.classList.add('total-estaciones');
                    stationsSpan.textContent = totalConfiguredStations;
                    totalSourcesElement.appendChild(stationsSpan);
                    
                    infoCard.querySelector('.card-body').innerHTML = '';
                    infoCard.querySelector('.card-body').append(stationName, stationInfoElement, totalListenersElement, totalSourcesElement);
                    
                    // Inicializar los tooltips de Bootstrap
                    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
                    tooltipTriggerList.map(function (tooltipTriggerEl) {
                        return new bootstrap.Tooltip(tooltipTriggerEl);
                    });
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
    }

    // Hacer que la función esté disponible globalmente
    window.initializePlayer = initializePlayer;

    // Función para establecer valores predeterminados
    function setDefaultValues(reproductor) {
        // Establecer logo predeterminado
        const stationLogo = document.getElementById('stationLogo');
        if (stationLogo) {
            stationLogo.src = reproductor.url_logo && reproductor.url_logo.trim() !== '' ? 
                reproductor.url_logo : 'img/DiGiraldo-Logo.png';
                
            // Garantizar que la imagen se carga, incluso si hay error
            stationLogo.onerror = function() {
                console.log('Error al cargar logo, usando predeterminado');
                this.src = 'img/DiGiraldo-Logo.png';
                this.onerror = null; // Prevenir recursión
            };
        }
        
        // Establecer título predeterminado
        const stationName = document.getElementById('stationName');
        if (stationName) {
            stationName.textContent = reproductor.estacion && reproductor.estacion.trim() !== '' ? 
                reproductor.estacion : 'Diseñado por DiGiraldo';
            
            // Forzar valor predeterminado si quedó en blanco
            if (!stationName.textContent || stationName.textContent.trim() === '') {
                stationName.textContent = 'Diseñado por DiGiraldo';
            }
        }
        
        // Establecer enlace del desarrollador si existe el elemento
        const developerLink = document.getElementById('developerLink');
        if (developerLink && reproductor.desarrollador) {
            developerLink.href = `https://github.com/${reproductor.desarrollador}`;
        }
    }
});