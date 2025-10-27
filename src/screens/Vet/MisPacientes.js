import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons'; 
import { supabase } from '../../api/Supabase';
import { useIsFocused } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SIZES } from '../../theme/theme'; 

// --------------------------------------------------------
// --- UTILITIES ---
// --------------------------------------------------------

const calculateAge = (birthDate) => {
  if (!birthDate) return 'Desconocida';
  const birth = new Date(birthDate);
  const today = new Date();
  const years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();
  if (years > 0) return `${years} años`;
  if (months > 0) return `${months} meses`;
  return 'Menos de 1 mes';
};

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

// --------------------------------------------------------
// --- HOOK: usePets ---
// --------------------------------------------------------

const baseSelect = `
  id,
  name,
  breed,
  birth_date,
  status,
  owner:profiles!owner_id ( id, name, phone_number ),
  species:species_id ( name ),
  appointments (
    appointment_time,
    status:status_id ( status )
  )
`;

const usePets = (searchTerm, role) => {
  const { profile } = useAuth(); 
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userId = profile?.id;

  const fetchPets = useCallback(async () => {
    if (!userId) { setLoading(false); return; }

    try {
      setLoading(true);
      setError(null);

      const t = searchTerm?.trim();

      // --- CLIENTE: simple y directo
      if (role !== 'veterinario') {
        let query = supabase.from('pets').select(baseSelect).eq('owner_id', userId);
        if (t) query = query.ilike('name', `*${t}*`);
        const { data, error } = await query.order('name', { ascending: true });
        if (error) throw error;

        const processed = (data ?? []).map(pet => {
          const petAppointments = (pet.appointments ?? [])
            .filter(a => a.status?.status !== 'Cancelada' && a.status?.status !== 'No Asistió')
            .sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time));

          const now = new Date();
          const nextA = petAppointments.find(a =>
            new Date(a.appointment_time) > now &&
            ['Programada','Confirmada','Pendiente'].includes(a.status?.status)
          );
          const lastA = [...petAppointments]
            .filter(a => new Date(a.appointment_time) <= now && a.status?.status === 'Completada')
            .sort((a,b)=> new Date(b.appointment_time) - new Date(a.appointment_time))[0];

          return {
            id: pet.id,
            name: pet.name,
            ownerId: pet.owner?.id,
            ownerName: pet.owner?.name,
            phone: pet.owner?.phone_number || 'N/A',
            type: pet.species?.name,
            breed: pet.breed || 'Raza no definida',
            age: calculateAge(pet.birth_date),
            lastVisit: lastA ? formatDate(lastA.appointment_time) : 'Nunca',
            nextAppointment: nextA ? formatDate(nextA.appointment_time) : 'No programada',
            status: pet.status,
          };
        });

        setPets(processed);
        return;
      }

      // --- VETERINARIO: dos consultas y unimos resultados (sin .or() con relación)
      const results = new Map(); // dedupe por id

      // A) Buscar por nombre de mascota
      {
        let q = supabase
          .from('pets')
          .select(baseSelect)
          .eq('primary_vet_id', userId);

        if (t) q = q.ilike('name', `*${t}*`);

        const { data, error } = await q.order('name', { ascending: true });
        if (error) throw error;
        for (const pet of (data ?? [])) results.set(pet.id, pet);
      }

      // B) Si hay término, buscar por nombre del dueño
      if (t) {
        // 1. Traer IDs de perfiles cuyo nombre haga match
        const { data: owners, error: ownersErr } = await supabase
          .from('profiles')
          .select('id')
          .ilike('name', `*${t}*`);
        if (ownersErr) throw ownersErr;

        const ownerIds = (owners ?? []).map(o => o.id);
        if (ownerIds.length) {
          // 2. Traer mascotas de esos dueños, pero SOLO del vet actual
          const { data, error } = await supabase
            .from('pets')
            .select(baseSelect)
            .eq('primary_vet_id', userId)
            .in('owner_id', ownerIds)
            .order('name', { ascending: true });
          if (error) throw error;
          for (const pet of (data ?? [])) results.set(pet.id, pet);
        }
      }

      // Procesar salida unificada
      const unified = Array.from(results.values()).map(pet => {
        const petAppointments = (pet.appointments ?? [])
          .filter(a => a.status?.status !== 'Cancelada' && a.status?.status !== 'No Asistió')
          .sort((a, b) => new Date(a.appointment_time) - new Date(b.appointment_time));

        const now = new Date();
        const nextA = petAppointments.find(a =>
          new Date(a.appointment_time) > now &&
          ['Programada','Confirmada','Pendiente'].includes(a.status?.status)
        );
        const lastA = [...petAppointments]
          .filter(a => new Date(a.appointment_time) <= now && a.status?.status === 'Completada')
          .sort((a,b)=> new Date(b.appointment_time) - new Date(a.appointment_time))[0];

        return {
          id: pet.id,
          name: pet.name,
          ownerId: pet.owner?.id,
          ownerName: pet.owner?.name,
          phone: pet.owner?.phone_number || 'N/A',
          type: pet.species?.name,
          breed: pet.breed || 'Raza no definida',
          age: calculateAge(pet.birth_date),
          lastVisit: lastA ? formatDate(lastA.appointment_time) : 'Nunca',
          nextAppointment: nextA ? formatDate(nextA.appointment_time) : 'No programada',
          status: pet.status,
        };
      });

      // Orden final por nombre (por si el Map mezcló)
      unified.sort((a,b)=> (a.name || '').localeCompare(b.name || ''));
      setPets(unified);

    } catch (err) {
      console.error('Error fetching pets (MisPacientes):', err);
      setError(err.message || 'Error desconocido al cargar los pacientes.');
    } finally {
      setLoading(false);
    }
  }, [userId, searchTerm, role]);

  useEffect(() => { fetchPets(); }, [fetchPets]);
  return { pets, loading, error, refetch: fetchPets };
};

// --------------------------------------------------------
// --- UI: Card + Pantalla ---
// --------------------------------------------------------

const getStatusStyles = (status) => {
  switch (status) {
    case 'En Tratamiento': return { bg: COLORS.lightRed, text: COLORS.red, label: 'Tratamiento' };
    case 'En Revisión':   return { bg: COLORS.lightBlue, text: COLORS.card, label: 'En Revisión' };
    case 'Activo':        return { bg: COLORS.lightGreen, text: COLORS.primary, label: 'Activo' };
    default:              return { bg: COLORS.secondary, text: COLORS.primary, label: status };
  }
};

const PatientCard = ({ patient, navigation, userRole, onDelete }) => {
  const { id, name, ownerName, ownerId, type, breed, age, phone, lastVisit, nextAppointment, status } = patient;
  const { bg, text, label } = getStatusStyles(status);

  return (
    <View style={patientStyles.card}>
      <View style={patientStyles.mainInfo}>
        <Ionicons name={type === 'Gato' ? 'paw' : 'bonfire'} size={28} color={COLORS.primary} style={{ marginRight: 15 }} />
        <View style={patientStyles.details}>
          <Text style={patientStyles.petName}>{name}</Text>
          <Text style={patientStyles.ownerName}>Dueño: {ownerName} • Tel: {phone}</Text>
          <View style={patientStyles.badgeContainer}>
            <Text style={patientStyles.petDetails}>{type} – {breed} • {age}</Text>
            <View style={[patientStyles.statusBadge, { backgroundColor: bg }]}>
              <Text style={[patientStyles.statusText, { color: text }]}>{label}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={patientStyles.secondaryInfo}>
        <Text style={patientStyles.secondaryText}>
          <Ionicons name="time-outline" size={SIZES.caption} color={COLORS.card} />
          <Text>{' Última Visita: '}</Text>
          <Text>{lastVisit}</Text>
        </Text>
        <Text style={patientStyles.secondaryText}>
          <Ionicons name="calendar-outline" size={SIZES.caption} color={COLORS.card} />
          <Text>{' Próxima Cita: '}</Text>
          <Text style={patientStyles.appointmentDate}>{nextAppointment}</Text>
        </Text>
      </View>

      <View style={patientStyles.actions}>
        <TouchableOpacity style={patientStyles.actionButton} onPress={() => navigation.navigate('HistorialMedico', { patientId: id, petName: name, ownerName })}>
          <Ionicons name="eye-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={patientStyles.actionButton} onPress={() => navigation.navigate('DetallePaciente', { petId: id, mode: 'edit' })}>
          <Ionicons name="create-outline" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[patientStyles.actionButton, patientStyles.calendarActionButton]} onPress={() => navigation.navigate('NuevaCita', { petId: id, petName: name, ownerId })}>
          <Ionicons name="calendar" size={20} color={COLORS.white} />
        </TouchableOpacity>
        {userRole === 'veterinario' && (
          <TouchableOpacity style={patientStyles.actionButton} onPress={() => onDelete(id, name)}>
            <Ionicons name="trash-outline" size={20} color={COLORS.red} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default function MisPacientes({ navigation }) {
  const { profile } = useAuth();
  const isFocused = useIsFocused();
  const userRole = profile?.roles?.name; 
  const [searchTerm, setSearchTerm] = useState('');
  const { pets, loading, error, refetch } = usePets(searchTerm, userRole); 

  useEffect(() => { if (isFocused) refetch(); }, [isFocused, refetch]);
  useEffect(() => { if (error) Alert.alert('Error de Carga', error); }, [error]);

  const handleAddPatient = () => navigation.navigate('NuevoPaciente');
  const handleDeletePet = async (petId, petName) => {
    Alert.alert('Confirmar Eliminación', `¿Estás seguro de que quieres eliminar a ${petName}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
        const { error } = await supabase.from('pets').delete().eq('id', petId);
        if (error) Alert.alert('Error', 'No se pudo eliminar la mascota. Revisa permisos.');
        else { Alert.alert('Éxito', `${petName} ha sido eliminado.`); refetch(); }
      }},
    ]);
  };

  if (loading && pets.length === 0) {
    return (
      <View style={patientStyles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
        <Text style={{ color: COLORS.textPrimary, marginTop: 10, fontFamily: FONTS.PoppinsRegular }}>Cargando pacientes...</Text>
      </View>
    );
  }

  const headerTitle = userRole === 'veterinario' ? 'Mis Pacientes' : 'Mis Mascotas';

  return (
    <SafeAreaView style={patientStyles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <View style={patientStyles.header}>
        <View style={patientStyles.searchContainer}>
          <Ionicons name="search" size={20} color={COLORS.primary} style={patientStyles.searchIcon} />
          <TextInput
            style={patientStyles.searchInput}
            placeholder={userRole === 'veterinario' ? 'Buscar por nombre del dueño...' : 'Buscar por nombre de mascota...'}
            placeholderTextColor={COLORS.card}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        {userRole === 'veterinario' && (
          <TouchableOpacity style={patientStyles.addButton} onPress={handleAddPatient}>
            <Ionicons name="add" size={24} color={COLORS.primary} />
            <Text style={patientStyles.addButtonText}>Nuevo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ paddingHorizontal: 15, paddingVertical: 10, backgroundColor: COLORS.primary }}>
        <Text style={patientStyles.sectionTitle}>{headerTitle}</Text>
      </View>

      <FlatList
        data={pets}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <PatientCard patient={item} navigation={navigation} userRole={userRole} onDelete={handleDeletePet} />
        )}
        contentContainerStyle={patientStyles.listContent}
        ListEmptyComponent={() => (
          <Text style={patientStyles.emptyText}>
            {searchTerm?.trim() ? `No se encontraron resultados para "${searchTerm}".` : 'No hay registros de pacientes para mostrar.'}
          </Text>
        )}
        onRefresh={refetch}
        refreshing={loading}
      />
    </SafeAreaView>
  );
}

// --------------------------------------------------------
// --- STYLES ---
// --------------------------------------------------------

const patientStyles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: COLORS.primary },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10,
    backgroundColor: COLORS.primary, borderBottomLeftRadius: 15, borderBottomRightRadius: 15,
  },
  sectionTitle: { fontFamily: FONTS.PoppinsBold, fontSize: SIZES.h2, color: COLORS.textPrimary, marginBottom: 10 },
  searchContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.secondary, borderRadius: 10, paddingHorizontal: 10, marginRight: 10,
  },
  searchIcon: { marginRight: 5, opacity: 0.9, color: COLORS.primary },
  searchInput: { flex: 1, height: 40, fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.body, color: COLORS.primary },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.accent, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  addButtonText: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.body, color: COLORS.primary, marginLeft: 5 },
  listContent: { paddingHorizontal: 15, paddingTop: 10, paddingBottom: 20, backgroundColor: COLORS.primary },
  card: {
    backgroundColor: COLORS.white, borderRadius: 12, padding: 15, marginBottom: 10,
    shadowColor: COLORS.black, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3,
    borderLeftWidth: 5, borderColor: COLORS.accent,
  },
  mainInfo: { flexDirection: 'row', alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: COLORS.secondary, paddingBottom: 10, marginBottom: 10 },
  details: { flex: 1 },
  petName: { fontFamily: FONTS.PoppinsBold, fontSize: SIZES.h3, color: COLORS.primary, marginBottom: 2 },
  ownerName: { fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.body, color: COLORS.card },
  badgeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  petDetails: { fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.caption, color: COLORS.card, marginRight: 10 },
  secondaryInfo: { marginBottom: 10 },
  secondaryText: { fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.caption, color: COLORS.primary, marginBottom: 3, lineHeight: 18 },
  appointmentDate: { fontFamily: FONTS.PoppinsSemiBold, color: COLORS.accent },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.caption },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingTop: 5 },
  actionButton: { backgroundColor: COLORS.secondary, borderRadius: 8, padding: 8, marginLeft: 10 },
  calendarActionButton: { backgroundColor: COLORS.accent },
  emptyText: { textAlign: 'center', fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.h3, color: COLORS.secondary, marginTop: 50 },
});
