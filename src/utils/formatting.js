import moment from 'moment';
import 'moment/locale/es';

/**
 * Formateo consistente de datos (ISO 25012)
 * Todas las funciones de formateo para mostrar datos al usuario
 */

// Configurar moment en español
moment.locale('es');

/**
 * Formatea fecha en formato corto
 * @param {Date|string} date - Fecha a formatear
 * @param {string} format - Formato deseado (default: DD/MM/YYYY)
 * @returns {string} Fecha formateada
 */
export const formatDate = (date, format = 'DD/MM/YYYY') => {
    if (!date) return 'N/A';
    return moment(date).format(format);
};

/**
 * Formatea fecha y hora
 * @param {Date|string} datetime - Fecha/hora a formatear
 * @returns {string} Fecha/hora formateada
 */
export const formatDateTime = (datetime) => {
    if (!datetime) return 'N/A';
    return moment(datetime).format('DD/MM/YYYY HH:mm');
};

/**
 * Formatea fecha de manera relativa (hace X tiempo)
 * @param {Date|string} datetime - Fecha a formatear
 * @returns {string} Tiempo relativo
 */
export const formatRelativeTime = (datetime) => {
    if (!datetime) return 'N/A';
    return moment(datetime).fromNow();
};

/**
 * Formatea hora en formato 12h
 * @param {Date|string} datetime - Fecha/hora a formatear
 * @returns {string} Hora formateada
 */
export const formatTime = (datetime) => {
    if (!datetime) return 'N/A';
    return moment(datetime).format('h:mm A');
};

/**
 * Formatea número de teléfono
 * @param {string} phone - Teléfono a formatear
 * @returns {string} Teléfono formateado
 */
export const formatPhone = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');

    // Formato El Salvador: 2222-2222 o 7777-7777
    if (cleaned.length === 8) {
        return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    }

    // Formato internacional
    if (cleaned.length === 11) {
        return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
    }

    return phone;
};

/**
 * Formatea tamaño de archivo
 * @param {number} bytes - Tamaño en bytes
 * @param {number} decimals - Decimales a mostrar
 * @returns {string} Tamaño formateado
 */
export const formatFileSize = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Capitaliza primera letra de cada palabra
 * @param {string} str - String a capitalizar
 * @returns {string} String capitalizado
 */
export const capitalize = (str) => {
    if (!str) return '';
    return str
        .toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

/**
 * Capitaliza solo primera letra
 * @param {string} str - String a capitalizar
 * @returns {string} String capitalizado
 */
export const capitalizeFirst = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Formatea nombre completo
 * @param {string} firstName - Nombre
 * @param {string} lastName - Apellido
 * @returns {string} Nombre completo formateado
 */
export const formatFullName = (firstName, lastName) => {
    const parts = [];
    if (firstName) parts.push(capitalize(firstName));
    if (lastName) parts.push(capitalize(lastName));
    return parts.join(' ') || 'Sin nombre';
};

/**
 * Formatea número con separador de miles
 * @param {number} num - Número a formatear
 * @param {number} decimals - Decimales a mostrar
 * @returns {string} Número formateado
 */
export const formatNumber = (num, decimals = 0) => {
    if (num === null || num === undefined) return '0';
    return Number(num).toLocaleString('es-SV', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

/**
 * Formatea moneda (dólares)
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada
 */
export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return '$0.00';
    return `$${formatNumber(amount, 2)}`;
};

/**
 * Trunca texto largo
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado
 */
export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
};

/**
 * Formatea peso con unidad
 * @param {number} weightKg - Peso en kilogramos
 * @returns {string} Peso formateado
 */
export const formatWeight = (weightKg) => {
    if (!weightKg || weightKg === 0) return 'N/A';
    return `${formatNumber(weightKg, 2)} kg`;
};

/**
 * Formatea porcentaje
 * @param {number} value - Valor a formatear
 * @param {number} decimals - Decimales a mostrar
 * @returns {string} Porcentaje formateado
 */
export const formatPercentage = (value, decimals = 0) => {
    if (value === null || value === undefined) return '0%';
    return `${formatNumber(value, decimals)}%`;
};

/**
 * Obtiene iniciales de un nombre
 * @param {string} name - Nombre completo
 * @returns {string} Iniciales
 */
export const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.trim().split(' ').filter(p => p.length > 0);

    if (parts.length === 0) return '??';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Formatea día de la semana
 * @param {Date|string} date - Fecha
 * @returns {string} Día de la semana
 */
export const formatDayOfWeek = (date) => {
    if (!date) return 'N/A';
    return moment(date).format('dddd');
};

/**
 * Formatea mes y año
 * @param {Date|string} date - Fecha
 * @returns {string} Mes y año
 */
export const formatMonthYear = (date) => {
    if (!date) return 'N/A';
    return moment(date).format('MMMM YYYY');
};
