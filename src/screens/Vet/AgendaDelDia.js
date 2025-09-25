import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../api/Supabase';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

export default function AgendaDelDia({ navigation }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Hoy');
  const [selectedDate, setSelectedDate] = useState(moment());
  const isFocused = useIsFocused();

  const getFilterDates = (filterName) => {
    const today = moment().startOf('day');
    let startDate, endDate;
    if (filterName === 'Hoy') {
      startDate = today.toDate();
      endDate = moment(today).endOf('day').toDate();
    } else if (filterName === 'Mañana') {
      const tomorrow = moment().add(1, 'day').startOf('day');
      startDate = tomorrow.toDate();
      endDate = moment(tomorrow).endOf('day').toDate();
    } else if (filterName === 'Semana') {
      const startOfWeek = moment().startOf('week');
      const endOfWeek = moment().endOf('week');
      startDate = startOfWeek.toDate();
      endDate = endOfWeek.toDate();
    }
    return { startDate, endDate };
  };

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no encontrado");

      const { startDate, endDate } = getFilterDates(filter);

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
        .gte('appointment_time', startDate.toISOString())
        .lte('appointment_time', endDate.toISOString())
        .order('appointment_time', { ascending: true });
      
      if (error) throw error;
      setAppointments(data);

    } catch (error) {
      Alert.alert("Error", "No se pudieron cargar las citas.");
      console.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (isFocused) {
      fetchAppointments();
    }
  }, [isFocused, fetchAppointments]);

  const renderItem = ({ item }) => (
    <Pressable style={styles.card} onPress={() => navigation.navigate('DetalleCita', { appointmentId: item.id, userRole: 'veterinario' })}>
      <View style={styles.cardTimeContainer}>
        <Text style={styles.cardTime}>{moment(item.appointment_time).format('h:mm a')}</Text>
        <Text style={styles.cardDate}>{moment(item.appointment_time).format('ddd D MMM')}</Text>
      </View>
      <View style={styles.cardDetails}>
        <Text style={styles.petName}>{item.pet.name}</Text>
        <Text style={styles.ownerName}>Dueño: {item.client.name}</Text>
        <Text style={styles.reason}>{item.reason || 'Consulta general'}</Text>
      </View>
      <View style={styles.statusBadgeContainer}>
        <View style={[styles.statusBadge, { backgroundColor: item.status.status === 'Confirmada' ? '#d4edda' : '#fff3cd' }]}>
            <Text style={[styles.statusText, { color: item.status.status === 'Confirmada' ? '#155724' : '#856404' }]}>{item.status.status}</Text>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Icon name="arrow-left" size={20} color="#fff" /></Pressable>
        <Text style={styles.headerTitle}>Agenda</Text>
        <View style={{width: 20}} />
      </View>
      <View style={styles.filterContainer}>
        <Pressable 
          style={[styles.filterButton, filter === 'Hoy' && styles.filterButtonActive]} 
          onPress={() => setFilter('Hoy')}>
          <Text style={[styles.filterText, filter === 'Hoy' && styles.filterTextActive]}>Hoy</Text>
        </Pressable>
        <Pressable 
          style={[styles.filterButton, filter === 'Mañana' && styles.filterButtonActive]} 
          onPress={() => setFilter('Mañana')}>
          <Text style={[styles.filterText, filter === 'Mañana' && styles.filterTextActive]}>Mañana</Text>
        </Pressable>
        <Pressable 
          style={[styles.filterButton, filter === 'Semana' && styles.filterButtonActive]} 
          onPress={() => setFilter('Semana')}>
          <Text style={[styles.filterText, filter === 'Semana' && styles.filterTextActive]}>Semana</Text>
        </Pressable>
      </View>
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Próximas Citas</Text>
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
          ListEmptyComponent={<Text style={styles.emptyText}>No tienes citas para este período.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#013847' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  filterContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20, backgroundColor: '#013847' },
  filterButton: { paddingVertical: 10, paddingHorizontal: 20 },
  filterButtonActive: { borderBottomWidth: 3, borderBottomColor: '#43C0AF' },
  filterText: { color: '#fff', fontWeight: 'bold' },
  filterTextActive: { color: '#43C0AF' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 30, paddingBottom: 15, backgroundColor: '#E2ECED', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  listTitle: { fontSize: 20, fontWeight: 'bold', color: '#013847' },
  newButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#43C0AF', paddingVertical: 8, paddingHorizontal: 15, borderRadius: 20 },
  newButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 5 },
  list: { paddingHorizontal: 20, backgroundColor: '#E2ECED', flexGrow: 1 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#666' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, flexDirection: 'row', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
  cardTimeContainer: { width: 80, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#f0f0f0', marginRight: 15 },
  cardTime: { fontSize: 16, fontWeight: 'bold', color: '#013847' },
  cardDate: { fontSize: 12, color: '#999', marginTop: 5 },
  cardDetails: { flex: 1 },
  petName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  ownerName: { fontSize: 14, color: '#666', marginTop: 2 },
  reason: { fontSize: 14, color: '#666', marginTop: 2, fontStyle: 'italic' },
  statusBadgeContainer: { justifyContent: 'center', alignItems: 'flex-end' },
  statusBadge: { borderRadius: 12, paddingVertical: 4, paddingHorizontal: 10 },
  statusText: { fontSize: 12, fontWeight: 'bold' },
  chatButton: { marginTop: 10 },
});