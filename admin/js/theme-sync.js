/**
 * Script para sincronizar el tema entre diferentes partes de la aplicación
 */

// Función para monitorear cambios en el localStorage
function syncThemeAcrossTabs() {
    let previousTheme = localStorage.getItem('theme');
    
    // Revisar cada segundo si ha cambiado el tema en otro tab/ventana
    setInterval(() => {
        const currentTheme = localStorage.getItem('theme');
        
        if (previousTheme !== currentTheme) {
            console.log('Theme changed from:', previousTheme, 'to:', currentTheme);
            // El tema cambió en otra ventana, actualizar la UI
            previousTheme = currentTheme;
            applyThemeFromStorage();
        }
    }, 1000);
    
    // Aplicar el tema inicial
    applyThemeFromStorage();
}

// Aplicar el tema desde localStorage
function applyThemeFromStorage() {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    console.log('Applying theme:', savedTheme);
    
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        if (themeIcon && themeText) {
            themeIcon.className = 'fas fa-sun me-1';
            themeText.textContent = 'Modo Claro';
        }
    } else {
        body.classList.remove('dark-mode');
        if (themeIcon && themeText) {
            themeIcon.className = 'fas fa-moon me-1';
            themeText.textContent = 'Modo Oscuro';
        }
    }
    
    // Forzar refresco de estilos en caso de problemas con CSS
    const sidebar = document.getElementById('sidebarMenu');
    if (sidebar) {
        sidebar.style.transition = 'none';
        if (savedTheme === 'dark') {
            sidebar.style.backgroundColor = '#212529';
        } else {
            sidebar.style.backgroundColor = '#f8f9fa';
        }
        setTimeout(() => {
            sidebar.style.transition = 'all 0.3s ease';
        }, 50);
    }
}

// Iniciar la sincronización cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', syncThemeAcrossTabs);
