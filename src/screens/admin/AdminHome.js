import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import AdminLayout from '../../components/admin/AdminLayout';
import StatCard from '../../components/admin/common/StatCard';
import QuickActionCard from '../../components/admin/common/QuickActionCard';
import LoadingState from '../../components/admin/common/LoadingState';
import { useAdminData } from '../../hooks/admin/useAdminData';
import { responsiveSize } from '../../utils/helpers';

// Configuración de acciones rápidas del admin
const quickActions = [
  { title: 'Veterinarios', icon: 'stethoscope', screen: 'Vets', color: COLORS.card },
  { title: 'Clientes', icon: 'account-group', screen: 'Clients', color: COLORS.accent },
  { title: 'Mascotas', icon: 'paw', screen: 'GestionMascotas', color: '#10B981' },
  { title: 'Calendario', icon: 'calendar-month', screen: 'CalendarioMaestro', color: COLORS.secondary },
  { title: 'Estadísticas', icon: 'chart-bar', screen: 'Stats', color: COLORS.alert },
  { title: 'Mensajes', icon: 'message-text', screen: 'AdminMensajes', color: '#6366F1' },
  { title: 'Notificaciones', icon: 'bell-alert', screen: 'AdminNotificaciones', color: '#F59E0B' },
  { title: 'Logs', icon: 'file-document-outline', screen: 'AdminLogs', color: '#8B5CF6' },
  { title: 'Configuración', icon: 'cog', screen: 'ConfiguracionSistema', color: '#64748B' },
];

export default function AdminHome({ navigation }) {
  const { fetchStats, refreshStats, loading, refreshing } = useAdminData();
  const [stats, setStats] = useState({
    vets: 0,
    clients: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await fetchStats();
    setStats({
      vets: data.vets,
      clients: data.clients,
      totalUsers: data.totalUsers,
    });
  };

  const handleRefresh = async () => {
    const data = await refreshStats();
    setStats({
      vets: data.vets,
      clients: data.clients,
      totalUsers: data.totalUsers,
    });
  };

  return (
    <AdminLayout navigation={navigation}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.accent}
            colors={[COLORS.accent]}
          />
        }
      >
        {/* Título de bienvenida */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Dashboard</Text>
          <Text style={styles.welcomeSubtitle}>Gestiona todo el sistema desde aquí</Text>
        </View>

        {/* Sección de Estadísticas Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen General</Text>

          {loading ? (
            <LoadingState type="stat" count={2} />
          ) : (
            <View style={styles.statsRow}>
              <View style={{ flex: 1 }}>
                <StatCard
                  icon="stethoscope"
                  iconBg={COLORS.card}
                  title="Veterinarios"
                  value={stats.vets}
                />
              </View>
              <View style={{ flex: 1 }}>
                <StatCard
                  icon="account-group-outline"
                  iconBg={COLORS.accent}
                  title="Clientes"
                  value={stats.clients}
                />
              </View>
            </View>
          )}

          {/* Total de usuarios */}
          <View style={styles.totalCard}>
            <View style={styles.totalCardLeft}>
              <Ionicons name="people" size={24} color={COLORS.accent} />
              <Text style={styles.totalLabel}>Total Usuarios</Text>
            </View>
            <Text style={styles.totalValue}>{loading ? '—' : stats.totalUsers}</Text>
          </View>
        </View>

        {/* Acciones Rápidas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <QuickActionCard
                key={index}
                icon={action.icon}
                label={action.title}
                color={action.color}
                onPress={() => navigation.navigate(action.screen)}
              />
            ))}
          </View>
        </View>

        {/* Estado del sistema */}
        <View style={[styles.totalCard, { marginBottom: responsiveSize(20) }]}>
          <View style={styles.totalCardLeft}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.totalLabel}>Estado del Sistema</Text>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Operativo</Text>
          </View>
        </View>
      </ScrollView>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: responsiveSize(20),
  },
  welcomeSection: {
    marginBottom: responsiveSize(24),
  },
  welcomeTitle: {
    fontSize: SIZES.h2,
    fontFamily: FONTS.PoppinsBold,
    color: COLORS.textPrimary,
    marginBottom: responsiveSize(4),
  },
  welcomeSubtitle: {
    fontSize: SIZES.body,
    fontFamily: FONTS.PoppinsRegular,
    color: COLORS.secondary,
  },
  section: {
    marginBottom: responsiveSize(24),
  },
  sectionTitle: {
    fontSize: SIZES.h3,
    fontFamily: FONTS.PoppinsSemiBold,
    color: COLORS.textPrimary,
    marginBottom: responsiveSize(16),
  },
  statsRow: {
    flexDirection: 'row',
    gap: responsiveSize(12),
    marginBottom: responsiveSize(12),
  },
  totalCard: {
    backgroundColor: COLORS.white,
    borderRadius: responsiveSize(12),
    padding: responsiveSize(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  totalCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize(12),
  },
  totalLabel: {
    fontSize: SIZES.body,
    fontFamily: FONTS.PoppinsSemiBold,
    color: COLORS.black,
  },
  totalValue: {
    fontSize: SIZES.h2,
    fontFamily: FONTS.PoppinsBold,
    color: COLORS.black,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B98120',
    paddingHorizontal: responsiveSize(12),
    paddingVertical: responsiveSize(6),
    borderRadius: responsiveSize(12),
  },
  statusDot: {
    width: responsiveSize(8),
    height: responsiveSize(8),
    borderRadius: responsiveSize(4),
    backgroundColor: '#10B981',
    marginRight: responsiveSize(6),
  },
  statusText: {
    fontSize: SIZES.caption,
    fontFamily: FONTS.PoppinsSemiBold,
    color: '#10B981',
  },
});
