import { COLORS } from '../theme/theme';

// Obtener estilos basados en el estado de la cita
export const getStatusStyles = (statusName) => {
    switch (statusName) {
        case 'Confirmada':
            return { bg: COLORS.lightBlue, text: COLORS.card }; 
        case 'Programada':
        case 'Pendiente':
            return { bg: COLORS.secondary, text: COLORS.alert }; 
        case 'Cancelada':
            return { bg: COLORS.lightRed, text: COLORS.red }; 
        case 'Completada':
            return { bg: COLORS.lightGreen, text: COLORS.primary }; 
        default:
            return { bg: COLORS.secondary, text: COLORS.primary };
    }
};