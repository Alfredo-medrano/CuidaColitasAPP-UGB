import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert, TextInput } from 'react-native';
import { supabase } from '../../api/Supabase';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MisPacientes({ navigation }) {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const isFocused = useIsFocused();

  const fetchPets = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no encontrado");

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('roles ( name )')
        .eq('id', user.id)
        .single();
      if (profileError) throw profileError;
      
      const role = profileData.roles.name;
      setUserRole(role);

      // CORRECCIÓN: Usamos 'full_name' para el dueño, que es el nombre correcto en la BD.
      let selectFields = `
        id, name, breed, status,
        species:pet_species (name),
        owner:profiles!owner_id (id, name)
      `;
      let query = supabase.from('pets');

      if (role === 'veterinario') {
        query = query.select(selectFields).eq('primary_vet_id', user.id);
        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,owner.name.ilike.%${searchTerm}%`);
        }
      } else { // Cliente
        query = query.select(selectFields).eq('owner_id', user.id);
        if (searchTerm) {
          query = query.ilike('name', `%${searchTerm}%`);
        }
      }

      const { data, error } = await query.order('name', { ascending: true });
      if (error) throw error;
      setPets(data);

    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar los datos.");
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    if (isFocused) {
      fetchPets();
    }
  }, [isFocused, fetchPets]);

  const handleDeletePet = async (petId, petName) => {
    Alert.alert(
      "Confirmar Eliminación",
      `¿Estás seguro de que quieres eliminar a ${petName}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('pets').delete().eq('id', petId);
          if (error) Alert.alert("Error", "No se pudo eliminar la mascota.");
          else {
            Alert.alert("Éxito", `${petName} ha sido eliminado.`);
            fetchPets();
          }
        }},
      ]
    );
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'En Tratamiento':
        return { backgroundColor: '#fff3cd', color: '#856404' };
      case 'En Revisión':
        return { backgroundColor: '#d1ecf1', color: '#0c5460' };
      default: // Activo
        return { backgroundColor: '#d4edda', color: '#155724' };
    }
  };

  const renderItem = ({ item }) => {
    const speciesName = item.species?.name || 'Desconocida';
    const ownerName = item.owner?.name || 'N/A';
    const statusStyle = getStatusStyle(item.status);
    
    // NOTA: Estos datos son simulados. Para que sean reales, necesitaríamos
    // hacer una consulta a la tabla 'appointments'.
    const proximaVisita = "Próx: 2025-10-15";
    const ultimaVisita = "Última visita: 2025-09-01";

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Icon name="paw" size={24} color="#013847" style={styles.pawIcon} />
          <View style={styles.cardTitleContent}>
            <Text style={styles.petName}>{item.name}</Text>
            <Text style={styles.petInfo}>{speciesName} • {item.breed || 'Raza no definida'}</Text>
            {userRole === 'veterinario' && (
              <Text style={styles.ownerInfo}>Dueño: {ownerName}</Text>
            )}
            <Text style={styles.lastVisit}>{ultimaVisita}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusStyle.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusStyle.color }]}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.cardActions}>
          <Text style={styles.nextVisit}>{proximaVisita}</Text>
          <View style={styles.actionButtons}>
            <Pressable style={styles.actionButton} onPress={() => navigation.navigate('HistorialMedico', { petId: item.id, petName: item.name })}>
              <Icon name="eye" size={18} color="#013847" />
            </Pressable>
            <Pressable style={styles.actionButton} onPress={() => navigation.navigate('DetallePaciente', { petId: item.id, mode: 'edit' })}>
              <Icon name="edit" size={18} color="#013847" />
            </Pressable>
            {userRole === 'veterinario' && (
              <>
                <Pressable style={styles.actionButton} onPress={() => navigation.navigate('ChatScreen', { recipientId: item.owner.id, recipientName: ownerName, petName: item.name })}>
                  <Icon name="comment" size={18} color="#013847" />
                </Pressable>
                <Pressable style={styles.actionButton} onPress={() => handleDeletePet(item.id, item.name)}>
                  <Icon name="trash-alt" size={18} color="#d9534f" />
                </Pressable>
              </>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{userRole === 'veterinario' ? 'Mis Pacientes' : 'Mis Mascotas'}</Text>
        {userRole === 'veterinario' && (
          <Pressable style={styles.newButton} onPress={() => navigation.navigate('NuevoPaciente')}>
            <Icon name="plus" size={16} color="#013847" />
            <Text style={styles.newButtonText}>Nuevo</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={userRole === 'veterinario' ? 'Buscar por dueño o mascota...' : 'Buscar por mascota...'}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        <Icon name="search" size={18} color="#666" style={styles.searchIcon} />
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#013847" /></View>
      ) : (
        <FlatList
          data={pets}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No hay registros para mostrar.</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#43c0abc7' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#43C0AF', paddingBottom: 15, paddingHorizontal: 15, paddingTop: 15, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  newButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  newButtonText: { color: '#013847', marginLeft: 5, fontWeight: 'bold' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, marginHorizontal: 15, marginTop: 15, marginBottom: 10, paddingHorizontal: 10, elevation: 2 },
  searchInput: { flex: 1, height: 45, fontSize: 16, color: '#333' },
  searchIcon: { padding: 10 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
  emptyText: { fontSize: 16, color: '#666' },
  list: { paddingHorizontal: 15, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 15, marginBottom: 15, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center' },
  pawIcon: { marginRight: 15 },
  cardTitleContent: { flex: 1 },
  petName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  petInfo: { fontSize: 14, color: '#666', marginTop: 2 },
  ownerInfo: { fontSize: 14, color: '#666', marginTop: 2 },
  lastVisit: { fontSize: 12, color: '#999', marginTop: 5 },
  statusBadge: { borderRadius: 15, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 10 },
  statusText: { fontWeight: 'bold', fontSize: 12 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 15 },
  nextVisit: { fontSize: 14, color: '#013847', fontWeight: 'bold' },
  actionButtons: { flexDirection: 'row' },
  actionButton: { marginLeft: 15, padding: 5 },
});