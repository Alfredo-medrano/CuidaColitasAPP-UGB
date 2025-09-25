import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../../api/Supabase';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useIsFocused } from '@react-navigation/native';

export default function TabMedicamentos({ petId, petName, navigation }) {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const fetchMedications = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pet_medications')
        .select('*')
        .eq('pet_id', petId)
        .order('prescription_date', { ascending: false });
      
      if (error) throw error;
      setMedications(data);

    } catch (error) {
      Alert.alert("Error", "No se pudo cargar el historial de medicamentos.");
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [petId]);

  useEffect(() => {
    if (isFocused) {
      fetchMedications();
    }
  }, [isFocused, fetchMedications]);

  if (loading) {
    return <ActivityIndicator size="large" color="#fff" style={{marginTop: 50}} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabHeader}>
        <Text style={styles.tabTitle}>Medicamentos</Text>
        <Pressable style={styles.addButton} onPress={() => navigation.navigate('NuevoMedicamento', { petId, petName })}>
          <Icon name="pills" size={14} color="#fff" />
          <Text style={styles.addButtonText}>Nuevo Medicamento</Text>
        </Pressable>
      </View>
      <FlatList
        data={medications}
        keyExtractor={item => item.id}
        renderItem={({item}) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.medication_name}</Text>
              <Pressable style={styles.editIcon}><Icon name="edit" size={16} color="#6c757d" /></Pressable>
            </View>
            <Text style={styles.cardInfo}><Text style={styles.bold}>Dosis:</Text> {item.dosage}</Text>
            <Text style={styles.cardInfo}><Text style={styles.bold}>Duración:</Text> {item.duration}</Text>
            <Text style={styles.cardInfo}><Text style={styles.bold}>Prescrito:</Text> {new Date(item.prescription_date).toLocaleDateString('es-ES')}</Text>
          </View>
        )}
        contentContainerStyle={{paddingHorizontal: 15}}
        ListEmptyComponent={<Text style={styles.emptyText}>No hay medicamentos registrados.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingHorizontal: 15, paddingTop: 20 },
  tabTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#43C0AF', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20 },
  addButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', flex: 1 },
  editIcon: { padding: 5 },
  cardInfo: { color: '#333', fontSize: 14, marginBottom: 5, lineHeight: 20 },
  bold: { fontWeight: 'bold' },
  emptyText: { color: '#fff', textAlign: 'center', marginTop: 20, fontStyle: 'italic' },
});