import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES, SHADOWS } from '../../theme/theme';
import AdminLayout from '../../components/admin/AdminLayout';
import { supabase } from '../../api/Supabase';
import { responsiveSize } from '../../utils/helpers';
import moment from 'moment';

export default function AdminLogs({ navigation }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState('all'); // all, users, appointments, profiles

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const recentLogs = [];

            // Simular logs basados en actividad reciente del sistema
            // En producción, esto debería venir de una tabla system_logs

            // 1. Logs de usuarios nuevos
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);

            if (filter === 'all' || filter === 'users') {
                const { data: newUsers } = await supabase
                    .from('profiles')
                    .select('id, name, created_at, roles:role_id(name)')
                    .gte('created_at', weekAgo.toISOString())
                    .order('created_at', { ascending: false })
                    .limit(20);

                newUsers?.forEach(user => {
                    recentLogs.push({
                        id: `user-${user.id}-${user.created_at}`,
                        type: 'user_created',
                        action: 'Registro de Usuario',
                        description: `${user.name} se registró como ${user.roles?.name || 'usuario'}`,
                        timestamp: user.created_at,
                        icon: 'person-add',
                        color: COLORS.accent,
                    });
                });
            }

            // 2. Logs de citas
            if (filter === 'all' || filter === 'appointments') {
                const { data: recentAppointments } = await supabase
                    .from('appointments')
                    .select(`
            id,
            created_at,
            pet:pet_id(name, owner:owner_id(name)),
            vet:vet_id(name),
            status:status_id(status)
          `)
                    .gte('created_at', weekAgo.toISOString())
                    .order('created_at', { ascending: false })
                    .limit(20);

                recentAppointments?.forEach(apt => {
                    recentLogs.push({
                        id: `appointment-${apt.id}-${apt.created_at}`,
                        type: 'appointment_created',
                        action: 'Cita Programada',
                        description: `Cita para ${apt.pet?.name} con Dr. ${apt.vet?.name}`,
                        timestamp: apt.created_at,
                        icon: 'calendar',
                        color: COLORS.card,
                    });
                });
            }

            // Ordenar por fecha más reciente
            recentLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            setLogs(recentLogs);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchLogs();
    };

    const getActionColor = (type) => {
        switch (type) {
            case 'user_created':
                return COLORS.accent;
            case 'appointment_created':
                return COLORS.card;
            case 'profile_updated':
                return '#F59E0B';
            default:
                return COLORS.secondary;
        }
    };

    const renderLog = ({ item }) => (
        <View style={styles.logCard}>
            <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                <Ionicons name={item.icon} size={20} color={item.color} />
            </View>

            <View style={styles.logContent}>
                <View style={styles.logHeader}>
                    <Text style={styles.logAction}>{item.action}</Text>
                    <Text style={styles.timeText}>{moment(item.timestamp).fromNow()}</Text>
                </View>

                <Text style={styles.logDescription}>{item.description}</Text>

                <Text style={styles.dateText}>
                    {moment(item.timestamp).format('DD/MM/YYYY HH:mm:ss')}
                </Text>
            </View>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color={COLORS.secondary} />
            <Text style={styles.emptyTitle}>No hay logs</Text>
            <Text style={styles.emptyText}>
                Los registros de actividad del sistema aparecerán aquí
            </Text>
        </View>
    );

    return (
        <AdminLayout navigation={navigation}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Logs de Actividad</Text>
                <Text style={styles.headerSubtitle}>Registro de acciones del sistema</Text>
            </View>

            {/* Filtros */}
            <View style={styles.filterContainer}>
                <TouchableOpacity
                    style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
                    onPress={() => setFilter('all')}
                >
                    <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
                        Todos
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterButton, filter === 'users' && styles.filterButtonActive]}
                    onPress={() => setFilter('users')}
                >
                    <Text style={[styles.filterText, filter === 'users' && styles.filterTextActive]}>
                        Usuarios
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.filterButton, filter === 'appointments' && styles.filterButtonActive]}
                    onPress={() => setFilter('appointments')}
                >
                    <Text style={[styles.filterText, filter === 'appointments' && styles.filterTextActive]}>
                        Citas
                    </Text>
                </TouchableOpacity>
            </View>

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
            ) : (
                <FlatList
                    data={logs}
                    renderItem={renderLog}
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
    filterContainer: {
        flexDirection: 'row',
        gap: responsiveSize(8),
        marginBottom: responsiveSize(16),
    },
    filterButton: {
        paddingHorizontal: responsiveSize(16),
        paddingVertical: responsiveSize(8),
        borderRadius: responsiveSize(8),
        backgroundColor: COLORS.white,
    },
    filterButtonActive: {
        backgroundColor: COLORS.accent,
    },
    filterText: {
        fontSize: SIZES.caption,
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.black,
    },
    filterTextActive: {
        color: COLORS.white,
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
    logCard: {
        backgroundColor: COLORS.white,
        borderRadius: responsiveSize(12),
        padding: responsiveSize(12),
        marginBottom: responsiveSize(8),
        flexDirection: 'row',
        ...SHADOWS.light,
    },
    iconContainer: {
        width: responsiveSize(40),
        height: responsiveSize(40),
        borderRadius: responsiveSize(20),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: responsiveSize(12),
    },
    logContent: {
        flex: 1,
    },
    logHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: responsiveSize(4),
    },
    logAction: {
        fontSize: SIZES.caption + 1,
        fontFamily: FONTS.PoppinsSemiBold,
        color: COLORS.black,
        flex: 1,
    },
    timeText: {
        fontSize: SIZES.caption - 1,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.secondary,
    },
    logDescription: {
        fontSize: SIZES.caption,
        fontFamily: FONTS.PoppinsRegular,
        color: COLORS.black + 'DD',
        marginBottom: responsiveSize(4),
    },
    dateText: {
        fontSize: SIZES.caption - 2,
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
