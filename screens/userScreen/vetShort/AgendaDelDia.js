import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../../Supabase';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';

export default function AgendaDelDia({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date()); // Estado para la fecha seleccionada
  const isFocused = useIsFocused();

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no encontrado");

      // Calcular inicio y fin del día seleccionado
      const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999)).toISOString();

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_time,
          reason,
          pet:pets ( name, breed ),
          client:profiles!client_id ( name ),
          status:appointment_status ( status )
        `)
        .eq('vet_id', user.id)
        .gte('appointment_time', startOfDay)
        .lte('appointment_time', endOfDay)
        .order('appointment_time', { ascending: true });
      
      if (error) throw error;
      setAppointments(data);

    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las citas.");
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]); // Se ejecuta cada vez que cambia la fecha seleccionada

  useEffect(() => {
    if (isFocused) {
      fetchAppointments();
    }
  }, [isFocused, fetchAppointments]);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.cardTime}>{new Date(item.appointment_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      <View style={styles.cardDetails}>
        <Text style={styles.petName}>{item.pet.name}</Text>
        <Text style={styles.ownerName}>{item.client.full_name}</Text>
        <Text style={styles.reason}>{item.reason || 'Consulta general'}</Text>
      </View>
      <View style={styles.cardSide}>
        <View style={[styles.statusBadge, { backgroundColor: item.status.status === 'Confirmada' ? '#d4edda' : '#fff3cd' }]}>
            <Text style={[styles.statusText, { color: item.status.status === 'Confirmada' ? '#155724' : '#856404' }]}>{item.status.status}</Text>
        </View>
        <Pressable style={styles.chatButton}>
            <Icon name="comment-dots" size={20} color="#6c757d" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header Personalizado */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Icon name="arrow-left" size={20} color="#fff" /></Pressable>
        <Text style={styles.headerTitle}>Agenda del Día</Text>
        <Text style={styles.headerDate}>{selectedDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
      </View>

      {/* Aquí iría el componente de calendario y los filtros "Hoy, Mañana, Semana" */}
      {/* Por ahora, nos enfocamos en la lista */}

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Citas de Hoy</Text>
        <Pressable style={styles.newButton} onPress={() => navigation.navigate('NuevaCita')}>
          <Icon name="plus" size={14} color="#fff" />
          <Text style={styles.newButtonText}>Nueva</Text>
        </Pressable>
      </View>

      {loading ? <ActivityIndicator style={{marginTop: 50}} size="large" color="#013847" /> : (
        <FlatList
          data={appointments}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<Text style={styles.emptyText}>No tienes citas para este día.</Text>}
        />
      )}
    </View>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#013847' },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: 20, backgroundColor: '#013847' },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 10 },
  headerDate: { color: '#d3d3d3', fontSize: 16, marginTop: 5 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 30, paddingBottom: 15, backgroundColor: '#E2ECED', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  listTitle: { fontSize: 20, fontWeight: 'bold', color: '#013847' },
  newButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#43C0AF', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  newButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
  list: { paddingHorizontal: 20, backgroundColor: '#E2ECED', flexGrow: 1 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#666' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, flexDirection: 'row', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  cardTime: { fontSize: 16, fontWeight: 'bold', color: '#013847', marginRight: 15 },
  cardDetails: { flex: 1 },
  petName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  ownerName: { fontSize: 14, color: '#666', marginTop: 2 },
  reason: { fontSize: 14, color: '#666', marginTop: 2 },
  cardSide: { alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  chatButton: { marginTop: 10 },
});