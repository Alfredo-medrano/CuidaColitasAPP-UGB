import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { supabase } from '../../../Supabase';

export default function AgendaDelDia({ navigation }) {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    const getAppointments = async () => {
      const { data, error } = await supabase
        .from('appointments') 
        .select('*, patients(name), users(name)') 
        .eq('appointment_time', new Date().toISOString().slice(0, 10)); 

      if (error) {
        console.log('Error al obtener citas:', error.message);
      } else {
        setAppointments(data);
      }
    };
    getAppointments();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Agenda del Día</Text>
      <FlatList
        data={appointments}
        renderItem={({ item }) => (
          <View style={styles.appointmentCard}>
            <Text style={styles.appointmentText}>
              {item.appointment_time} - {item.patients.name} - {item.users.name}
            </Text>
            <Text>Status: {item.status}</Text>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#013847', marginBottom: 20 },
  appointmentCard: {
    backgroundColor: '#E2EDED',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
  },
  appointmentText: { fontSize: 18, fontWeight: 'bold', color: '#013847' },
});
