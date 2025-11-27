import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme/theme';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../api/Supabase';
import { responsiveSize } from '../../utils/helpers';
import moment from 'moment';

export default function AdminNotificaciones({ navigation }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchNotifications();

        // Suscripción a cambios en tiempo real
        const subscription = supabase
            .channel('admin_notifications')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'profiles',
            }, () => {
                fetchNotifications();
            })
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'appointments',
            }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const adminNotifications = [];

            // 1. Nuevos registros de usuarios (últimos 7 días)
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            const { data: newUsers, error: usersError } = await supabase
                .from('profiles')
                .select('id, name, created_at, role_id, roles:role_id(name)')
                .gte('created_at', weekAgo.toISOString())
                .order('created_at', { ascending: false });

            if (!usersError && newUsers) {
                newUsers.forEach(user => {
                    adminNotifications.push({
                        id: `user-${user.id}`,
                        type: 'new_user',
                        title: 'Nuevo Usuario Registrado',
                        message: `${user.name} se registró como ${user.roles?.name || 'usuario'}`,
                        date: user.created_at,
                        icon: 'person-add',
                        color: COLORS.accent,
                        data: user,
                    });
                });
            }

            // 2. Citas recientes (últimas 24 horas)
            const dayAgo = new Date();
            dayAgo.setHours(dayAgo.getHours() - 24);

            const { data: recentAppointments, error: appointmentsError } = await supabase
                .from('appointments')
                .select(`
          id,
          appointment_time,
          created_at,
          pet:pet_id(name, owner:owner_id(name)),
          vet:vet_id(name),
          status:status_id(status)
        `)
                .gte('created_at', dayAgo.toISOString())
                .order('created_at', { ascending: false })
                .limit(10);

            if (!appointmentsError && recentAppointments) {
                recentAppointments.forEach(apt => {
                    adminNotifications.push({
                        id: `appointment-${apt.id}`,
                        type: 'new_appointment',
                        title: 'Nueva Cita Programada',
                        message: `${apt.pet?.owner?.name || 'Cliente'} programó cita para ${apt.pet?.name || 'mascota'}`,
                        date: apt.created_at,
                        icon: 'calendar',
                        color: COLORS.card,
                        data: apt,
                    });
                });
            }

            // Ordenar por fecha más reciente
            adminNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));

            setNotifications(adminNotifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchNotifications();
    };

    const renderNotification = ({ item }) => (
        <View style={styles.notificationCard}>
            <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={24} color={item.color} />
            </View>

            <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                    <Text style={styles.notificationTitle}>{item.title}</Text>
                    <Text style={styles.timeText}>{moment(item.date).fromNow()}</Text>
                </View>

                <Text style={styles.notificationMessage}>{item.message}</Text>

                <Text style={styles.dateText}>
                    {moment(item.date).format('DD/MM/YYYY HH:mm')}
                </Text>
            </View>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color={COLORS.secondary} />
            <Text style={styles.emptyTitle}>No hay notificaciones</Text>
            <Text style={styles.emptyText}>
                Las notificaciones del sistema aparecerán aquí
            </Text>
        </View>
    );

    return (
        <AdminLayout navigation={navigation}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Notificaciones</Text>
                <Text style={styles.headerSubtitle}>
                    {notifications.length} notificación{notifications.length !== 1 ? 'es' : ''} reciente{notifications.length !== 1 ? 's' : ''}
                </Text>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderNotification}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={COLORS.accent}
                            colors={[COLORS.accent]}
                        />
                    }
                />
            )}
        </AdminLayout>
    );
}

const styles = StyleSheet.create({
    header: {
        marginBottom: responsiveSize(20),
    },
    headerTitle: {
        fontSize: SIZES.h2,
        fontFamily: FONTS.PoppinsBold,
        color: COLORS.textPrimary,
        marginBottom: responsiveSize(4),
    },
    headerSubtitle: {
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.secondary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: responsiveSize(40),
    },
    listContent: {
        paddingBottom: responsiveSize(20),
    },
    notificationCard: {
        backgroundColor: COLORS.white,
        borderRadius: responsiveSize(12),
        padding: responsiveSize(16),
        marginBottom: responsiveSize(12),
        flexDirection: 'row',
        ...SHADOWS.medium,
    },
    iconContainer: {
        width: responsiveSize(50),
        height: responsiveSize(50),
        borderRadius: responsiveSize(25),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: responsiveSize(12),
    },
    notificationContent: {
        flex: 1,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: responsiveSize(6),
    },
    notificationTitle: {
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.black,
        flex: 1,
        marginRight: responsiveSize(8),
    },
    timeText: {
        fontSize: SIZES.caption,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.secondary,
    },
    notificationMessage: {
        fontSize: SIZES.caption,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.black + 'DD',
        marginBottom: responsiveSize(6),
        lineHeight: responsiveSize(18),
    },
    dateText: {
        fontSize: SIZES.caption - 1,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.secondary,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: responsiveSize(60),
    },
    emptyTitle: {
        fontSize: SIZES.h3,
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.textPrimary,
        marginTop: responsiveSize(16),
        marginBottom: responsiveSize(8),
    },
    emptyText: {
        fontSize: SIZES.body,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.secondary,
        textAlign: 'center',
        paddingHorizontal: responsiveSize(40),
    },
});
