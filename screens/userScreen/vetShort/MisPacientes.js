import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, TextInput } from 'react-native';
import { supabase } from '../../../Supabase';

export default function MisPacientes({ navigation }) {
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const getPatients = async () => {
      const { data, error } = await supabase
        .from('patients')  
        .select('*');

      if (error) {
        console.log('Error al obtener pacientes:', error.message);
      } else {
        setPatients(data);
      }
    };
    getPatients();
  }, []);

  const filteredPatients = patients.filter(patient =>
    patient.owner.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por dueño..."
        value={search}
        onChangeText={setSearch}
      />
      <Pressable
        style={styles.newButton}
        onPress={() => navigation.navigate('NuevoPaciente')} 
      >
        <Text style={styles.newButtonText}>+ Nuevo</Text>
      </Pressable>
      <FlatList
        data={filteredPatients}
        renderItem={({ item }) => (
          <View style={styles.patientCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.patientName}>{item.name}</Text>
              <Text style={styles.patientStatus}>{item.status}</Text>
            </View>
            <Text>{item.species} - {item.breed}</Text>
            <Text>Dueño: {item.owner}</Text>
            <Text>Última visita: {item.last_visit}</Text>
            <Text>Precio: {item.price}</Text>
            <Pressable
              style={styles.viewButton}
              onPress={() => navigation.navigate('PatientDetails', { patientId: item.id })}
            >
              <Text style={styles.buttonText}>Ver Detalles</Text>
            </Pressable>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#E2ECED' },
  searchInput: {
    height: 40,
    borderColor: '#43C0AF',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 20,
  },
  newButton: {
    backgroundColor: '#43C0AF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  newButtonText: { color: '#fff', fontWeight: '600' },
  patientCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  patientName: { fontSize: 18, fontWeight: 'bold', color: '#013847' },
  patientStatus: { fontSize: 14, fontWeight: 'bold', color: '#43C0AF' },
  viewButton: {
    backgroundColor: '#43C0AF',
    padding: 10,
    marginTop: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
});
