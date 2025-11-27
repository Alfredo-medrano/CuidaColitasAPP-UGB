import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../../theme/theme';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AdminLayout from '../../components/admin/AdminLayout';
import SearchBar from '../../components/admin/common/SearchBar';
import UserCard from '../../components/admin/common/UserCard';
import LoadingState from '../../components/admin/common/LoadingState';
import EmptyState from '../../components/admin/common/EmptyState';
import NewVetModal from '../../components/admin/NewVetModal';
import { useAdminData } from '../../hooks/admin/useAdminData';
import { useSearch } from '../../hooks/admin/useSearch';
import { supabase } from '../../api/Supabase';

export default function GestionVets({ navigation }) {
  const { fetchVets, refreshVets, loading } = useAdminData();
  const [vets, setVets] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const { query, setQuery, filteredData, clearSearch } = useSearch(vets, ['name', 'email', 'phone_number', 'college_id']);

  useFocusEffect(
    React.useCallback(() => {
      loadVets();
    }, [])
  );

  const loadVets = async () => {
    const data = await fetchVets();
    setVets(data);
  };

  const handleRefresh = async () => {
    const data = await refreshVets();
    setVets(data);
  };

  const handleEdit = (vet) => {
    navigation.navigate('EditVet', { vetId: vet.id });
  };

  const handleToggleActive = async (vet) => {
    const action = vet.is_active === false ? 'reactivar' : 'desactivar';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Veterinario`,
      `¿Estás seguro de ${action} a ${vet.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: vet.is_active === false ? 'default' : 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.rpc(
                vet.is_active === false ? 'reactivate_user' : 'deactivate_user',
                { user_id: vet.id }
              );
              if (error) throw error;
              Alert.alert('Éxito', `Veterinario ${action === 'desactivar' ? 'desactivado' : 'reactivado'} correctamente`);
              loadVets();
            } catch (error) {
              console.error(error);
              Alert.alert('Error', `No se pudo ${action} el veterinario`);
            }
          },
        },
      ]
    );
  };

  const handleDelete = (vet) => {
    Alert.alert(
      '⚠️ Eliminar Permanentemente',
      `Esta acción BORRARÁ todos los datos de ${vet.name} y NO se puede deshacer.\n\n¿Estás completamente seguro?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.rpc('delete_veterinarian_permanently', {
                p_vet_id: vet.id,
              });
              if (error) throw error;
              Alert.alert('Éxito', 'Veterinario eliminado permanentemente');
              loadVets();
            } catch (error) {
              console.error(error);
              Alert.alert('Error', 'No se pudo eliminar el veterinario: ' + (error.message || 'Error desconocido'));
            }
          },
        },
      ]
    );
  };

  const handleModalClose = () => {
    setModalVisible(false);
    loadVets();
  };

  return (
    <AdminLayout navigation={navigation}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Gestión de Veterinarios</Text>
        <Text style={styles.headerSubtitle}>{vets.length} registrados</Text>
      </View>

      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar por nombre, email o teléfono..."
        onClear={clearSearch}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <MaterialCommunityIcons name="plus-circle" size={24} color={COLORS.white} />
        <Text style={styles.addButtonText}>Nuevo Veterinario</Text>
      </TouchableOpacity>

      {loading ? (
        <LoadingState type="card" count={5} />
      ) : filteredData.length === 0 ? (
        <EmptyState
          icon="stethoscope"
          title={query ? 'Sin resultados' : 'No hay veterinarios'}
          message={query ? 'No se encontraron veterinarios que coincidan con tu búsqueda' : 'Agrega tu primer veterinario'}
          action={!query ? { label: 'Agregar Veterinario', onPress: () => setModalVisible(true) } : null}
        />
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <UserCard
              user={item}
              variant="vet"
              onPress={() => handleEdit(item)}
              actions={[
                { icon: 'create-outline', onPress: () => handleEdit(item), color: COLORS.primary },
                {
                  icon: item.is_active === false ? 'checkmark-circle-outline' : 'pause-circle-outline',
                  onPress: () => handleToggleActive(item),
                  color: item.is_active === false ? '#4CAF50' : '#FF9800',
                },
                { icon: 'trash-outline', onPress: () => handleDelete(item), color: '#F44336' },
              ]}
            />
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
          onRefresh={handleRefresh}
          refreshing={false}
        />
      )}

      <NewVetModal visible={modalVisible} onClose={handleModalClose} />
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  headerContainer: { marginBottom: 20 },
  headerTitle: { fontFamily: FONTS.PoppinsBold, fontSize: SIZES.h2, color: COLORS.white },
  headerSubtitle: { fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.body4, color: COLORS.textPrimary },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
    justifyContent: 'center',
  },
  addButtonText: {
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: SIZES.body3,
    color: COLORS.white,
    marginLeft: 8,
  },
});
