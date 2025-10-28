// src/screens/Vet/Profile.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { supabase } from '../../api/Supabase';
import { useAuth } from '../../context/AuthContext'; // 👈 usa el contexto
import { COLORS, FONTS, SIZES } from '../../theme/theme';

// ---------------------- UI Atoms ----------------------
const Pill = ({ children, bg, color }) => (
  <View style={[styles.pill, { backgroundColor: bg }]}>
    <Text style={[styles.pillText, { color }]}>{children}</Text>
  </View>
);

const StatCard = ({ icon, value, label, tone = 'blue' }) => {
  const tones = {
    blue: { bg: COLORS.lightBlue, fg: COLORS.card },
    red: { bg: COLORS.lightRed, fg: COLORS.red },
    green: { bg: COLORS.lightGreen, fg: COLORS.accent },
  };
  return (
    <View style={[styles.statCard, { backgroundColor: tones[tone].bg }]}>
      <Ionicons name={icon} size={24} color={tones[tone].fg} />
      <Text style={[styles.statValue, { color: COLORS.primary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: COLORS.card }]}>{label}</Text>
    </View>
  );
};

const Row = ({ icon, label, value }) => (
  <View style={styles.row}>
    <Ionicons name={icon} size={18} color={COLORS.card} style={{ width: 22 }} />
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={styles.rowValue}>{value || '—'}</Text>
  </View>
);

// ---------------------- Header ----------------------
const Header = ({ name, title }) => (
  <View style={styles.headerContainer}>
    <View style={styles.headerLeft}>
      <View style={styles.headerAvatar}>
        <Ionicons name="medical" size={26} color={COLORS.white} />
      </View>
      <View style={{ marginLeft: 12 }}>
        <Text style={styles.headerName}>{name || 'Veterinario'}</Text>
        <Text style={styles.headerSubtitle}>{title || 'Médico General Veterinario'}</Text>
      </View>
    </View>
  </View>
);

// ---------------------- Main ----------------------
export default function Profile({ navigation }) {
  const { session } = useAuth();
  const { avatarUrl } = useAuth(); // 👈 URL firmada lista para <Image/>
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ todayAppointments: 0, inTreatment: 0 });
  const [recentPatients, setRecentPatients] = useState([]);

  const userId = session?.user?.id;
  const userEmail = session?.user?.email || '';

  const loadData = useCallback(async () => {
    if (!userId) return;
    try {
      setLoading(true);

      // 1) Perfil + Rol + Clínica
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select(`
          id,name,title,phone_number,college_id,address,avatar_url,created_at,
          roles:role_id ( name ),
          clinics:clinic_id ( name,address,phone_number )
        `)
        .eq('id', userId)
        .single();

      if (profErr) throw profErr;

      const normalized = {
        ...prof,
        role: prof?.roles?.name || 'veterinario',
        clinic: prof?.clinics?.name || 'Clínica Veterinaria CuidaColitas',
        clinic_address: prof?.clinics?.address || '',
        clinic_phone: prof?.clinics?.phone_number || '',
        email: userEmail,
      };
      setProfile(normalized);

      // 2) Estadística "Citas de hoy" (Programada/Confirmada)
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: stRows, error: stErr } = await supabase
        .from('appointment_status')
        .select('id,status')
        .in('status', ['Programada', 'Confirmada']);
      if (stErr) throw stErr;
      const statusIds = (stRows || []).map(r => r.id);

      const { count: apptCount, error: apptErr } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .eq('vet_id', userId)
        .gte('appointment_time', todayStart.toISOString())
        .lte('appointment_time', todayEnd.toISOString())
        .in('status_id', statusIds);
      if (apptErr) throw apptErr;

      // 3) "En Tratamiento"
      const { count: inTreat, error: petErr } = await supabase
        .from('pets')
        .select('id', { count: 'exact', head: true })
        .eq('primary_vet_id', userId)
        .eq('status', 'En Tratamiento');
      if (petErr) throw petErr;

      setStats({
        todayAppointments: apptCount || 0,
        inTreatment: inTreat || 0,
      });

      // 4) Pacientes recientes
      const { data: recent, error: recErr } = await supabase
        .from('appointments')
        .select(`
          id, appointment_time, reason,
          pets:pet_id ( id, name, species_id, status ),
          owner:client_id ( name ),
          medical_records ( treatment )
        `)
        .eq('vet_id', userId)
        .order('appointment_time', { ascending: false })
        .limit(3);
      if (recErr) throw recErr;

      const pretty = (recent || []).map(a => {
        let tag = 'Control rutinario';
        const txt = (a?.reason || '').toLowerCase();
        if (a?.medical_records?.length && a.medical_records[0]?.treatment) tag = 'Tratamiento';
        else if (txt.includes('post') || txt.includes('sutura') || txt.includes('operat')) tag = 'Postoperatorio';
        else if (a?.pets?.status === 'En Tratamiento') tag = 'Tratamiento';

        return {
          id: a.id,
          petName: a?.pets?.name || 'Paciente',
          ownerName: a?.owner?.name || 'Dueño',
          tag,
        };
      });

      setRecentPatients(pretty);
    } catch (e) {
      Alert.alert('Error', e?.message || 'No se pudo cargar el perfil.');
    } finally {
      setLoading(false);
    }
  }, [userId, userEmail]);

  useEffect(() => {
    if (isFocused && userId) loadData();
  }, [isFocused, userId, loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const memberSince = useMemo(() => {
    if (!profile?.created_at) return '—';
    return new Date(profile.created_at).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
    });
  }, [profile?.created_at]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      Alert.alert('Error', 'No se pudo cerrar sesión.');
    }
  };

  if (loading && !profile) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const placeholder = 'https://via.placeholder.com/100/43C0AF/013847?text=VET';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.card]} tintColor={COLORS.card} />}
    >
      {/* Header */}
      <Header name={profile?.name || 'Dr. González'} title={profile?.title || 'Médico General Veterinario'} />

      {/* Card Perfil */}
      <View style={styles.userCard}>
        <Image
          source={{ uri: avatarUrl || profile?.avatar_url || placeholder }} // 👈 usa avatarUrl del contexto
          style={styles.avatar}
        />
        <Text style={styles.userName}>{profile?.name || 'Dr. González'}</Text>
        <Text style={styles.userSubtitle}>
          {profile?.title || 'Médico General Veterinario'} · {profile?.clinic || 'Clínica Veterinaria CuidaColitas'}
        </Text>
        <View style={{ flexDirection: 'row', marginTop: 8 }}>
          <Pill bg={COLORS.lightGreen} color={COLORS.accent}>{profile?.role === 'cliente' ? 'Cliente' : 'Veterinario'}</Pill>
          <View style={{ width: 8 }} />
          <Pill bg={COLORS.lightBlue} color={COLORS.card}>Miembro desde {memberSince}</Pill>
        </View>
      </View>

      {/* Información Profesional */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Información Profesional</Text>
        <View style={styles.infoCard}>
          <Row icon="mail-outline" label="Correo" value={profile?.email} />
          <Row icon="call-outline" label="Teléfono" value={profile?.phone_number || '+34 911 123 456'} />
          <Row icon="document-text-outline" label="Colegiado" value={profile?.college_id || 'COV-28-5678'} />
          <Row icon="location-outline" label="Dirección" value={profile?.address || 'Calle Veterinarios 123, Madrid'} />
        </View>
      </View>

      {/* Estadísticas de Hoy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas de Hoy</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="calendar-outline" value={stats.todayAppointments} label="Citas" tone="blue" />
          <StatCard icon="medkit-outline" value={stats.inTreatment} label="En Tratamiento" tone="green" />
        </View>
      </View>

      {/* Pacientes Recientes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pacientes Recientes</Text>
        <View style={styles.listCard}>
          {(recentPatients || []).map(p => (
            <View key={p.id} style={styles.patientItem}>
              <View style={styles.patientIcon}>
                <Ionicons name="paw-outline" size={18} color={COLORS.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.patientTitle}>{p.petName}</Text>
                <Text style={styles.patientSub}>de {p.ownerName}</Text>
              </View>
              <Pill bg={COLORS.lightBlue} color={COLORS.card}>{p.tag}</Pill>
            </View>
          ))}
          {(!recentPatients || recentPatients.length === 0) && (
            <Text style={styles.emptyText}>Sin atenciones recientes.</Text>
          )}
        </View>
      </View>

      {/* Acciones */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary]}
          onPress={() => navigation.navigate('EditProfile', { profile })}
        >
          <Ionicons name="create-outline" size={18} color={COLORS.white} />
          <Text style={styles.btnText}>Editar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.btnDanger]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={18} color={COLORS.white} />
          <Text style={styles.btnText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

// ---------------------- Styles ----------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.secondary },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  headerContainer: { paddingVertical: 20 },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.accent, alignItems: 'center', justifyContent: 'center',
  },
  headerName: { fontFamily: FONTS.PoppinsBold, fontSize: SIZES.h2, color: COLORS.textPrimary, lineHeight: 26 },
  headerSubtitle: { fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.caption, color: COLORS.textPrimary },

  userCard: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 20, alignItems: 'center',
    shadowColor: COLORS.black, shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 4, marginBottom: 24,
  },
  avatar: { width: 92, height: 92, borderRadius: 46, borderWidth: 3, borderColor: COLORS.card, marginBottom: 10 },
  userName: { fontFamily: FONTS.PoppinsBold, fontSize: SIZES.h3, color: COLORS.primary },
  userSubtitle: { fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.body, color: COLORS.card },

  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  pillText: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.caption },

  section: { marginBottom: 22 },
  sectionTitle: { fontFamily: FONTS.PoppinsBold, fontSize: SIZES.h3, color: COLORS.textPrimary, marginBottom: 10 },

  infoCard: {
    backgroundColor: COLORS.white, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 14,
    borderWidth: 1, borderColor: COLORS.secondary,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.secondary,
  },
  rowLabel: { width: 110, marginLeft: 6, fontFamily: FONTS.PoppinsSemiBold, color: COLORS.primary, fontSize: SIZES.body },
  rowValue: { flex: 1, textAlign: 'right', fontFamily: FONTS.PoppinsRegular, color: COLORS.card, fontSize: SIZES.body },

  statsGrid: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1, borderRadius: 12, padding: 14, alignItems: 'flex-start',
    borderWidth: 1, borderColor: COLORS.secondary,
  },
  statValue: { fontFamily: FONTS.PoppinsBold, fontSize: SIZES.h2, marginTop: 6 },
  statLabel: { fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.caption, marginTop: 2 },

  listCard: {
    backgroundColor: COLORS.white, borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: COLORS.secondary,
  },
  patientItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: COLORS.secondary,
  },
  patientIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  patientTitle: { fontFamily: FONTS.PoppinsSemiBold, color: COLORS.primary, fontSize: SIZES.body },
  patientSub: { fontFamily: FONTS.PoppinsRegular, color: COLORS.card, fontSize: SIZES.caption },
  emptyText: { textAlign: 'center', paddingVertical: 12, color: COLORS.card, fontFamily: FONTS.PoppinsRegular },

  actionsRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  btn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  btnPrimary: { backgroundColor: COLORS.card },
  btnDanger: { backgroundColor: COLORS.red },
  btnText: { color: COLORS.white, fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.body },
});
