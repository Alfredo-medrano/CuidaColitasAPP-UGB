// src/screens/admin/AdminHome.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../../api/Supabase';
import { COLORS, FONTS, SIZES } from '../../theme/theme';

const PROFILE_TABLE = 'profiles';

/* ---------- Subcomponentes ---------- */
const IconBadge = ({ name, bg, color = COLORS.white }) => (
  <View style={[styles.iconBadge, { backgroundColor: bg }]}>
    <MaterialCommunityIcons name={name} size={28} color={color} />
  </View>
);

const DashboardCard = ({ icon, iconBg, title, value }) => (
  <View style={styles.card}>
    <IconBadge name={icon} bg={iconBg} />
    <View style={styles.cardTextContainer}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  </View>
);

const SummaryCard = ({ left, right }) => (
  <View style={styles.summaryCard}>
    <Text style={styles.summaryText}>{left}</Text>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>{right}</View>
  </View>
);

// --- Componente para el Footer ---
const QuickActionButton = ({ icon, text, onPress }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={24} color={COLORS.primary} />
    <Text style={styles.actionButtonText}>{text}</Text>
  </TouchableOpacity>
);


/* ---------- Pantalla ---------- */
const AdminHome = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vetCount, setVetCount] = useState(0);
  const [clientCount, setClientCount] = useState(0);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    try {
      // 1) Obtener ids de roles
      const { data: roles, error: rolesError } = await supabase
        .from('roles')
        .select('id,name')
        .in('name', ['veterinario', 'cliente']);
      if (rolesError) throw rolesError;

      const vetRoleId = roles?.find(r => r.name === 'veterinario')?.id || null;
      let cliRoleId = roles?.find(r => r.name === 'cliente')?.id || null;

      if (!cliRoleId) {
        const { data: rpcCli, error: rpcErr } = await supabase.rpc('get_cliente_role_id');
        if (rpcErr) throw rpcErr;
        cliRoleId = rpcCli;
      }

      // 2) Contar perfiles por role_id
      const [{ count: vets, error: e1 }, { count: clients, error: e2 }] = await Promise.all([
        supabase.from(PROFILE_TABLE).select('*', { count: 'exact', head: true }).eq('role_id', vetRoleId),
        supabase.from(PROFILE_TABLE).select('*', { count: 'exact', head: true }).eq('role_id', cliRoleId),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;

      setVetCount(vets || 0);
      setClientCount(clients || 0);
    } catch (err) {
      console.error('AdminHome fetchCounts:', err?.message || err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchCounts();
  };

  const totalUsers = vetCount + clientCount;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLogo}>
            <MaterialCommunityIcons name="stethoscope" size={20} color={COLORS.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>VetAdmin Pro</Text>
            <Text style={styles.headerSubtitle}>Panel de Administración</Text>
          </View>
          
          {/* Botón de perfil (en el header) */}
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('AdminProfile')}
          >
            <MaterialCommunityIcons name="account-circle-outline" size={28} color={COLORS.white} />
          </TouchableOpacity>

        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />
        }
      >
        {/* Títulos */}
        <Text style={styles.sectionTitle}>Dashboard</Text>
        <Text style={styles.sectionSubtitle}>Resumen de usuarios activos</Text>

        {/* Tarjetas de conteo */}
        <View style={styles.cardRow}>
          <DashboardCard
            icon="stethoscope"
            iconBg={COLORS.card}
            title="Veterinarios"
            value={loading ? '—' : vetCount}
          />
          <DashboardCard
            icon="account-group-outline"
            iconBg="#6B6B6B"
            title="Clientes"
            value={loading ? '—' : clientCount}
          />
        </View>

        {/* Resúmenes */}
        <SummaryCard
          left="Total Usuarios"
          right={<Text style={styles.summaryValue}>{loading ? '—' : totalUsers}</Text>}
        />
        <SummaryCard
          left="Estado Sistema"
          right={
            <>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Operativo</Text>
            </>
          }
        />

        {loading && (
          <View style={{ marginTop: 8 }}>
            <ActivityIndicator color={COLORS.accent} />
          </View>
        )}
      </ScrollView>

      {/* --- FOOTER DE ACCIONES RÁPIDAS --- */}
      <View style={styles.footer}>
        <View style={styles.actionButtonsContainer}>
          <QuickActionButton
            icon="stethoscope"
            text="Vets"
            onPress={() => navigation.navigate('Vets')}
          />
          <QuickActionButton
            icon="account-group-outline"
            text="Clientes"
            onPress={() => navigation.navigate('Clients')}
          />
          <QuickActionButton
            icon="chart-line"
            text="Stats"
            onPress={() => navigation.navigate('Stats')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

/* ---------- Estilos (Corregidos) ---------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },
  header: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLogo: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accent,
    marginRight: 6,
  },
  headerTitle: {
    fontSize: SIZES.h1,
    color: COLORS.white,
    fontFamily: FONTS.PoppinsBold,
  },
  headerSubtitle: {
    fontSize: SIZES.caption,
    color: COLORS.textPrimary,
    fontFamily: FONTS.PoppinsRegular,
    marginTop: -2,
    opacity: 0.95,
  },
  profileButton: {
    padding: 6,
    marginLeft: 'auto',
  },
  container: { 
    padding: 12, 
    paddingBottom: 100 
  },
  sectionTitle: {
    fontSize: SIZES.h2,
    fontFamily: FONTS.PoppinsBold,
    color: COLORS.white,
    marginTop: 6,
  },
  sectionSubtitle: {
    fontSize: SIZES.caption,
    fontFamily: FONTS.PoppinsRegular,
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  iconBadge: {
    width: 50, height: 50, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 10,
  },
  cardTextContainer: { flex: 1 },
  cardTitle: {
    fontSize: 12,
    color: '#4E666B',
    fontFamily: FONTS.PoppinsRegular,
  },
  cardValue: {
    fontSize: 28,
    color: COLORS.black,
    fontFamily: FONTS.PoppinsBold,
    marginTop: 2,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  summaryText: {
    fontSize: 14,
    color: COLORS.black,
    fontFamily: FONTS.PoppinsSemiBold,
  },
  summaryValue: {
    fontSize: 18,
    color: COLORS.black,
    fontFamily: FONTS.PoppinsBold,
  },
  statusDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: COLORS.accent,
    marginRight: 6,
  },
  statusText: {
    fontSize: SIZES.body,
    color: COLORS.black,
    fontFamily: FONTS.PoppinsSemiBold,
  },

  // --- Estilos del Footer ---
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingTop: 8,
    paddingBottom: 25, 
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
  },
  actionButton: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    flex: 1, 
    minHeight: 55,
  },
  actionButtonText: {
    fontFamily: FONTS.PoppinsRegular,
    fontSize: 11,
    color: COLORS.black,
    marginTop: 4,
  }
});

export default AdminHome;