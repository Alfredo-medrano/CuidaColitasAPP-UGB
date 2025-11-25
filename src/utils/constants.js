export const TABLES = {
    MEDICAL_ATTACHMENTS: 'medical_attachments',
    ATTACHMENTS: 'attachments',
};

export const MESSAGES = {
    ERROR: {
        DEFAULT: 'Ha ocurrido un error inesperado.',
        UPLOAD_FAILED: 'No se pudo subir el archivo.',
        DELETE_FAILED: 'No se pudo eliminar el archivo.',
        LIST_FAILED: 'No se pudo cargar la lista de archivos.',
        AUTH_REQUIRED: 'Necesitas estar autenticado para realizar esta acción.',
        SIGNED_URL_FAILED: 'No se pudo obtener el enlace para ver el archivo.',
    },
    SUCCESS: {
        UPLOAD: 'El archivo se ha subido correctamente.',
        DELETE: 'El archivo ha sido eliminado.',
    },
    CONFIRM: {
        DELETE_FILE: (fileName) => `¿Seguro que quieres eliminar ${fileName}?`,
    },
};
