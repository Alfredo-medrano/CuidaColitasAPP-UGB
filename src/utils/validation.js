/**
 * Validación de entrada siguiendo ISO 25012 (Calidad de Datos)
 * Todas las funciones de validación para inputs de usuario
 */

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} True si es válido
 */
export const validateEmail = (email) => {
    if (!email) return false;
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

/**
 * Valida número de teléfono
 * Acepta formatos: 2222-2222, 7777-7777, etc.
 * @param {string} phone - Teléfono a validar
 * @returns {boolean} True si es válido
 */
export const validatePhone = (phone) => {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 8 && cleaned.length <= 15;
};

/**
 * Valida contraseña segura
 * Requisitos: Mínimo 8 caracteres, 1 mayúscula, 1 minúscula, 1 número
 * @param {string} password - Contraseña a validar
 * @returns {boolean} True si es válida
 */
export const validatePassword = (password) => {
    if (!password) return false;
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return re.test(password);
};

/**
 * Obtiene mensaje de error para contraseña inválida
 * @param {string} password - Contraseña a validar
 * @returns {string|null} Mensaje de error o null si es válida
 */
export const getPasswordError = (password) => {
    if (!password) return 'La contraseña es requerida';
    if (password.length < 8) return 'Mínimo 8 caracteres';
    if (!/[a-z]/.test(password)) return 'Debe contener al menos una minúscula';
    if (!/[A-Z]/.test(password)) return 'Debe contener al menos una mayúscula';
    if (!/\d/.test(password)) return 'Debe contener al menos un número';
    return null;
};

/**
 * Sanitiza input de usuario para prevenir inyección
 * @param {string} input - Input a sanitizar
 * @returns {string} Input sanitizado
 */
export const sanitizeInput = (input) => {
    if (!input) return '';
    return String(input)
        .trim()
        .replace(/[<>]/g, ''); // Prevenir XSS básico
};

/**
 * Valida que un string no esté vacío
 * @param {string} value - Valor a validar
 * @returns {boolean} True si no está vacío
 */
export const validateRequired = (value) => {
    return value !== null && value !== undefined && String(value).trim().length > 0;
};

/**
 * Valida tipo de archivo permitido
 * @param {string} mimeType - Tipo MIME del archivo
 * @param {string[]} allowedTypes - Tipos permitidos
 * @returns {boolean} True si es permitido
 */
export const validateFileType = (mimeType, allowedTypes = []) => {
    if (!mimeType || !allowedTypes.length) return false;
    return allowedTypes.some(type => mimeType.includes(type));
};

/**
 * Valida tamaño de archivo
 * @param {number} sizeBytes - Tamaño en bytes
 * @param {number} maxMB - Tamaño máximo en MB
 * @returns {boolean} True si está dentro del límite
 */
export const validateFileSize = (sizeBytes, maxMB = 10) => {
    if (!sizeBytes || sizeBytes <= 0) return false;
    return sizeBytes <= maxMB * 1024 * 1024;
};

/**
 * Valida edad mínima
 * @param {Date|string} birthDate - Fecha de nacimiento
 * @param {number} minAge - Edad mínima requerida
 * @returns {boolean} True si cumple edad mínima
 */
export const validateMinAge = (birthDate, minAge = 18) => {
    if (!birthDate) return false;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age >= minAge;
};

/**
 * Valida formato de fecha
 * @param {string} dateString - Fecha en string
 * @returns {boolean} True si es fecha válida
 */
export const validateDate = (dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date);
};

/**
 * Valida que una fecha sea futura
 * @param {Date|string} date - Fecha a validar
 * @returns {boolean} True si es fecha futura
 */
export const validateFutureDate = (date) => {
    if (!date) return false;
    const checkDate = new Date(date);
    const now = new Date();
    return checkDate > now;
};

/**
 * Valida longitud de texto
 * @param {string} text - Texto a validar
 * @param {number} min - Longitud mínima
 * @param {number} max - Longitud máxima
 * @returns {boolean} True si está en rango
 */
export const validateLength = (text, min = 0, max = Infinity) => {
    if (!text) return min === 0;
    const length = String(text).length;
    return length >= min && length <= max;
};
