/**
 * Script específico para el módulo de estaciones
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tooltip de Bootstrap
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Inicializar DataTable solo si no estamos usando la búsqueda personalizada
    if (!document.getElementById('stationSearch')) {
        $('.datatable').DataTable({
            language: {
                url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/es-ES.json'
            },
            responsive: true,
            order: [[0, 'asc'], [3, 'desc']] // Ordenar primero por estado (online primero) y luego por oyentes (descendente)
        });
    }
    
    // Cuando cambia el filtro en el select
    const filterSelect = document.getElementById('filterSelect');
    if (filterSelect) {
        filterSelect.addEventListener('change', function() {
            window.location.href = 'index.php?module=stations&filter=' + this.value;
        });
    }
    
    // Funcionalidad para actualizar estaciones
    const refreshStationsBtn = document.getElementById('refreshStationsBtn');
    if (refreshStationsBtn) {
        refreshStationsBtn.addEventListener('click', function() {
            this.disabled = true;
            this.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i> Actualizando...';
            
            // Llamada ajax para actualizar datos (puedes implementarla si lo necesitas)
            setTimeout(() => {
                window.location.reload();
            }, 500);
        });
    }
    
    // Limpiar parámetros innecesarios de la URL para evitar problemas de redirección
    // Esta función elimina el parámetro view=all si existe, manteniendo el resto de parámetros
    function cleanUrl() {
        if (window.location.href.includes('view=all')) {
            const url = new URL(window.location.href);
            url.searchParams.delete('view');
            window.history.replaceState({}, document.title, url.toString());
        }
    }
    
    // Ejecutar limpieza de URL
    cleanUrl();
});
