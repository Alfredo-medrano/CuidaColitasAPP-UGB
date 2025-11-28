import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../api/Supabase';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useAdminRole } from '../../hooks/admin/useAdminRole';

const StatCard = ({ title, value, icon, color }) => (
    <View style={styles.statCard}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={24} color={color} />
        </View>
        <View>
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statTitle}>{title}</Text>
        </View>
    </View>
);

const ProgressBar = ({ label, value, total, color }) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <View style={styles.progressContainer}>
            <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>{label}</Text>
                <Text style={styles.progressValue}>{value} ({percentage.toFixed(0)}%)</Text>
            </View>
            <View style={styles.track}>
                <View style={[styles.bar, { width: `${percentage}%`, backgroundColor: color }]} />
            </View>
        </View>
    );
};

export default function AdminStats() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalAppointments: 0,
        completedAppointments: 0,
        pendingAppointments: 0,
        cancelledAppointments: 0,
        totalVets: 0,
        totalClients: 0,
        totalPets: 0
    });

    const { getVetRoleId, getClientRoleId } = useAdminRole();

    const fetchStats = async () => {
        try {
            // 1. Citas
            const { data: appointments, error: appError } = await supabase
                .from('appointments')
                .select('status_id, status:status_id(status)');

            if (appError) throw appError;

            const totalApp = appointments.length;
            const completed = appointments.filter(a => a.status?.status === 'Confirmada' || a.status?.status === 'Completada').length;
            const pending = appointments.filter(a => a.status?.status === 'Pendiente').length;
            const cancelled = appointments.filter(a => a.status?.status === 'Cancelada').length;

            // 2. Usuarios (Roles) - Obtener IDs dinámicamente
            const vetRoleId = await getVetRoleId();
            const clientRoleId = await getClientRoleId();

            const { count: vetsCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role_id', vetRoleId);

            const { count: clientsCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role_id', clientRoleId);

            // 3. Mascotas
            const { count: petsCount } = await supabase
                .from('pets')
                .select('*', { count: 'exact', head: true });

            setStats({
                totalAppointments: totalApp,
                completedAppointments: completed,
                pendingAppointments: pending,
                cancelledAppointments: cancelled,
                totalVets: vetsCount || 0,
                totalClients: clientsCount || 0,
                totalPets: petsCount || 0
            });

        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchStats();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
            <Text style={styles.headerTitle}>Estadísticas Generales</Text>

            {/* Resumen Principal */}
            <View style={styles.grid}>
                <StatCard title="Total Citas" value={stats.totalAppointments} icon="calendar" color={COLORS.primary} />
                <StatCard title="Mascotas" value={stats.totalPets} icon="paw" color={COLORS.accent} />
                <StatCard title="Veterinarios" value={stats.totalVets} icon="medkit" color={COLORS.secondary} />
                <StatCard title="Clientes" value={stats.totalClients} icon="people" color="#66BB6A" />
            </View>

            {/* Desglose de Citas */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Estado de Citas</Text>
                <View style={styles.card}>
                    <ProgressBar
                        label="Completadas / Confirmadas"
                        value={stats.completedAppointments}
                        total={stats.totalAppointments}
                        color={COLORS.success}
                    />
                    <ProgressBar
                        label="Pendientes"
                        value={stats.pendingAppointments}
                        total={stats.totalAppointments}
                        color={COLORS.warning}
                    />
                    <ProgressBar
                        label="Canceladas"
                        value={stats.cancelledAppointments}
                        total={stats.totalAppointments}
                        color={COLORS.error}
                    />
                </View>
            </View>

            {/* Info Adicional */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Rendimiento</Text>
                <View style={styles.card}>
                    <Text style={styles.infoText}>
                        El sistema está operando con un total de {stats.totalVets + stats.totalClients} usuarios registrados.
                        La tasa de finalización de citas es del {stats.totalAppointments > 0 ? ((stats.completedAppointments / stats.totalAppointments) * 100).toFixed(1) : 0}%.
                    </Text>
                </View>
            </View>

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    headerTitle: { fontFamily: FONTS.PoppinsBold, fontSize: SIZES.h2, color: COLORS.primary, marginBottom: 20 },

    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
    statCard: {
        width: '48%',
        backgroundColor: COLORS.white,
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2,
    },
    iconContainer: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
    statValue: { fontFamily: FONTS.PoppinsBold, fontSize: 18, color: COLORS.black },
    statTitle: { fontFamily: FONTS.PoppinsRegular, fontSize: 12, color: COLORS.gray },

    section: { marginBottom: 20 },
    sectionTitle: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.h3, color: COLORS.primary, marginBottom: 10 },
    card: { backgroundColor: COLORS.white, borderRadius: 12, padding: 20, elevation: 1 },

    progressContainer: { marginBottom: 15 },
    progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
    progressLabel: { fontFamily: FONTS.PoppinsRegular, fontSize: 12, color: COLORS.text },
    progressValue: { fontFamily: FONTS.PoppinsSemiBold, fontSize: 12, color: COLORS.black },
    track: { height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
    bar: { height: '100%', borderRadius: 4 },

    infoText: { fontFamily: FONTS.PoppinsRegular, fontSize: 14, color: COLORS.gray, lineHeight: 22 },
});
