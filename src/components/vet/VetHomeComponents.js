import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/es';
import { COLORS, FONTS, SIZES } from '../../theme/theme';

moment.locale('es');

// header de la home
export const HomeHeader = ({ profile, navigation, unreadCount, onProfilePress, onNotificationPress }) => {
    const greetingName = profile?.name ? profile.name.split(' ')[0] : 'Veterinario(a)';
    
    return (
        <View style={headerStyles.container}>
            {/* Saludo y bienvenida */}
            <View>
                <Text style={headerStyles.saludo}>Hola, {greetingName}</Text>
                <Text style={headerStyles.bienvenida}>Bienvenido a tu panel de control.</Text>
            </View>
            
            {/* Botón de perfil */}
            <TouchableOpacity 
                style={headerStyles.profileButton}
                onPress={onProfilePress}
            >
                {profile?.avatar_url ? (
                    <Image source={{ uri: profile.avatar_url }} style={headerStyles.avatar} />
                ) : (
                    <Ionicons name="person-circle" size={40} color={COLORS.primary} /> 
                )}
            </TouchableOpacity>
            
            {/* Campanita de notificaciones */}
            <TouchableOpacity style={headerStyles.notificationBtn} onPress={onNotificationPress} hitSlop={12}>
                <Ionicons 
                    name={unreadCount > 0 ? 'notifications' : 'notifications-outline'} 
                    size={26} 
                    color={COLORS.white} 
                />
                {unreadCount > 0 && (
                    <View style={headerStyles.badge}>
                        <Text style={headerStyles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
};

// noficaciones individuales
const getIconAndPriorityColor = (type, isRead) => {
    let iconName, color, priorityText;

    switch (type) {
        case 'vaccine_due':
            iconName = 'calendar-outline';
            color = COLORS.accent;
            priorityText = 'Recordatorio';
            break;
        case 'new_appointment':
            iconName = 'time-outline';
            color = COLORS.primary;
            priorityText = 'Nueva Cita';
            break;
        case 'medical_checkup':
            iconName = 'alert-circle-outline';
            color = COLORS.red;
            priorityText = 'Importante';
            break;
        case 'new_message':
            iconName = 'chatbubble-outline';
            color = COLORS.card;
            priorityText = 'Mensaje';
            break;
        default:
            iconName = 'notifications-outline';
            color = COLORS.secondary;
            priorityText = 'Aviso';
    }

    return { 
        iconName, 
        color: isRead ? COLORS.secondary : color, 
        priorityText,
        badgeBg: isRead ? COLORS.secondary + '30' : color 
    };
};

export const NotificationCard = ({ notification, onPress }) => {
    const { id, type, title, content, created_at, is_read } = notification;
    const { iconName, color, priorityText } = getIconAndPriorityColor(type, is_read);
    const timeAgo = moment(created_at).fromNow();

    return (
        <TouchableOpacity style={cardStyles.card} onPress={() => onPress(id)}>
            <View style={cardStyles.iconContainer}>
                <Ionicons name={iconName} size={28} color={COLORS.white} />
            </View>
            <View style={cardStyles.content}>
                <Text style={[cardStyles.title, is_read && { color: COLORS.secondary }]} numberOfLines={1}>{title}</Text>
                <Text style={cardStyles.description} numberOfLines={1}>{content}</Text>
            </View>
            <View style={cardStyles.meta}>
                <View style={[cardStyles.priorityBadge, { backgroundColor: is_read ? COLORS.secondary + '30' : color }]}>
                    <Text style={cardStyles.priorityText}>
                        {is_read ? 'Leída' : priorityText}
                    </Text>
                </View>
                <Text style={cardStyles.timestamp}>{timeAgo}</Text>
            </View>
        </TouchableOpacity>
    );
};

//cuadricula de acciones rápidas
const ActionButton = ({ icon, label, onPress }) => (
    <TouchableOpacity style={gridStyles.button} onPress={onPress}>
        <Ionicons name={icon} size={30} color={COLORS.white} />
        <Text style={gridStyles.buttonText}>{label}</Text>
    </TouchableOpacity>
);

export const QuickActionsGrid = ({ navigation }) => {
    const actions = [
        { icon: 'paw-outline', label: 'Mis Pacientes', screen: 'MisPacientes' },
        { icon: 'calendar-outline', label: 'Agenda', screen: 'AgendaDelDia' },
        { icon: 'chatbubbles-outline', label: 'Mensajes', screen: 'Mensajes' },
        { icon: 'document-text-outline', label: 'Nueva Visita', screen: 'NuevaVisita' },
    ];

    return (
        <View style={gridStyles.grid}>
            {actions.map((action, index) => (
                <ActionButton 
                    key={index}
                    icon={action.icon}
                    label={action.label}
                    onPress={() => navigation.navigate(action.screen)}
                />
            ))}
        </View>
    );
};

// --- ESTILOS ---
const headerStyles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: COLORS.primary,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.secondary + '30',
    },
    saludo: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.h1,
        color: COLORS.white,
        marginBottom: 5,
        textAlign: 'center',
        left: 20,
    },
    bienvenida: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.body,
        color: COLORS.secondary,
    },
    profileButton: {
        width: 45,
        height: 45,
        borderRadius: 22.5,
        overflow: 'hidden',
        backgroundColor: COLORS.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        left: 20,
        top: 15,
    },
    avatar: { width: '100%', height: '100%' },
    notificationBtn: {
        position: 'absolute',
        right: 20,
        top: 22,
        padding: 6,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    badge: {
        position: 'absolute',
        right: 0,
        top: 0,
        backgroundColor: COLORS.red,
        borderRadius: 8,
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: COLORS.white,
        fontSize: 10,
        fontFamily: FONTS.PoppinsBold,
    },
});

const cardStyles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 15,
        marginBottom: 10,
        alignItems: 'center',
        elevation: 2,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderLeftWidth: 5,
        borderLeftColor: COLORS.accent,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
    },
    content: {
        flex: 1,
        marginRight: 10,
    },
    title: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.body,
        color: COLORS.textPrimary,
    },
    description: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.caption,
        color: COLORS.secondary,
        marginTop: 2,
    },
    meta: {
        alignItems: 'flex-end',
    },
    priorityBadge: {
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 3,
        marginBottom: 4,
    },
    priorityText: {
        fontFamily: FONTS.PoppinsBold,
        fontSize: SIZES.caption,
        color: COLORS.white,
    },
    timestamp: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: SIZES.caption,
        color: COLORS.secondary,
    },
});

const gridStyles = StyleSheet.create({
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginTop: 20,
    },
    button: {
        width: '48%',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        paddingVertical: 20,
        marginBottom: 15,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 3,
        shadowColor: COLORS.white,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        borderWidth: 1,
        borderColor: COLORS.secondary + '40',
    },
    buttonText: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.body,
        color: COLORS.white,
        marginTop: 8,
        textAlign: 'center',
    },
});
