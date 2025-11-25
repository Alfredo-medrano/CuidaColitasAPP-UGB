import { Dimensions, Platform } from 'react-native';
import moment from 'moment';

/**
 * Funciones auxiliares generales
 * Utilidades que no encajan en otras categorías
 */

/**
 * Dimensiones responsivas basadas en ancho de pantalla
 */
const { width, height } = Dimensions.get('window');
const guidelineBaseWidth = 375; // iPhone X width
const guidelineBaseHeight = 812; // iPhone X height

/**
 * Calcula tamaño responsivo basado en ancho de pantalla
 * @param {number} size - Tamaño base
 * @returns {number} Tamaño responsivo
 */
export const responsiveSize = (size) => {
    return (width / guidelineBaseWidth) * size;
};

/**
 * Calcula tamaño responsivo vertical
 * @param {number} size - Tamaño base
 * @returns {number} Tamaño responsivo vertical
 */
export const responsiveHeight = (size) => {
    return (height / guidelineBaseHeight) * size;
};

/**
 * Verifica si es dispositivo pequeño (< 375px)
 * @returns {boolean}
 */
export const isSmallDevice = () => {
    return width < 375;
};

/**
 * Verifica si es tablet
 * @returns {boolean}
 */
export const isTablet = () => {
    return width >= 768;
};

/**
 * Obtiene iniciales de un nombre
 * @param {string} name - Nombre completo
 * @returns {string} Iniciales (máximo 2 letras)
 */
export const getInitials = (name) => {
    if (!name) return '??';

    const parts = name.trim().split(' ').filter(p => p.length > 0);

    if (parts.length === 0) return '??';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();

    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Trunca texto largo
 * @param {string} text - Texto a truncar
 * @param {number} maxLength - Longitud máxima
 * @returns {string} Texto truncado con ...
 */
export const truncateText = (text, maxLength = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength)}...`;
};

/**
 * Calcula edad a partir de fecha de nacimiento
 * @param {Date|string} birthDate - Fecha de nacimiento
 * @returns {string} Edad formateada
 */
export const calculateAge = (birthDate) => {
    if (!birthDate) return 'Edad desconocida';

    const today = moment();
    const birth = moment(birthDate);
    const years = today.diff(birth, 'years');

    if (years === 0) {
        const months = today.diff(birth, 'months');
        if (months === 0) {
            const days = today.diff(birth, 'days');
            return `${days} ${days === 1 ? 'día' : 'días'}`;
        }
        return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    }

    return `${years} ${years === 1 ? 'año' : 'años'}`;
};

/**
 * Calcula edad en años (número)
 * @param {Date|string} birthDate - Fecha de nacimiento
 * @returns {number} Años de edad
 */
export const calculateAgeInYears = (birthDate) => {
    if (!birthDate) return 0;
    return moment().diff(moment(birthDate), 'years');
};

/**
 * Verifica si una fecha es pasada
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean}
 */
export const isPastDate = (date) => {
    return moment(date).isBefore(moment(), 'day');
};

/**
 * Verifica si una fecha es futura
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean}
 */
export const isFutureDate = (date) => {
    return moment(date).isAfter(moment(), 'day');
};

/**
 * Verifica si una fecha es hoy
 * @param {Date|string} date - Fecha a verificar
 * @returns {boolean}
 */
export const isToday = (date) => {
    return moment(date).isSame(moment(), 'day');
};

/**
 * Debounce function - retrasa ejecución
 * @param {Function} func - Función a ejecutar
 * @param {number} wait - Milisegundos de espera
 * @returns {Function} Función con debounce
 */
export const debounce = (func, wait = 300) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Throttle function - limita frecuencia de ejecución
 * @param {Function} func - Función a ejecutar
 * @param {number} limit - Milisegundos mínimos entre ejecuciones
 * @returns {Function} Función con throttle
 */
export const throttle = (func, limit = 300) => {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

/**
 * Genera ID único simple
 * @returns {string} ID único
 */
export const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Verifica si un valor está vacío (null, undefined, '', [])
 * @param {any} value - Valor a verificar
 * @returns {boolean}
 */
export const isEmpty = (value) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

/**
 * Obtiene valor seguro de objeto anidado
 * @param {Object} obj - Objeto
 * @param {string} path - Ruta (ej: 'user.profile.name')
 * @param {any} defaultValue - Valor por defecto
 * @returns {any} Valor encontrado o default
 */
export const getNestedValue = (obj, path, defaultValue = null) => {
    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = result[key];
        } else {
            return defaultValue;
        }
    }

    return result !== undefined ? result : defaultValue;
};

/**
 * Agrupa array por propiedad
 * @param {Array} array - Array a agrupar
 * @param {string} key - Propiedad por la cual agrupar
 * @returns {Object} Objeto agrupado
 */
export const groupBy = (array, key) => {
    if (!Array.isArray(array)) return {};

    return array.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
};

/**
 * Ordena array por propiedad
 * @param {Array} array - Array a ordenar
 * @param {string} key - Propiedad por la cual ordenar
 * @param {string} order - 'asc' o 'desc'
 * @returns {Array} Array ordenado
 */
export const sortBy = (array, key, order = 'asc') => {
    if (!Array.isArray(array)) return [];

    return [...array].sort((a, b) => {
        const aVal = getNestedValue(a, key);
        const bVal = getNestedValue(b, key);

        if (aVal === bVal) return 0;

        const comparison = aVal < bVal ? -1 : 1;
        return order === 'asc' ? comparison : -comparison;
    });
};

/**
 * Elimina duplicados de array
 * @param {Array} array - Array con posibles duplicados
 * @param {string} key - Propiedad única (opcional)
 * @returns {Array} Array sin duplicados
 */
export const removeDuplicates = (array, key = null) => {
    if (!Array.isArray(array)) return [];

    if (!key) {
        return [...new Set(array)];
    }

    const seen = new Set();
    return array.filter(item => {
        const value = getNestedValue(item, key);
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
    });
};

/**
 * Genera color aleatorio en hex
 * @returns {string} Color hex
 */
export const randomColor = () => {
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
};

/**
 * Obtiene contraste de color (blanco o negro)
 * @param {string} hexColor - Color en hex
 * @returns {string} '#FFFFFF' o '#000000'
 */
export const getContrastColor = (hexColor) => {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calcular luminosidad
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

/**
 * Sleep/delay asíncrono
 * @param {number} ms - Milisegundos a esperar
 * @returns {Promise}
 */
export const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Retry automático de función asíncrona
 * @param {Function} fn - Función a ejecutar
 * @param {number} retries - Número de reintentos
 * @param {number} delay - Delay entre reintentos (ms)
 * @returns {Promise} Resultado de la función
 */
export const retryAsync = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn();
    } catch (error) {
        if (retries === 0) throw error;
        await sleep(delay);
        return retryAsync(fn, retries - 1, delay);
    }
};

/**
 * Copia texto al clipboard (requiere expo-clipboard)
 * @param {string} text - Texto a copiar
 * @param {Object} Clipboard - Módulo de Clipboard
 * @returns {Promise<boolean>}
 */
export const copyToClipboard = async (text, Clipboard) => {
    try {
        await Clipboard.setStringAsync(text);
        return true;
    } catch (error) {
        console.error('Error copying to clipboard:', error);
        return false;
    }
};

/**
 * Verifica si es plataforma iOS
 * @returns {boolean}
 */
export const isIOS = () => {
    return Platform.OS === 'ios';
};

/**
 * Verifica si es plataforma Android
 * @returns {boolean}
 */
export const isAndroid = () => {
    return Platform.OS === 'android';
};

/**
 * Obtiene versión de plataforma
 * @returns {number|string}
 */
export const getPlatformVersion = () => {
    return Platform.Version;
};

