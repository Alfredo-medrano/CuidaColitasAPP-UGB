import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { supabase } from '../../api/Supabase';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import AdminLayout from '../../components/admin/AdminLayout';

const PROFILE_TABLE = 'profiles';

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

export default function AdminHome({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vetCount, setVetCount] = useState(0);
  const [clientCount, setClientCount] = useState(0);

  const fetchCounts = useCallback(async () => {
    setLoading(true);
    try {
      const { data: roles, error: rolesError } = await supabase
        .from('roles').select('id,name').in('name', ['veterinario', 'cliente']);
      if (rolesError) throw rolesError;

      const vetRoleId = roles?.find(r => r.name === 'veterinario')?.id || null;
      let cliRoleId = roles?.find(r => r.name === 'cliente')?.id || null;

      if (!cliRoleId) {
        const { data: rpcCli, error: rpcErr } = await supabase.rpc('get_cliente_role_id');
        if (rpcErr) throw rpcErr;
        cliRoleId = rpcCli;
      }

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

  useEffect(() => { fetchCounts(); }, [fetchCounts]);
  const onRefresh = () => { setRefreshing(true); fetchCounts(); };
  const totalUsers = vetCount + clientCount;

  return (
    <AdminLayout navigation={navigation}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
      >
        <Text style={styles.sectionTitle}>Dashboard</Text>
        <Text style={styles.sectionSubtitle}>Resumen de usuarios activos</Text>

        <View style={styles.cardRow}>
          <DashboardCard icon="stethoscope" iconBg={COLORS.card} title="Veterinarios" value={loading ? '—' : vetCount} />
          <DashboardCard icon="account-group-outline" iconBg="#6B6B6B" title="Clientes" value={loading ? '—' : clientCount} />
        </View>

        <SummaryCard left="Total Usuarios" right={<Text style={styles.summaryValue}>{loading ? '—' : totalUsers}</Text>} />
        <SummaryCard
          left="Estado Sistema"
          right={<><View style={styles.statusDot} /><Text style={styles.statusText}>Operativo</Text></>}
        />

        {loading && <View style={{ marginTop: 8 }}><ActivityIndicator color={COLORS.accent} /></View>}
      </ScrollView>
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: SIZES.h2, fontFamily: FONTS.PoppinsBold, color: COLORS.white, marginTop: 6,
  },
  sectionSubtitle: {
    fontSize: SIZES.caption, fontFamily: FONTS.PoppinsRegular, color: COLORS.textPrimary, marginBottom: 10,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginBottom: 10 },
  card: {
    flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)',
  },
  iconBadge: {
    width: 50, height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  cardTextContainer: { flex: 1 },
  cardTitle: { fontSize: 12, color: '#4E666B', fontFamily: FONTS.PoppinsRegular },
  cardValue: { fontSize: 28, color: COLORS.black, fontFamily: FONTS.PoppinsBold, marginTop: 2 },
  summaryCard: {
    backgroundColor: COLORS.white, paddingVertical: 14, paddingHorizontal: 12, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  summaryValue: { fontSize: 18, color: COLORS.black, fontFamily: FONTS.PoppinsBold },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.accent, marginRight: 6 },
  statusText: { fontSize: SIZES.body, color: COLORS.black, fontFamily: FONTS.PoppinsSemiBold },
});
