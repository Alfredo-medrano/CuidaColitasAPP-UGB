import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, TouchableOpacity, StatusBar } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import { usePets } from '../../hooks/usePets';

// Componente para renderizar cada tarjeta de mascota (MANTENIENDO ESTILOS ORIGINALES)
const PetCard = ({ pet, onPress }) => {
  const getStatusStyle = (status) => {
    switch (status) {
      case 'En Tratamiento':
        return { container: { backgroundColor: '#FFF4CC' }, text: { color: '#CDA37B' } };
      default:
        // Si no tiene status, o es 'Activo'
        return { container: { backgroundColor: '#A8E6DC80' }, text: { color: '#027A74' } };
    }
  };

  // Accedemos directamente a pet.status (string simple en el esquema)
  const petStatusName = pet.status || 'Activo';
  const statusStyle = getStatusStyle(petStatusName);

  // Evitar fallos si birth_date es nulo
  const age = pet.birth_date
    ? `${new Date().getFullYear() - new Date(pet.birth_date).getFullYear()} años`
    : 'N/A';

  // Calcular Próxima Cita y Última Visita
  const getAppointmentInfo = () => {
    if (!pet.appointments || pet.appointments.length === 0) {
      return { next: null, last: null };
    }

    const now = new Date();

    // Ordenar citas por fecha
    const sortedAppointments = [...pet.appointments].sort((a, b) =>
      new Date(a.appointment_time) - new Date(b.appointment_time)
    );

    // Próxima cita: Primera cita futura con estado válido
    const nextAppt = sortedAppointments.find(appt => {
      const apptDate = new Date(appt.appointment_time);
      const status = appt.status?.status;
      return apptDate > now && status !== 'Cancelada' && status !== 'Completada' && status !== 'Perdida';
    });

    // Última visita: Última cita pasada (idealmente completada)
    // Filtramos las pasadas y tomamos la última
    const pastAppts = sortedAppointments.filter(appt => new Date(appt.appointment_time) < now);
    const lastAppt = pastAppts.length > 0 ? pastAppts[pastAppts.length - 1] : null;

    return { next: nextAppt, last: lastAppt };
  };

  const { next, last } = getAppointmentInfo();

  const nextAppointmentDate = next
    ? new Date(next.appointment_time).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Sin agendar';

  const lastVisitDate = last
    ? new Date(last.appointment_time).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Sin registro';

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.petIcon}>
          <Ionicons name="paw-outline" size={24} color={COLORS.accent} />
        </View>
        <View style={styles.petTitle}>
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petBreed}>{pet.species?.name || 'N/A'} • {pet.breed || 'No especificado'}</Text>
        </View>
        <View style={[styles.statusBadge, statusStyle.container]}>
          <Text style={[styles.statusText, statusStyle.text]}>{petStatusName}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.detailText}>Edad: {age}</Text>
        <Text style={styles.detailText}>Peso: {pet.weight_kg || 'N/A'} kg</Text>
        <Text style={styles.detailText}>Veterinario: Dr. {pet.veterinarian?.name?.split(' ')[0] || 'No asignado'}</Text>
        <Text style={styles.detailText}>Última visita: {lastVisitDate}</Text>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.nextAppointmentLabel}>Próxima Cita</Text>
          <Text style={styles.nextAppointmentDate}>{nextAppointmentDate}</Text>
        </View>
        <TouchableOpacity style={styles.historyButton} onPress={onPress}>
          <Ionicons name="eye-outline" size={20} color={COLORS.white} />
          <Text style={styles.historyButtonText}>Ver Historial</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function MisMascotas({ navigation }) {
  // Hook estandarizado
  const {
    data: pets,
    isLoading,
    error,
    refetch
  } = usePets();

  const [filteredPets, setFilteredPets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const isFocused = useIsFocused();

  // Recargar mascotas al enfocar la pantalla
  useEffect(() => {
    if (isFocused) {
      refetch();
    }
  }, [isFocused, refetch]);

  // Filtrado local por nombre
  useEffect(() => {
    const petList = Array.isArray(pets) ? pets : [];
    if (searchTerm) {
      const filtered = petList.filter(pet =>
        (pet.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPets(filtered);
    } else {
      setFilteredPets(petList);
    }
  }, [searchTerm, pets]);

  // Render según estados (carga / error / vacío / lista)
  const renderContent = () => {
    // Carga inicial
    if (isLoading && (!pets || pets.length === 0)) {
      return <ActivityIndicator size="large" color={COLORS.accent} style={styles.centered} />;
    }

    // Error
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={COLORS.red || '#FF0000'} />
          <Text style={styles.errorTextTitle}>Error de Carga</Text>
          <Text style={styles.errorTextDetail}>No se pudieron cargar tus mascotas: {error}</Text>
          <TouchableOpacity onPress={refetch} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Vacío sin búsqueda
    if ((pets && pets.length === 0) && !searchTerm) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons
            name="paw-outline"
            size={60}
            color={typeof COLORS.secondary === 'string' ? `${COLORS.secondary}50` : '#7185D850'}
          />
          <Text style={styles.emptyText}>Aún no tienes mascotas registradas.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('NuevoPaciente')} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Registrar Mascota</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Lista filtrada
    return (
      <FlatList
        data={filteredPets}
        renderItem={({ item }) => (
          <PetCard
            pet={item}
            onPress={() => navigation.navigate('HistorialMedicoC', {
              petId: item.id,
              petName: item.name,
              petSpecies: item.species?.name || 'Especie no definida'
            })}
          />
        )}
        keyExtractor={(item) => item.id?.toString?.() ?? String(item.id)}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isLoading}
        ListEmptyComponent={
          searchTerm ? (
            <View style={styles.centered}>
              <Text style={styles.emptyText}>No se encontraron mascotas con ese nombre.</Text>
            </View>
          ) : null
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Mascotas</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search-outline"
          size={22}
          color={typeof COLORS.primary === 'string' ? `${COLORS.primary}80` : '#01384780'}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar mascota..."
          placeholderTextColor={typeof COLORS.primary === 'string' ? `${COLORS.primary}80` : '#01384780'}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <View style={styles.listContainer}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: COLORS.primary },
  headerButton: { width: 30 },
  headerTitle: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.h2, color: COLORS.textPrimary },

  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.secondary, borderRadius: 12, marginHorizontal: 20, marginVertical: 10, paddingHorizontal: 15 },
  searchInput: { flex: 1, height: 50, fontFamily: FONTS.PoppinsRegular, fontSize: 16, color: COLORS.primary, marginLeft: 10 },

  listContainer: { flex: 1 }, // Contenedor para la lista (necesario para el FlatList)
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50, paddingHorizontal: 20 },

  emptyText: { fontFamily: FONTS.PoppinsRegular, fontSize: 16, color: COLORS.secondary, textAlign: 'center', marginTop: 10 },
  list: { paddingHorizontal: 20, paddingBottom: 20 },

  card: { backgroundColor: COLORS.card, borderRadius: 16, marginBottom: 15, overflow: 'hidden', borderColor: COLORS.border, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', padding: 15, alignItems: 'flex-start' },
  petIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: (typeof COLORS.accent === 'string' ? `${COLORS.accent}30` : '#43C0AF30'), justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  petTitle: { flex: 1 },
  petName: { fontFamily: FONTS.PoppinsBold, fontSize: 18, color: COLORS.textPrimary },
  petBreed: { fontFamily: FONTS.PoppinsRegular, fontSize: 14, color: COLORS.secondary },
  statusBadge: { borderRadius: 12, paddingVertical: 5, paddingHorizontal: 12 },
  statusText: { fontFamily: FONTS.PoppinsBold, fontSize: 12 },
  cardBody: { paddingHorizontal: 20, paddingBottom: 15 },
  detailText: { fontFamily: FONTS.PoppinsRegular, fontSize: 14, color: COLORS.secondary, marginBottom: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: (typeof COLORS.primary === 'string' ? `${COLORS.primary}10` : '#01384710'), padding: 15 },
  nextAppointmentLabel: { fontFamily: FONTS.PoppinsRegular, fontSize: 12, color: COLORS.secondary },
  nextAppointmentDate: { fontFamily: FONTS.PoppinsBold, fontSize: 16, color: COLORS.textPrimary },
  historyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 15 },
  historyButtonText: { fontFamily: FONTS.PoppinsSemiBold, color: COLORS.white, marginLeft: 8 },

  // ESTILOS DE ESTADO (error/empty)
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40, marginTop: 50 },
  errorTextTitle: { fontFamily: FONTS.PoppinsBold, fontSize: SIZES.h2, color: COLORS.red || '#FF0000', marginVertical: 10 },
  errorTextDetail: { fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.body4, color: COLORS.card || '#666', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: COLORS.accent, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  retryButtonText: { fontFamily: FONTS.PoppinsSemiBold, color: COLORS.white, fontSize: SIZES.body3 },
});
