import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, Dimensions, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SIZES, FONTS } from '../../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../api/Supabase';
import AdminLayout from '../../components/admin/AdminLayout';
import NewVetModal from '../../components/admin/NewVetModal';

const VetCard = ({ vet, onEdit, onDeactivate }) => {
  const isActive = vet.is_verified;
  return (
    <View style={styles.card}>
      <Text style={styles.vetName}>{vet.name || 'Nombre no disponible'}</Text>
      <Text style={styles.vetSpecialty}>{vet.specialties ? vet.specialties.join(', ') : 'Especialidad no definida'}</Text>

      <View style={[styles.statusContainer, isActive ? styles.statusActive : styles.statusPending]}>
        <Text style={[styles.statusText, isActive ? styles.statusActiveText : styles.statusPendingText]}>
          {isActive ? 'Verificado' : 'Pendiente'}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Ionicons name="call-outline" size={16} color={COLORS.gray} />
        <Text style={styles.infoText}>{vet.phone_number || 'Sin teléfono'}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.editButton]} onPress={onEdit}>
          <Ionicons name="pencil" size={16} color={COLORS.primary} />
          <Text style={[styles.buttonText, styles.editButtonText]}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={onDeactivate}>
          <Ionicons name="trash" size={16} color={COLORS.red} />
          <Text style={[styles.buttonText, styles.deleteButtonText]}>
            {isActive ? 'Desactivar' : 'Re-Activar'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function GestionVets({ navigation }) {
  const [vets, setVets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [numColumns, setNumColumns] = useState(2); 
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);  

  useEffect(() => {
    const updateColumns = () => {
      const screenWidth = Dimensions.get('window').width;
      setNumColumns(screenWidth > 600 ? 2 : 1); 
    };

    // Establecer el número de columnas cuando se cambia el tamaño de la pantalla
    updateColumns();
    const subscription = Dimensions.addEventListener('change', updateColumns);

    return () => {
      subscription.remove(); 
    };
  }, []);

  useFocusEffect(useCallback(() => { fetchVets(); }, []));

  const fetchVets = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select(`id, name, phone_number, specialties, is_verified, roles ( name )`)
      .eq('roles.name', 'veterinario');
    if (error) {
      console.error('Error cargando veterinarios:', error.message);
      Alert.alert('Error', 'No se pudieron cargar los veterinarios.');
    } else {
      setVets(data || []);
    }
    setLoading(false);
  };

  const handleEdit = (vet) => navigation.navigate('EditVet', { profileId: vet.id });
  const handleDeactivate = async (vet) => {
    const newStatus = !vet.is_verified;
    const actionText = newStatus ? 'verificar' : 'desactivar';
    const { error } = await supabase.from('profiles').update({ is_verified: newStatus }).eq('id', vet.id);
    if (error) Alert.alert('Error', `No se pudo ${actionText} al veterinario.`);
    else fetchVets();
  };

  return (
    <AdminLayout navigation={navigation}>
      <View style={styles.headerContainer}>
        <Text style={styles.listHeader}>Veterinarios ({vets.length} registrados)</Text>

        <TouchableOpacity style={styles.addVetButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addVetButtonText}>Agregar Nuevo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} />
      ) : (
        <FlatList
          data={vets}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <VetCard
              vet={item}
              onEdit={() => handleEdit(item)}
              onDeactivate={() => handleDeactivate(item)}
            />
          )}
          numColumns={numColumns} 
          key={numColumns} 
          columnWrapperStyle={numColumns > 1 ? styles.cardRow : null} 
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No hay veterinarios registrados.</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 12 }}
        />
      )}
      <NewVetModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </AdminLayout>
  );
}

const styles = StyleSheet.create({
  listHeader: {
    fontFamily: 'Poppins-SemiBold', 
    fontSize: SIZES.h3, 
    color: COLORS.white, 
    marginBottom: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.padding,
  },
  addVetButton: {
    backgroundColor: COLORS.accent,
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addVetButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: SIZES.h4,
  },
  emptyContainer: { marginTop: SIZES.padding * 2, alignItems: 'center' },
  emptyText: { fontFamily: 'Poppins-Regular', fontSize: SIZES.body3, color: COLORS.gray },
  // Resto de estilos...
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: SIZES.padding,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 5,
    padding: 2,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    flex: 1, 
    marginRight: SIZES.padding, 
  },
  vetName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: SIZES.h4,
    color: COLORS.primary,
    marginBottom: 4,
    underline: true,
    textDecorationLine: 'underline',
    textDecorationColor: COLORS.accent,
    textDecorationStyle: 'solid',
    textDecorationThickness: 1,
  },
  vetSpecialty: {
    fontFamily: 'Poppins-Regular',
    fontSize: SIZES.body4,
    color: COLORS.gray,
    marginBottom: 8,
  },
  statusContainer: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  statusActive: {
    backgroundColor: COLORS.lightGreen,
  },
  statusPending: {
    backgroundColor: COLORS.lightRed,
  },
  statusText: {
    fontFamily: 'Poppins-Regular',
    fontSize: SIZES.body5,
  },
  statusActiveText: {
    color: COLORS.accent,
  },
  statusPendingText: {
    color: COLORS.red,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontFamily: 'Poppins-Regular',
    color: COLORS.text,
    marginLeft: 8,
    fontSize: SIZES.body5,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    paddingTop: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  editButton: {
    backgroundColor: COLORS.secondary,
  },
  deleteButton: {
    backgroundColor: COLORS.lightRed,
  },
  buttonText: {
    fontFamily: 'Poppins-SemiBold',
    marginLeft: 6,
    fontSize: SIZES.body5,
  },
  editButtonText: {
    color: COLORS.primary,
  },
  deleteButtonText: {
    color: COLORS.red,
  },
  emptyContainer: {
    marginTop: SIZES.padding * 2,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Poppins-Regular',
    fontSize: SIZES.body3,
    color: COLORS.gray,
  },
});
