document.addEventListener('DOMContentLoaded', function() {
    // Manejador del botón de actualización
    const refreshBtn = document.getElementById('refreshDataBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            // Mostrar un spinner mientras se actualiza
            const originalContent = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Actualizando...';
            this.disabled = true;
            
            // Recargar la página actual
            setTimeout(() => {
                window.location.reload();
            }, 500);
        });
    }
    
    // Manejador del cambio de tema oscuro/claro
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeIcon');
    const themeText = document.getElementById('themeText');
    
    if (themeToggleBtn) {
        // Comprobar si hay una preferencia guardada
        const darkMode = localStorage.getItem('darkMode') === 'true';
        
        // Aplicar tema inicial
        if (darkMode) {
            document.body.classList.add('dark-mode');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            themeText.textContent = 'Modo Claro';
        }
        
        themeToggleBtn.addEventListener('click', function() {
            document.body.classList.toggle('dark-mode');
            const isDarkMode = document.body.classList.contains('dark-mode');
            
            // Actualizar icono y texto
            if (isDarkMode) {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
                themeText.textContent = 'Modo Claro';
            } else {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
                themeText.textContent = 'Modo Oscuro';
            }
            
            // Guardar preferencia
            localStorage.setItem('darkMode', isDarkMode);
            
            // Notificar cambio
            showToast('Tema cambiado', isDarkMode ? 'Modo oscuro activado' : 'Modo claro activado');
        });
    }
    
    // Inicializar todos los tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Inicializar DataTables si existen
    if (typeof $.fn.DataTable !== 'undefined') {
        $('.datatable').each(function() {
            $(this).DataTable({
                language: {
                    url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
                },
                responsive: true
            });
        });
    }
});

// Función para mostrar notificaciones toast
function showToast(title, message, type = 'info') {
    const toastEl = document.getElementById('liveToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMessage = document.getElementById('toastMessage');
    const toastTime = document.getElementById('toastTime');
    
    if (toastEl && toastTitle && toastMessage && toastTime) {
        // Configurar el toast
        toastTitle.textContent = title;
        toastMessage.textContent = message;
        toastTime.textContent = new Date().toLocaleTimeString();
        
        // Clases según el tipo
        toastEl.className = 'toast';
        if (type === 'success') toastEl.classList.add('bg-success', 'text-white');
        else if (type === 'danger') toastEl.classList.add('bg-danger', 'text-white');
        else if (type === 'warning') toastEl.classList.add('bg-warning');
        else toastEl.classList.add('bg-info', 'text-white');
        
        // Mostrar el toast
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    }
}

// Funciones para depuración
function debugIcecastData() {
    fetch('api/icecast-debug.php')
        .then(response => response.json())
        .then(data => {
            console.log('Datos del servidor Icecast:', data);
            showToast('Depuración', 'Datos del servidor mostrados en consola', 'info');
        })
        .catch(error => {
            console.error('Error obteniendo datos:', error);
            showToast('Error', 'No se pudieron obtener los datos del servidor', 'danger');
        });
}
