// src/services/notificationService.js
// Servicio de notificaciones push - Solo se importa expo-notifications aquí

import { Platform } from 'react-native';
import { supabase } from '../api/Supabase';

// Variables para lazy loading de expo-notifications
let Notifications = null;
let Device = null;
let Constants = null;

// Función para cargar módulos de notificaciones de forma perezosa
async function loadNotificationModules() {
    if (!Notifications) {
        try {
            Notifications = require('expo-notifications');
            Device = require('expo-device');
            Constants = require('expo-constants');

            // Configurar cómo se muestran las notificaciones cuando la app está en primer plano
            Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: true,
                }),
            });
        } catch (error) {
            console.warn('expo-notifications no disponible:', error.message);
            return false;
        }
    }
    return true;
}

/**
 * Inicializa las notificaciones y configura los listeners
 * @param {object} navigation - Objeto de navegación de React Navigation
 */
export async function initializeNotifications(navigation) {
    const loaded = await loadNotificationModules();
    if (!loaded) return;

    try {
        // Registrar para push notifications
        await registerForPushNotificationsAsync();

        // Listener cuando el usuario toca una notificación
        const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
            handleNotificationResponse(response, navigation);
        });

        // Listener cuando llega una notificación (app en primer plano)
        const notificationSubscription = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notificación recibida:', notification);
        });

        return () => {
            responseSubscription.remove();
            notificationSubscription.remove();
        };
    } catch (error) {
        console.warn('Error inicializando notificaciones:', error);
    }
}

/**
 * Registra el dispositivo para notificaciones push y guarda el token en Supabase
 * @returns {string|null} El Expo Push Token o null si falla
 */
export async function registerForPushNotificationsAsync() {
    const loaded = await loadNotificationModules();
    if (!loaded) return null;

    let token = null;

    // Solo funciona en dispositivos físicos
    if (!Device.isDevice) {
        console.log('Las notificaciones push requieren un dispositivo físico');
        return null;
    }

    // Verificar/solicitar permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== 'granted') {
        console.log('Permiso de notificaciones denegado');
        return null;
    }

    try {
        // Obtener el Expo Push Token
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;

        token = (await Notifications.getExpoPushTokenAsync({
            projectId: projectId,
        })).data;

        console.log('Expo Push Token:', token);

        // Guardar el token en Supabase
        await savePushTokenToDatabase(token);

    } catch (error) {
        console.error('Error obteniendo push token:', error);
    }

    // Configurar canal de Android
    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'CuidaColitas',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0B8FAC',
        });

        await Notifications.setNotificationChannelAsync('reminders', {
            name: 'Recordatorios de Citas',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0B8FAC',
        });

        await Notifications.setNotificationChannelAsync('messages', {
            name: 'Mensajes',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#0B8FAC',
        });
    }

    return token;
}

/**
 * Guarda el push token en la tabla profiles del usuario autenticado
 */
async function savePushTokenToDatabase(token) {
    try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            console.log('Usuario no autenticado, no se puede guardar token');
            return;
        }

        const { error } = await supabase
            .from('profiles')
            .update({ push_token: token })
            .eq('id', user.id);

        if (error) {
            console.error('Error guardando push token:', error.message);
        } else {
            console.log('Push token guardado exitosamente');
        }
    } catch (error) {
        console.error('Error en savePushTokenToDatabase:', error);
    }
}

/**
 * Programa recordatorios de cita (24h y 1h antes)
 * @param {Date} appointmentDate - Fecha y hora de la cita
 * @param {string} petName - Nombre de la mascota
 * @param {string} appointmentId - ID de la cita para deep linking
 */
export async function scheduleAppointmentReminders(appointmentDate, petName, appointmentId) {
    const loaded = await loadNotificationModules();
    if (!loaded) {
        console.log('Notificaciones no disponibles para recordatorios');
        return;
    }

    const appointmentTime = new Date(appointmentDate);
    const now = new Date();

    // Recordatorio 24 horas antes
    const reminder24h = new Date(appointmentTime.getTime() - 24 * 60 * 60 * 1000);
    if (reminder24h > now) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '📅 Recordatorio de Cita - Mañana',
                body: `Tienes una cita para ${petName} mañana a las ${appointmentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`,
                data: {
                    type: 'appointment_reminder',
                    appointmentId: appointmentId,
                    screen: 'MisCitas'
                },
                sound: true,
            },
            trigger: {
                date: reminder24h,
            },
        });
        console.log('Recordatorio 24h programado para:', reminder24h);
    }

    // Recordatorio 1 hora antes
    const reminder1h = new Date(appointmentTime.getTime() - 1 * 60 * 60 * 1000);
    if (reminder1h > now) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title: '⏰ Cita en 1 hora',
                body: `Tu cita para ${petName} es a las ${appointmentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}. ¡No olvides asistir!`,
                data: {
                    type: 'appointment_reminder',
                    appointmentId: appointmentId,
                    screen: 'MisCitas'
                },
                sound: true,
            },
            trigger: {
                date: reminder1h,
            },
        });
        console.log('Recordatorio 1h programado para:', reminder1h);
    }
}

/**
 * Cancela todos los recordatorios programados para una cita específica
 * @param {string} appointmentId - ID de la cita
 */
export async function cancelAppointmentReminders(appointmentId) {
    const loaded = await loadNotificationModules();
    if (!loaded) return;

    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();

    for (const notification of scheduledNotifications) {
        if (notification.content.data?.appointmentId === appointmentId) {
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            console.log('Recordatorio cancelado:', notification.identifier);
        }
    }
}

/**
 * Envía una notificación push a un usuario específico (para mensajes de chat)
 * @param {string} recipientUserId - ID del usuario destinatario
 * @param {string} senderName - Nombre del remitente
 * @param {string} messagePreview - Vista previa del mensaje
 * @param {string} conversationId - ID de la conversación para deep linking
 */
export async function sendPushNotification(recipientUserId, senderName, messagePreview, conversationId) {
    try {
        // Obtener el push token del destinatario
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('push_token')
            .eq('id', recipientUserId)
            .single();

        if (error || !profile?.push_token) {
            console.log('El destinatario no tiene push token registrado');
            return;
        }

        // Enviar notificación usando Expo Push API
        const message = {
            to: profile.push_token,
            sound: 'default',
            title: `💬 ${senderName}`,
            body: messagePreview.length > 100 ? messagePreview.substring(0, 100) + '...' : messagePreview,
            data: {
                type: 'new_message',
                conversationId: conversationId,
                senderId: recipientUserId,
                screen: 'ChatScreen'
            },
        };

        const response = await fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
                Accept: 'application/json',
                'Accept-encoding': 'gzip, deflate',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        const result = await response.json();
        console.log('Push notification enviada:', result);

    } catch (error) {
        console.error('Error enviando push notification:', error);
    }
}

/**
 * Maneja la navegación cuando el usuario toca una notificación
 * @param {object} response - Respuesta de la notificación
 * @param {object} navigation - Objeto de navegación de React Navigation
 */
export function handleNotificationResponse(response, navigation) {
    const data = response.notification.request.content.data;

    if (!data || !navigation) return;

    console.log('Notificación tocada, data:', data);

    switch (data.type) {
        case 'appointment_reminder':
            navigation.navigate('MisCitas');
            break;
        case 'new_message':
            if (data.conversationId) {
                navigation.navigate('ChatScreen', {
                    conversation_id: data.conversationId,
                });
            } else {
                navigation.navigate('Mensajes');
            }
            break;
        default:
            console.log('Tipo de notificación no manejado:', data.type);
    }
}
