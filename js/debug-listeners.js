/**
 * Script de depuración para problemas con los contadores de oyentes
 * Actívelo añadiendo ?debug=true a la URL o presionando Ctrl+Shift+D en la página
 */

document.addEventListener('DOMContentLoaded', () => {
    // Verificar si el modo de depuración está activado
    const urlParams = new URLSearchParams(window.location.search);
    const debugMode = urlParams.get('debug') === 'true';

    // También podemos activar la depuración con una combinación de teclas
    document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'D') {
            startDebugging();
        }
    });

    if (debugMode) {
        startDebugging();
    }

    function startDebugging() {
        // Crear un panel de depuración
        createDebugPanel();
        
        // Verificar todas las estaciones
        setTimeout(checkStationsVisibility, 2000);
    }

    function createDebugPanel() {
        const debugPanel = document.createElement('div');
        debugPanel.id = 'debugPanel';
        debugPanel.style.position = 'fixed';
        debugPanel.style.bottom = '10px';
        debugPanel.style.left = '10px';
        debugPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        debugPanel.style.color = '#fff';
        debugPanel.style.padding = '10px';
        debugPanel.style.borderRadius = '5px';
        debugPanel.style.zIndex = '9999';
        debugPanel.style.maxHeight = '300px';
        debugPanel.style.overflowY = 'auto';
        debugPanel.innerHTML = '<h3>Depuración de Oyentes</h3><div id="debugContent"></div>';
        
        // Botón para forzar actualización
        const refreshBtn = document.createElement('button');
        refreshBtn.textContent = 'Actualizar datos';
        refreshBtn.style.margin = '10px 0';
        refreshBtn.addEventListener('click', checkStationsVisibility);
        debugPanel.appendChild(refreshBtn);
        
        document.body.appendChild(debugPanel);
    }

    function checkStationsVisibility() {
        // Esperar a que la variable circles esté disponible
        if (typeof circles === 'undefined') {
            setTimeout(checkStationsVisibility, 1000);
            return;
        }
        
        const debugContent = document.getElementById('debugContent');
        if (!debugContent) return;
        
        debugContent.innerHTML = '<h4>Estaciones:</h4>';
        const table = document.createElement('table');
        table.style.borderCollapse = 'collapse';
        table.style.width = '100%';
        table.style.fontSize = '12px';
        
        // Cabecera de la tabla
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th style="border: 1px solid #ccc; padding: 4px;">Estación</th>
                <th style="border: 1px solid #ccc; padding: 4px;">Server URL</th>
                <th style="border: 1px solid #ccc; padding: 4px;">Oyentes</th>
                <th style="border: 1px solid #ccc; padding: 4px;">Estado</th>
                <th style="border: 1px solid #ccc; padding: 4px;">Posición</th>
            </tr>
        `;
        table.appendChild(thead);
        
        const tbody = document.createElement('tbody');
        
        // Analizar cada estación
        circles.forEach(({ circle, listenersText, serverUrl, name }, key) => {
            const row = document.createElement('tr');
            
            // Verificar si el texto de oyentes es visible
            const textVisible = getComputedStyle(listenersText).visibility !== 'hidden' && 
                               getComputedStyle(listenersText).display !== 'none';
            
            // Obtener la posición del texto
            const textPosition = listenersText.getBoundingClientRect();
            const circlePosition = circle.getBoundingClientRect();
            
            const status = textVisible ? 'Visible' : 'No visible';
            const statusColor = textVisible ? 'green' : 'red';
            
            row.innerHTML = `
                <td style="border: 1px solid #ccc; padding: 4px;">${name}</td>
                <td style="border: 1px solid #ccc; padding: 4px;">${serverUrl}</td>
                <td style="border: 1px solid #ccc; padding: 4px;">${listenersText.textContent}</td>
                <td style="border: 1px solid #ccc; padding: 4px; color: ${statusColor};">${status}</td>
                <td style="border: 1px solid #ccc; padding: 4px;">
                    Text: X=${Math.round(textPosition.x)}, Y=${Math.round(textPosition.y)}<br>
                    Circle: X=${Math.round(circlePosition.x)}, Y=${Math.round(circlePosition.y)}
                </td>
            `;
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        debugContent.appendChild(table);
        
        // Añadir una opción para mostrar marcas de centrado
        const showCenterMarksBtn = document.createElement('button');
        showCenterMarksBtn.textContent = 'Mostrar marcas de centro';
        showCenterMarksBtn.style.margin = '10px 5px';
        showCenterMarksBtn.addEventListener('click', () => {
            toggleCenterMarks();
        });
        debugContent.appendChild(showCenterMarksBtn);
        
        // Mostrar mensaje resumiendo el análisis
        const summary = document.createElement('p');
        summary.innerHTML = `Total estaciones: ${circles.size}`;
        debugContent.appendChild(summary);
    }

    // Nueva función para mostrar/ocultar marcas de centrado
    function toggleCenterMarks() {
        // Comprobar si ya existen marcas
        const existingMarks = document.querySelectorAll('.center-mark');
        
        if (existingMarks.length > 0) {
            // Si ya existen, eliminarlas
            existingMarks.forEach(mark => mark.remove());
            return;
        }
        
        // Si no existen, crearlas
        circles.forEach(({ circle, listenersText }) => {
            const cx = parseFloat(circle.getAttribute('cx'));
            const cy = parseFloat(circle.getAttribute('cy'));
            const r = parseFloat(circle.getAttribute('r'));
            
            // Crear líneas que crucen el centro del círculo
            const centerMark = document.createElementNS("http://www.w3.org/2000/svg", 'g');
            centerMark.classList.add('center-mark');
            
            // Línea horizontal
            const hLine = document.createElementNS("http://www.w3.org/2000/svg", 'line');
            hLine.setAttribute('x1', cx - r);
            hLine.setAttribute('y1', cy);
            hLine.setAttribute('x2', cx + r);
            hLine.setAttribute('y2', cy);
            hLine.setAttribute('stroke', 'red');
            hLine.setAttribute('stroke-width', '1');
            centerMark.appendChild(hLine);
            
            // Línea vertical
            const vLine = document.createElementNS("http://www.w3.org/2000/svg", 'line');
            vLine.setAttribute('x1', cx);
            vLine.setAttribute('y1', cy - r);
            vLine.setAttribute('x2', cx);
            vLine.setAttribute('y2', cy + r);
            vLine.setAttribute('stroke', 'red');
            vLine.setAttribute('stroke-width', '1');
            centerMark.appendChild(vLine);
            
            // Añadir al mapa
            document.getElementById('map').appendChild(centerMark);
        });
    }
});
