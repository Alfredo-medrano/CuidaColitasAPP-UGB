import { Alert } from 'react-native';
import { MESSAGES } from './constants';

export const handleError = (error, customMessage = MESSAGES.ERROR.DEFAULT) => {
    console.error(error);
    Alert.alert('Error', customMessage);
};

export const handleSuccess = (message) => {
    Alert.alert('Éxito', message);
};
