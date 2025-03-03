/**
 * Módulo para mostrar notificaciones y mensajes al usuario
 */

/**
 * Muestra una notificación de tipo toast
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success, error, warning, info)
 * @param {number} duration - Duración en milisegundos
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Si ya existe la función en el ámbito global, usarla
    if (window.showToast && typeof window.showToast === 'function') {
        return window.showToast(message, type, duration);
    }
    
    // Obtener el contenedor de toasts
    let container = document.querySelector('.toast-container');
    
    // Si no existe, crearlo
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(container);
    }
    
    // Crear el elemento toast
    const toast = document.createElement('div');
    toast.className = 'toast show';
    toast.role = 'alert';
    toast.setAttribute('aria-live', 'assertive');
    toast.setAttribute('aria-atomic', 'true');
    
    // Establecer colores según el tipo
    const bgClass = getBgClassForType(type);
    const iconClass = getIconClassForType(type);
    
    // Contenido del toast
    toast.innerHTML = `
        <div class="toast-header ${bgClass} text-white">
            <i class="fas ${iconClass} me-2"></i>
            <strong class="me-auto">${getTypeTitle(type)}</strong>
            <small>Ahora</small>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    // Agregar al contenedor
    container.appendChild(toast);
    
    // Auto-ocultar después del tiempo
    setTimeout(() => {
        // Añadir clase para animación de salida
        toast.classList.add('hiding');
        
        // Eliminar después de la animación
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
    
    // Agregar controlador de eventos para el botón de cierre
    const closeBtn = toast.querySelector('.btn-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            toast.classList.add('hiding');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        });
    }
    
    return toast;
}

/**
 * Obtiene la clase de fondo para el tipo de notificación
 * @param {string} type - Tipo de notificación
 * @returns {string} - Clase CSS para el fondo
 */
function getBgClassForType(type) {
    switch (type) {
        case 'success':
            return 'bg-success';
        case 'error':
            return 'bg-danger';
        case 'warning':
            return 'bg-warning';
        case 'info':
        default:
            return 'bg-info';
    }
}

/**
 * Obtiene la clase de icono para el tipo de notificación
 * @param {string} type - Tipo de notificación
 * @returns {string} - Clase CSS del icono
 */
function getIconClassForType(type) {
    switch (type) {
        case 'success':
            return 'fa-check-circle';
        case 'error':
            return 'fa-exclamation-circle';
        case 'warning':
            return 'fa-exclamation-triangle';
        case 'info':
        default:
            return 'fa-info-circle';
    }
}

/**
 * Obtiene el título para el tipo de notificación
 * @param {string} type - Tipo de notificación
 * @returns {string} - Título para la notificación
 */
function getTypeTitle(type) {
    switch (type) {
        case 'success':
            return 'Éxito';
        case 'error':
            return 'Error';
        case 'warning':
            return 'Advertencia';
        case 'info':
        default:
            return 'Información';
    }
}

/**
 * Muestra una notificación de tipo alerta en el contenido principal
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de alerta (success, danger, warning, info)
 * @param {boolean} dismissible - Si la alerta se puede cerrar
 * @param {string} containerId - ID del contenedor donde mostrar la alerta
 * @param {number} duration - Duración en milisegundos (0 para no ocultar)
 * @returns {HTMLElement} - El elemento alerta creado
 */
function showAlert(message, type = 'info', dismissible = true, containerId = 'alertContainer', duration = 5000) {
    // Buscar o crear el contenedor
    let container = document.getElementById(containerId);
    if (!container) {
        // Si no existe, crear un contenedor en la parte superior del contenido
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'alert-container mb-3';
        
        // Agregar al contenido principal o al body si no hay contenido
        const contentEl = document.getElementById('content');
        if (contentEl) {
            contentEl.insertBefore(container, contentEl.firstChild);
        } else {
            document.body.insertBefore(container, document.body.firstChild);
        }
    }
    
    // Crear la alerta
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} ${dismissible ? 'alert-dismissible' : ''} fade show`;
    alert.role = 'alert';
    
    // Agregar ícono según el tipo
    const iconClass = getIconClassForType(type);
    
    // Contenido
    alert.innerHTML = `
        <i class="fas ${iconClass} me-2"></i>
        ${message}
        ${dismissible ? '<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>' : ''}
    `;
    
    // Agregar al contenedor
    container.appendChild(alert);
    
    // Auto-ocultar después del tiempo si se especifica
    if (duration > 0) {
        setTimeout(() => {
            alert.classList.remove('show');
            setTimeout(() => {
                if (alert.parentNode) {
                    alert.parentNode.removeChild(alert);
                }
            }, 300);
        }, duration);
    }
    
    return alert;
}

/**
 * Muestra una confirmación modal
 * @param {string} message - Mensaje a mostrar
 * @param {Function} onConfirm - Función a ejecutar al confirmar
 * @param {Function} onCancel - Función a ejecutar al cancelar
 * @param {string} title - Título del modal
 */
function showConfirm(message, onConfirm, onCancel = null, title = 'Confirmar acción') {
    // ID único para el modal
    const modalId = 'confirmModal' + Date.now();
    
    // Crear el modal
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = modalId;
    modal.tabIndex = -1;
    modal.setAttribute('aria-labelledby', `${modalId}Title`);
    modal.setAttribute('aria-hidden', 'true');
    
    // Contenido del modal
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="${modalId}Title">${title}</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>${message}</p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal" id="${modalId}CancelBtn">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="${modalId}ConfirmBtn">Confirmar</button>
                </div>
            </div>
        </div>
    `;
    
    // Agregar al body
    document.body.appendChild(modal);
    
    // Crear instancia de modal
    const modalInstance = new bootstrap.Modal(modal);
    
    // Asociar eventos
    document.getElementById(`${modalId}ConfirmBtn`).addEventListener('click', () => {
        modalInstance.hide();
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    });
    
    if (onCancel) {
        document.getElementById(`${modalId}CancelBtn`).addEventListener('click', () => {
            if (typeof onCancel === 'function') {
                onCancel();
            }
        });
    }
    
    // Eliminar el modal cuando se cierra
    modal.addEventListener('hidden.bs.modal', () => {
        document.body.removeChild(modal);
    });
    
    // Mostrar el modal
    modalInstance.show();
}

// Exponer funciones globalmente
window.showNotification = showNotification;
window.showAlert = showAlert;
window.showConfirm = showConfirm;

// Agregar estilos para notificaciones y alertas
const notifyStyles = document.createElement('style');
notifyStyles.textContent = `
.alert-container {
    position: relative;
    z-index: 1000;
}

.toast.hiding {
    opacity: 0;
    transition: opacity 0.3s ease-out;
}

/* Estilos para modo oscuro */
body.dark-mode .toast-header {
    background-color: #343a40;
    color: #f8f9fa;
}

body.dark-mode .toast-body {
    background-color: #343a40;
    color: #f8f9fa;
}

.toast-container > .toast {
    min-width: 250px;
}
`;

document.head.appendChild(notifyStyles);