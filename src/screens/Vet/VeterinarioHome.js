import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, StatusBar, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import { useVeterinarioHome } from '../../hooks/useVeterinarioHome';
import { HomeHeader, NotificationCard, QuickActionsGrid } from '../../components/vet/VetHomeComponents';


export default function VeterinarioHome({ navigation }) {
    // Uso del Hook personalizado para obtener datos de la Home
    const { profile, notifications, loading, refetch, unreadCount } = useVeterinarioHome();
    
    // Handlers para acciones de UI
    const handleSeeAll = useCallback(() => {
        navigation.navigate('Notificaciones'); 
    }, [navigation]);

    const handleNotificationPress = useCallback((notificationId) => {
        // Marcar como leída y navegar a la vista de detalle
        console.log(`Abriendo notificación ID: ${notificationId}`);
    }, []);

    const handleProfilePress = useCallback(() => {
        navigation.navigate('Profile'); 
    }, [navigation]);

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} /> 
            
            {/* El header debe estar fuera del ScrollView para mantenerse fijo */}
            <HomeHeader 
                profile={profile} 
                navigation={navigation} 
                unreadCount={unreadCount}
                onProfilePress={handleProfilePress}
                onNotificationPress={handleSeeAll}
            />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={COLORS.primary} />
                }
            >
                
                {/* 2. BLOQUE DE NOTIFICACIONES IMPORTANTES */}
                <View style={styles.notificationsBlock}>
                    <View style={styles.blockHeader}>
                        <Text style={styles.blockTitle}>
                            Notificaciones Recientes 
                            {unreadCount > 0 && <Text style={styles.unreadCount}> ({unreadCount} nuevas)</Text>}
                        </Text>
                        <TouchableOpacity onPress={handleSeeAll}>
                            <Text style={styles.seeAllText}>Ver todas <Ionicons name="arrow-forward" size={SIZES.caption} color={COLORS.primary} /></Text>
                        </TouchableOpacity>
                    </View>
                    
                    {notifications.length > 0 ? (
                        notifications.map((notif) => (
                            <NotificationCard 
                                key={notif.id} 
                                notification={notif} 
                                onPress={handleNotificationPress}
                            />
                        ))
                    ) : (
                        <View style={styles.emptyState}>
                            <Ionicons name="notifications-off-outline" size={50} color={COLORS.secondary} />
                            <Text style={styles.emptyText}>No tienes notificaciones recientes.</Text>
                        </View>
                    )}
                </View>

                {/* 3. SECCIÓN DE ACCIONES RÁPIDAS */}
                <Text style={styles.actionsTitle}>Acciones Rápidas</Text>
                <QuickActionsGrid navigation={navigation} />

            </ScrollView>
        </SafeAreaView>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primary,
    },
    scrollView: {
        flex: 1,
        backgroundColor: COLORS.primary, 
    },
    scrollContent: {
        paddingBottom: 40,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.primary, 
    },
    
    notificationsBlock: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    blockHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    blockTitle: {
        fontFamily: FONTS.PoppinsBold,
        fontSize: SIZES.h3,
        color: COLORS.textPrimary,
    },
    unreadCount: {
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.accent,
        fontSize: SIZES.body,
    },
    seeAllText: {
        fontFamily: FONTS.PoppinsSemiBold,
        fontSize: SIZES.body,
        color: COLORS.textPrimary,
        alignItems: 'center',
    },
    actionsTitle: {
        fontFamily: FONTS.PoppinsBold,
        fontSize: SIZES.h3,
        color: COLORS.primary,
        paddingHorizontal: 20,
        marginTop: 10,
    },
    
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.secondary + '20',
    },
    emptyText: {
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.secondary,
        marginTop: 10,
    }
});