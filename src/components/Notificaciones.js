import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, Text, StyleSheet, FlatList, ActivityIndicator, 
    Alert, TouchableOpacity, StatusBar 
} from 'react-native';
import { supabase } from '../api/Supabase';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../theme/theme';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

const notificationStyles = {
    vaccine_due: { icon: 'syringe-outline', cardBg: '#FFECEC', iconBg: '#FFD2D2', iconColor: '#D32F2F', isImportant: true, title: 'Recordatorio de Vacuna' },
    medication: { icon: 'medkit-outline', cardBg: '#FFECEC', iconBg: '#FFD2D2', iconColor: '#D32F2F', isImportant: true, title: 'Medicación' },
    appointment_reminder: { icon: 'calendar-outline', cardBg: '#DFF6F2', iconBg: '#A8E6DC', iconColor: '#027A74', isImportant: false, title: 'Cita Confirmada' },
    results_ready: { icon: 'document-text-outline', cardBg: '#E2ECED', iconBg: '#B0C4DE', iconColor: '#4682B4', isImportant: false, title: 'Resultados Disponibles' },
    care_tips: { icon: 'bulb-outline', cardBg: '#A8E6DC', iconBg: '#DFF6F2', iconColor: '#027A74', isImportant: false, title: 'Consejos de Cuidado' },
    default: { icon: 'notifications-outline', cardBg: COLORS.secondary, iconBg: COLORS.primary, iconColor: COLORS.textPrimary, isImportant: false, title: 'Notificación' },
};

const NotificationCard = ({ notification, onPress }) => {
    const styleInfo = notificationStyles[notification.type] || notificationStyles.default;
    
    return (
        <TouchableOpacity style={[styles.card, { backgroundColor: styleInfo.cardBg }]} onPress={onPress}>
            <View style={[styles.iconContainer, { backgroundColor: styleInfo.iconBg }]}>
                <Ionicons name={styleInfo.icon} size={24} color={styleInfo.iconColor} />
            </View>
            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{notification.title}</Text>
                    {styleInfo.isImportant && (
                        <View style={styles.tag}>
                            <Text style={styles.tagText}>Importante</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.cardText}>{notification.content}</Text>
                <Text style={styles.cardTime}>{moment(notification.created_at).fromNow()}</Text>
            </View>
            {!notification.is_read && <View style={styles.unreadDot} />}
        </TouchableOpacity>
    );
};

export default function Notificaciones({ navigation }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const isFocused = useIsFocused();

    const fetchNotifications = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Usuario no encontrado");

            const { data, error } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
            if (error) throw error;
            setNotifications(data || []);
        } catch (error) {
            Alert.alert("Error", "No se pudieron cargar las notificaciones.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isFocused) {
            fetchNotifications();
        }
    }, [isFocused, fetchNotifications]);

    const handleNotificationPress = async (notification) => {
        if (!notification.is_read) {
            const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', notification.id);
            if (error) {
                console.error("Error al marcar como leída:", error);
            } else {
                setNotifications(current => current.map(n => n.id === notification.id ? { ...n, is_read: true } : n));
            }
        }
    };

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.accent} /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notificaciones</Text>
                <View style={styles.headerButton} />
            </View>
            
            <FlatList
                data={notifications}
                renderItem={({ item }) => (
                    <NotificationCard 
                        notification={item} 
                        onPress={() => handleNotificationPress(item)} 
                    />
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                ListEmptyComponent={
                    <View style={styles.centered}>
                        <Ionicons name="notifications-off-outline" size={40} color={COLORS.secondary + '50'} />
                        <Text style={styles.emptyText}>No tienes notificaciones.</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: '50%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    headerButton: {
        width: 30,
    },
    headerTitle: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.h2,
        color: COLORS.textPrimary,
    },
    list: {
        padding: 20,
    },
    emptyText: {
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.secondary,
        marginTop: 10,
    },
    card: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 15,
        marginBottom: 15,
        alignItems: 'center',
    },
    iconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    cardContent: {
        flex: 1,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardTitle: {
        fontFamily: FONTS.PoppinsBold,
        fontSize: 16,
        color: COLORS.primary,
    },
    tag: {
        backgroundColor: '#CDA37B',
        borderRadius: 12,
        paddingHorizontal: 10,
        paddingVertical: 3,
    },
    tagText: {
        fontFamily: FONTS.PoppinsBold,
        color: COLORS.white,
        fontSize: 10,
    },
    cardText: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: 14,
        color: COLORS.card,
        marginTop: 2,
    },
    cardTime: {
        fontFamily: FONTS.PoppinsRegular,
        fontSize: 12,
        color: COLORS.card + '90',
        marginTop: 5,
    },
    unreadDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: COLORS.accent,
        marginLeft: 10,
    },
});