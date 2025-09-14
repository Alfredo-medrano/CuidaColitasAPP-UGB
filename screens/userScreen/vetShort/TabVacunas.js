import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../../Supabase';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useIsFocused } from '@react-navigation/native';

export default function TabVacunas({ petId, petName, navigation }) {
  const [vaccines, setVaccines] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const fetchVaccines = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pet_vaccination_records')
        .select(`*, vaccine:vaccines(name)`)
        .eq('pet_id', petId)
        .order('application_date', { ascending: false });
      
      if (error) throw error;
      setVaccines(data);

    } catch (error) {
      Alert.alert("Error", "No se pudo cargar el historial de vacunas.");
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    if (isFocused) {
      fetchVaccines();
    }
  }, [isFocused, fetchVaccines]);

  if (loading) {
    return <ActivityIndicator size="large" color="#fff" style={{marginTop: 50}} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Historial de Vacunas</Text>
        <Pressable style={styles.addButton} onPress={() => navigation.navigate('NuevaVacuna', { petId, petName })}>
          <Icon name="syringe" size={14} color="#fff" />
          <Text style={styles.addButtonText}>Nueva Vacuna</Text>
        </Pressable>
      </View>
      <FlatList
        data={vaccines}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.vaccine.name}</Text>
              <View style={styles.headerActions}>
                <View style={styles.statusBadge}><Text style={styles.statusBadgeText}>Al día</Text></View>
                <Pressable style={styles.editIcon}><Icon name="edit" size={16} color="#6c757d" /></Pressable>
              </View>
            </View>
            <Text style={styles.cardInfo}><Text style={styles.bold}>Aplicada:</Text> {new Date(item.application_date).toLocaleDateString('es-ES')}</Text>
            <Text style={styles.cardInfo}><Text style={styles.bold}>Próxima:</Text> {item.next_dose_date ? new Date(item.next_dose_date).toLocaleDateString('es-ES') : 'N/A'}</Text>
            <Text style={styles.loteText}>Lote: {item.lot_number || 'N/A'}</Text>
          </View>
        )}
        contentContainerStyle={{paddingHorizontal: 15}}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay vacunas registradas.</Text>}
      />
    </View>
  );
}

// --- Estilos para este componente de pestaña ---
const styles = StyleSheet.create({
  container: { flex: 1 },
  tabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 15, paddingTop: 20 },
  tabTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#43C0AF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  addButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 5 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1, marginRight: 10 },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  statusBadge: { backgroundColor: '#d4edda', borderRadius: 12, paddingVertical: 3, paddingHorizontal: 8 },
  statusBadgeText: { color: '#155724', fontSize: 12, fontWeight: '500' },
  editIcon: { marginLeft: 10, padding: 5 },
  cardInfo: { color: '#333', fontSize: 14, marginBottom: 5, lineHeight: 20 },
  bold: { fontWeight: 'bold' },
  loteText: { fontSize: 12, color: '#999', marginTop: 5, alignSelf: 'flex-end' },
  emptyText: { color: '#fff', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
});