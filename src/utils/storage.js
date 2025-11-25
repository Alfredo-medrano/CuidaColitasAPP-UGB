import { Alert } from 'react-native';
import { SIGNED_URL_EXPIRY_SECONDS } from './constants';

/**
 * Utilidades para manejo de Supabase Storage
 * Funciones reutilizables para upload, download y delete de archivos
 */

/**
 * Sube un archivo a Supabase Storage
 * @param {Object} supabase - Cliente de Supabase
 * @param {Object} params - Parámetros de upload
 * @param {string} params.bucket - Nombre del bucket
 * @param {Object} params.file - Objeto del archivo con uri, name, mimeType
 * @param {string} params.filePath - Ruta donde guardar el archivo
 * @param {Function} params.onProgress - Callback de progreso (opcional)
 * @returns {Promise<Object>} {success: boolean, data?: any, error?: any}
 */
export const uploadFileToStorage = async (supabase, {
    bucket,
    file,
    filePath,
    onProgress
}) => {
    try {
        if (!file || !file.uri) {
            throw new Error('Archivo inválido');
        }

        // Leer archivo como Blob
        const response = await fetch(file.uri);
        const blob = await response.blob();

        // Determinar content type
        const contentType = file.mimeType || file.type || 'application/octet-stream';

        // Upload a Supabase Storage
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, blob, {
                contentType,
                upsert: false, // No sobrescribir por defecto
                cacheControl: '3600'
            });

        if (error) throw error;

        return { success: true, data, path: filePath };

    } catch (error) {
        console.error('Error uploading file:', error);
        return { success: false, error: error.message || 'Error al subir archivo' };
    }
};

/**
 * Sube un archivo con opción de sobrescribir
 * @param {Object} supabase - Cliente de Supabase
 * @param {Object} params - Parámetros de upload
 * @returns {Promise<Object>} Resultado del upload
 */
export const uploadOrUpdateFile = async (supabase, params) => {
    try {
        const { bucket, file, filePath } = params;

        // Leer archivo como Blob
        const response = await fetch(file.uri);
        const blob = await response.blob();

        const contentType = file.mimeType || file.type || 'application/octet-stream';

        // Upload con upsert true
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(filePath, blob, {
                contentType,
                upsert: true, // Sobrescribir si existe
                cacheControl: '3600'
            });

        if (error) throw error;

        return { success: true, data, path: filePath };

    } catch (error) {
        console.error('Error uploading/updating file:', error);
        return { success: false, error: error.message || 'Error al subir archivo' };
    }
};

/**
 * Crea una URL firmada para acceder a un archivo privado
 * @param {Object} supabase - Cliente de Supabase
 * @param {string} bucket - Nombre del bucket
 * @param {string} path - Ruta del archivo
 * @param {number} expiresIn - Segundos hasta expiración (default: 300)
 * @returns {Promise<Object>} {success: boolean, url?: string, error?: any}
 */
export const createSignedUrl = async (supabase, bucket, path, expiresIn = SIGNED_URL_EXPIRY_SECONDS) => {
    try {
        if (!path) {
            throw new Error('Ruta de archivo requerida');
        }

        const { data, error } = await supabase.storage
            .from(bucket)
            .createSignedUrl(path, expiresIn);

        if (error) throw error;

        if (!data?.signedUrl) {
            throw new Error('No se pudo generar URL');
        }

        return { success: true, url: data.signedUrl };

    } catch (error) {
        console.error('Error creating signed URL:', error);
        return {
            success: false,
            error: error.message || 'Error al obtener URL del archivo'
        };
    }
};

/**
 * Obtiene URL pública de un archivo
 * @param {Object} supabase - Cliente de Supabase
 * @param {string} bucket - Nombre del bucket
 * @param {string} path - Ruta del archivo
 * @returns {Object} {success: boolean, url?: string}
 */
export const getPublicUrl = (supabase, bucket, path) => {
    try {
        if (!path) {
            throw new Error('Ruta de archivo requerida');
        }

        const { data } = supabase.storage
            .from(bucket)
            .getPublicUrl(path);

        if (!data?.publicUrl) {
            throw new Error('No se pudo obtener URL pública');
        }

        return { success: true, url: data.publicUrl };

    } catch (error) {
        console.error('Error getting public URL:', error);
        return {
            success: false,
            error: error.message || 'Error al obtener URL pública'
        };
    }
};

/**
 * Elimina un archivo de Storage
 * @param {Object} supabase - Cliente de Supabase
 * @param {string} bucket - Nombre del bucket
 * @param {string} path - Ruta del archivo
 * @returns {Promise<Object>} {success: boolean, error?: any}
 */
export const deleteFile = async (supabase, bucket, path) => {
    try {
        if (!path) {
            throw new Error('Ruta de archivo requerida');
        }

        const { error } = await supabase.storage
            .from(bucket)
            .remove([path]);

        if (error) throw error;

        return { success: true };

    } catch (error) {
        console.error('Error deleting file:', error);
        return {
            success: false,
            error: error.message || 'Error al eliminar archivo'
        };
    }
};

/**
 * Elimina múltiples archivos de Storage
 * @param {Object} supabase - Cliente de Supabase
 * @param {string} bucket - Nombre del bucket
 * @param {string[]} paths - Array de rutas de archivos
 * @returns {Promise<Object>} {success: boolean, error?: any}
 */
export const deleteFiles = async (supabase, bucket, paths) => {
    try {
        if (!paths || !paths.length) {
            throw new Error('Rutas de archivos requeridas');
        }

        const { error } = await supabase.storage
            .from(bucket)
            .remove(paths);

        if (error) throw error;

        return { success: true };

    } catch (error) {
        console.error('Error deleting files:', error);
        return {
            success: false,
            error: error.message || 'Error al eliminar archivos'
        };
    }
};

/**
 * Lista archivos en un directorio
 * @param {Object} supabase - Cliente de Supabase
 * @param {string} bucket - Nombre del bucket
 * @param {string} path - Ruta del directorio
 * @returns {Promise<Object>} {success: boolean, files?: Array, error?: any}
 */
export const listFiles = async (supabase, bucket, path = '') => {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .list(path, {
                limit: 100,
                offset: 0,
                sortBy: { column: 'created_at', order: 'desc' }
            });

        if (error) throw error;

        return { success: true, files: data || [] };

    } catch (error) {
        console.error('Error listing files:', error);
        return {
            success: false,
            error: error.message || 'Error al listar archivos',
            files: []
        };
    }
};

/**
 * Descarga un archivo y lo abre
 * @param {Object} supabase - Cliente de Supabase
 * @param {string} bucket - Nombre del bucket
 * @param {string} path - Ruta del archivo
 * @param {Object} Linking - Módulo de React Native Linking
 * @returns {Promise<void>}
 */
export const downloadAndOpenFile = async (supabase, bucket, path, Linking) => {
    try {
        const result = await createSignedUrl(supabase, bucket, path, 300);

        if (!result.success) {
            Alert.alert('Error', result.error);
            return;
        }

        // Abrir URL en navegador/visor
        const supported = await Linking.canOpenURL(result.url);

        if (supported) {
            await Linking.openURL(result.url);
        } else {
            Alert.alert('Error', 'No se puede abrir este tipo de archivo');
        }

    } catch (error) {
        console.error('Error opening file:', error);
        Alert.alert('Error', 'No se pudo abrir el archivo');
    }
};

/**
 * Obtiene el tamaño de un archivo
 * @param {Object} supabase - Cliente de Supabase
 * @param {string} bucket - Nombre del bucket
 * @param {string} path - Ruta del archivo
 * @returns {Promise<Object>} {success: boolean, size?: number, error?: any}
 */
export const getFileSize = async (supabase, bucket, path) => {
    try {
        const { data, error } = await supabase.storage
            .from(bucket)
            .list(path, { limit: 1 });

        if (error) throw error;

        if (!data || data.length === 0) {
            throw new Error('Archivo no encontrado');
        }

        return { success: true, size: data[0].metadata?.size || 0 };

    } catch (error) {
        console.error('Error getting file size:', error);
        return {
            success: false,
            error: error.message || 'Error al obtener tamaño del archivo'
        };
    }
};
