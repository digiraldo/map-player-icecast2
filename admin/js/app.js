/**
 * Script principal del panel de administración
 */

// Configuración global
const Config = {
    updateInterval: 5000,  // 5 segundos para actualización
    apiBase: './api/',     // Asegurarse de que termina con barra, pero no empiece con ella
    currentSection: 'dashboard',
    stationInfo: {
        logo: '',
        name: ''
    }
};

// Variable para el intervalo de actualización
let updateTimer = null;

// Cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Cargar información de la estación
    loadStationInfo();
    
    // Iniciar el panel
    initializeAdmin();
    
    // Configurar navegación
    setupNavigation();
    
    // Botón de actualizar
    document.getElementById('refreshBtn').addEventListener('click', function() {
        refreshCurrentSection();
        
        // Indicación visual de actualización
        this.disabled = true;
        this.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Actualizando...';
        
        setTimeout(() => {
            this.disabled = false;
            this.innerHTML = '<i class="fas fa-sync-alt me-1"></i> Actualizar';
        }, 1000);
    });
    
    // Toggle de tema oscuro/claro
    document.getElementById('themeToggleBtn').addEventListener('click', toggleTheme);
    
    // Cargar tema guardado
    loadSavedTheme();
    
    // Confirmar antes de cerrar sesión
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        if (confirm('¿Está seguro de que desea cerrar sesión?')) {
            window.location.href = 'logout.php';
        }
    });
});

/**
 * Inicializa el panel de administración
 */
function initializeAdmin() {
    // Cargar dashboard por defecto
    loadSection('dashboard');
}

/**
 * Configura los eventos de navegación
 */
function setupNavigation() {
    // Enlaces del sidebar
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Obtener la sección a cargar
            const section = this.getAttribute('data-section');
            
            // Actualizar navegación
            navLinks.forEach(el => el.classList.remove('active'));
            this.classList.add('active');
            
            // Cargar la sección
            loadSection(section);
        });
    });
}

/**
 * Carga una sección específica
 * @param {string} section - Nombre de la sección a cargar
 */
function loadSection(section) {
    // Detener actualizaciones anteriores
    if (updateTimer) {
        clearInterval(updateTimer);
        updateTimer = null;
    }
    
    // Actualizar sección actual
    Config.currentSection = section;
    
    // Actualizar título
    updatePageTitle(section);
    
    // Mostrar loader
    showLoader();
    
    // Cargar contenido según la sección
    switch (section) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'stations':
            loadStations();
            break;
        case 'config':
            loadConfig();
            break;
        case 'statistics':
            loadStatistics();
            break;
        default:
            document.getElementById('content').innerHTML = '<div class="alert alert-danger">Sección no encontrada</div>';
    }
}

/**
 * Actualiza el título de la página según la sección
 * @param {string} section - Nombre de la sección
 */
function updatePageTitle(section) {
    const titleEl = document.getElementById('page-title');
    let icon = 'fa-tachometer-alt';
    let title = 'Dashboard';
    
    switch (section) {
        case 'dashboard':
            icon = 'fa-tachometer-alt';
            title = 'Dashboard';
            break;
        case 'stations':
            icon = 'fa-broadcast-tower';
            title = 'Gestión de Estaciones';
            break;
        case 'config':
            icon = 'fa-cogs';
            title = 'Configuración';
            break;
        case 'statistics':
            icon = 'fa-chart-bar';
            title = 'Estadísticas';
            break;
    }
    
    titleEl.innerHTML = `<i class="fas ${icon} me-2"></i>${title}`;
}

/**
 * Muestra un loader en el contenido
 */
function showLoader() {
    document.getElementById('content').innerHTML = `
        <div class="loader-container">
            <div class="loader"></div>
        </div>
    `;
}

/**
 * Refresca la sección actual
 */
function refreshCurrentSection() {
    loadSection(Config.currentSection);
}

/**
 * Carga la sección de Dashboard
 */
function loadDashboard() {
    fetchData('get-listeners.php').then(data => {
        if (data.error) {
            showError(data.message || 'Error al cargar los datos');
            return;
        }
        
        renderDashboard(data);
        
        // Configurar actualización automática
        if (updateTimer) clearInterval(updateTimer);
        updateTimer = setInterval(() => {
            updateDashboardData();
        }, Config.updateInterval);
    }).catch(error => {
        showError('Error al cargar el dashboard: ' + error.message);
    });
}

/**
 * Realiza petición para obtener datos de la API
 * @param {string} endpoint - Endpoint de la API a consultar
 * @returns {Promise<Object>} - Datos de la respuesta
 */
async function fetchData(endpoint, options = {}) {
    try {
        const response = await fetch(Config.apiBase + endpoint, options);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error en la petición:', error);
        throw error;
    }
}

/**
 * Muestra un mensaje de error
 * @param {string} message - Mensaje de error
 */
function showError(message) {
    const contentEl = document.getElementById('content');
    contentEl.innerHTML = `
        <div class="alert alert-danger">
            <i class="fas fa-exclamation-circle me-2"></i>
            ${message}
        </div>
    `;
}

/**
 * Alterna entre tema claro y oscuro
 */
function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    if (body.classList.contains('dark-mode')) {
        // Cambiar a modo claro
        body.classList.remove('dark-mode');
        themeIcon.className = 'fas fa-moon me-1';
        themeText.textContent = 'Modo Oscuro';
        localStorage.setItem('theme', 'light'); // Usar la misma clave 'theme' que el mapa
    } else {
        // Cambiar a modo oscuro
        body.classList.add('dark-mode');
        themeIcon.className = 'fas fa-sun me-1';
        themeText.textContent = 'Modo Claro';
        localStorage.setItem('theme', 'dark'); // Usar la misma clave 'theme' que el mapa
    }
    
    // Emitir evento de cambio de tema para actualizar componentes
    document.dispatchEvent(new CustomEvent('themeChanged'));
}

/**
 * Carga el tema guardado
 */
function loadSavedTheme() {
    const savedTheme = localStorage.getItem('theme'); // Usar la misma clave 'theme' que el mapa
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeIcon.className = 'fas fa-sun me-1';
        themeText.textContent = 'Modo Claro';
    } else if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        themeIcon.className = 'fas fa-moon me-1';
        themeText.textContent = 'Modo Oscuro';
    }
    // Si no hay tema guardado, usar el tema predeterminado (claro)
}

/**
 * Carga la información de la estación para el sidebar
 */
function loadStationInfo() {
    fetch(Config.apiBase + 'get-config.php')
        .then(response => response.json())
        .then(data => {
            if (!data.error) {
                // Guardar la información en el objeto de configuración
                Config.stationInfo.logo = data.reproductor.url_logo || '';
                Config.stationInfo.name = data.reproductor.estacion || '';
                
                // Actualizar el sidebar
                updateSidebarInfo();
            }
        })
        .catch(error => {
            console.error('Error al cargar la información de la estación:', error);
        });
}

/**
 * Actualiza el sidebar con la información de la estación
 */
function updateSidebarInfo() {
    const sidebarLogo = document.getElementById('sidebar-logo');
    const sidebarTitle = document.getElementById('sidebar-title');
    
    if (sidebarLogo) {
        // Si hay una URL de logo, usarla; de lo contrario, usar el logo predeterminado
        if (Config.stationInfo.logo && Config.stationInfo.logo.trim() !== '') {
            sidebarLogo.src = Config.stationInfo.logo;
        } else {
            sidebarLogo.src = '../img/DiGiraldo-Logo.png';
        }
        
        // Actualizar el atributo alt
        sidebarLogo.alt = Config.stationInfo.name || 'Logo DiGiraldo';
        
        // Asegurarse de que mantiene el tamaño correcto
        sidebarLogo.style.maxWidth = '60px';
        sidebarLogo.style.maxHeight = '60px';
        sidebarLogo.style.objectFit = 'contain';
    }
    
    if (sidebarTitle) {
        // Si hay un nombre de estación, usarlo; de lo contrario, mostrar el texto por defecto
        sidebarTitle.textContent = Config.stationInfo.name || 'Desarrollado por DiGiraldo';
    }
}

/**
 * Carga la sección de estadísticas
 */
function loadStatistics() {
    fetchData('get-statistics.php').then(data => {
        if (data.error) {
            showError(data.message || 'Error al cargar los datos');
            return;
        }
        
        renderStatistics(data);
        
        // Configurar actualización automática
        if (updateTimer) clearInterval(updateTimer);
        updateTimer = setInterval(() => {
            updateStatisticsData();
        }, Config.updateInterval);
    }).catch(error => {
        showError('Error al cargar las estadísticas: ' + error.message);
    });
}

/**
 * Renderiza los datos de estadísticas en la interfaz
 * @param {Object} data - Datos de estadísticas
 */
function renderStatistics(data) {
    const contentEl = document.getElementById('content');
    contentEl.innerHTML = `
        <div class="statistics-container">
            <h2>Estadísticas</h2>
            <p>Usuarios activos: ${data.activeUsers}</p>
            <p>Sesiones iniciadas: ${data.sessions}</p>
            <p>Tiempo promedio de sesión: ${data.avgSessionTime} minutos</p>
        </div>
    `;
}

/**
 * Actualiza los datos de estadísticas
 */
function updateStatisticsData() {
    fetchData('get-statistics.php').then(data => {
        if (data.error) {
            showError(data.message || 'Error al cargar los datos');
            return;
        }
        
        renderStatistics(data);
    }).catch(error => {
        showError('Error al actualizar las estadísticas: ' + error.message);
    });
}
