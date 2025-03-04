/**
 * Utilidades para manejo de fechas con zona horaria de Colombia
 */

// Constantes para la zona horaria de Colombia
const COLOMBIA_TIMEZONE = 'America/Bogota';
const COLOMBIA_LOCALE = 'es-CO';

/**
 * Formatea una fecha y hora para mostrar en zona horaria colombiana
 * @param {number} timestamp - Timestamp Unix
 * @param {boolean} includeSeconds - Si se incluyen segundos en el formato
 * @returns {string} - Fecha y hora formateada
 */
function formatDateTime(timestamp, includeSeconds = false) {
    const date = new Date(timestamp * 1000);
    
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: COLOMBIA_TIMEZONE
    };
    
    if (includeSeconds) {
        options.second = '2-digit';
    }
    
    return new Intl.DateTimeFormat(COLOMBIA_LOCALE, options).format(date);
}

/**
 * Formatea una fecha para mostrar en zona horaria colombiana
 * @param {Date} date - Objeto Date
 * @returns {string} - Fecha formateada como YYYY-MM-DD
 */
function formatDate(date) {
    if (!date || !(date instanceof Date) || isNaN(date)) {
        return '';
    }
    
    // Convertir a zona horaria de Colombia
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: COLOMBIA_TIMEZONE
    };
    
    const parts = new Intl.DateTimeFormat('en-CA', options).formatToParts(date);
    const formatParts = {};
    
    for (const part of parts) {
        formatParts[part.type] = part.value;
    }
    
    return `${formatParts.year}-${formatParts.month}-${formatParts.day}`;
}

/**
 * Obtiene la hora actual en Colombia formateada
 * @param {boolean} includeSeconds - Si se incluyen segundos
 * @returns {string} - Hora formateada
 */
function getCurrentColombiaTime(includeSeconds = false) {
    const now = new Date();
    const options = {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: COLOMBIA_TIMEZONE
    };
    
    if (includeSeconds) {
        options.second = '2-digit';
    }
    
    return new Intl.DateTimeFormat(COLOMBIA_LOCALE, options).format(now);
}

/**
 * Formatea una fecha para gráficos (corta) en zona horaria colombiana
 * @param {Date} date - Fecha a formatear
 * @param {string} format - Formato a usar ('time', 'weekday', 'month')
 * @returns {string} - Fecha formateada
 */
function formatDateForChart(date, format = 'weekday') {
    if (!date || !(date instanceof Date) || isNaN(date)) {
        return '';
    }
    
    const options = { timeZone: COLOMBIA_TIMEZONE };
    
    switch (format) {
        case 'time':
            options.hour = '2-digit';
            options.minute = '2-digit';
            break;
            
        case 'weekday':
            options.weekday = 'short';
            options.day = 'numeric';
            break;
            
        case 'month':
            options.day = 'numeric';
            options.month = 'short';
            break;
            
        default:
            options.day = 'numeric';
            options.month = 'short';
    }
    
    return new Intl.DateTimeFormat(COLOMBIA_LOCALE, options).format(date);
}

/**
 * Obtiene el texto descriptivo del rango de fechas actual (Colombia)
 * @param {string} range - Identificador del rango ('day', 'week', 'month', 'custom')
 * @param {string} startDate - Fecha de inicio para rango personalizado
 * @param {string} endDate - Fecha de fin para rango personalizado
 * @returns {string} - Texto descriptivo
 */
function getDateRangeText(range, startDate, endDate) {
    const now = new Date();
    
    switch (range) {
        case 'day':
            return `Hoy (${formatDate(now)})`;
        case 'week':
            const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return `Últimos 7 días (${formatDate(weekStart)} a ${formatDate(now)})`;
        case 'month':
            const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return `Últimos 30 días (${formatDate(monthStart)} a ${formatDate(now)})`;
        case 'custom':
            return `${startDate} a ${endDate}`;
        default:
            return 'Personalizado';
    }
}

// Exportar funciones para uso global
window.formatDateTime = formatDateTime;
window.formatDate = formatDate;
window.getCurrentColombiaTime = getCurrentColombiaTime;
window.formatDateForChart = formatDateForChart;
window.getDateRangeText = getDateRangeText;
