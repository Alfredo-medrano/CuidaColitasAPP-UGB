import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../api/Supabase'; // Asegúrate que la ruta es correcta
import Icon from 'react-native-vector-icons/FontAwesome5';

export default function NuevaVisita({ route, navigation }) {
  const { petId, petName } = route.params;

  // Estados para el formulario
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);

  // Cargar las citas de este paciente que aún no tienen un historial médico
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        // Buscamos citas de la mascota que no tienen un registro médico asociado.
        const { data, error } = await supabase
          .from('appointments')
          .select('id, reason, appointment_time, medical_records(id)')
          .eq('pet_id', petId)
          .is('medical_records.id', null); // La clave: solo citas sin historial

        if (error) throw error;
        setAppointments(data || []);
      } catch (error) {
        Alert.alert("Error", "No se pudieron cargar las citas disponibles.");
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointments();
  }, [petId]);

  const handleSaveVisit = async () => {
    if (!selectedAppointmentId || !diagnosis) {
      Alert.alert("Error", "Debes seleccionar una cita y añadir un diagnóstico.");
      return;
    }
    setLoading(true);
    try {
      // Insertamos el nuevo registro en la tabla 'medical_records'
      const { error } = await supabase
        .from('medical_records')
        .insert({
          appointment_id: selectedAppointmentId,
          diagnosis,
          treatment,
          notes,
        });

      if (error) throw error;

      Alert.alert("Éxito", "El historial de la visita ha sido guardado.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);

    } catch (error) {
      console.error("Error al guardar la visita:", error.message);
      Alert.alert("Error", "No se pudo guardar el registro de la visita.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#013847" /></View>;
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Icon name="arrow-left" size={20} color="#013847" /></Pressable>
        <Text style={styles.headerTitle}>Nueva Visita para {petName}</Text>
        <View style={{width: 20}}/>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.label}>Cita a documentar</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedAppointmentId}
            onValueChange={(itemValue) => setSelectedAppointmentId(itemValue)}
          >
            <Picker.Item label="-- Selecciona una cita --" value={null} />
            {appointments.map(app => (
              <Picker.Item 
                key={app.id} 
                label={`${new Date(app.appointment_time).toLocaleDateString('es-ES')} - ${app.reason || 'Consulta'}`} 
                value={app.id} 
              />
            ))}
          </Picker>
        </View>
        
        <Text style={styles.label}>Diagnóstico</Text>
        <TextInput style={styles.input} value={diagnosis} onChangeText={setDiagnosis} placeholder="Diagnóstico principal" />
        
        <Text style={styles.label}>Tratamiento</Text>
        <TextInput style={styles.input} value={treatment} onChangeText={setTreatment} placeholder="Tratamiento prescrito" />
        
        <Text style={styles.label}>Notas Adicionales</Text>
        <TextInput style={[styles.input, {height: 120, textAlignVertical: 'top'}]} multiline value={notes} onChangeText={setNotes} placeholder="Notas de la visita..." />
      </View>

      <View style={styles.actionButtons}>
        <Pressable style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
          <Text style={[styles.buttonText, {color: '#333'}]}>Cancelar</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.saveButton]} onPress={handleSaveVisit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Icon name="save" size={16} color="#fff" style={{marginRight: 10}}/>}
          <Text style={styles.buttonText}>Guardar Visita</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E2ECED' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#013847', textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginHorizontal: 15 },
  label: { fontSize: 14, color: '#555', marginBottom: 8, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#f9f9f9', marginBottom: 15 },
  pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 15, backgroundColor: '#f9f9f9', justifyContent: 'center' },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 15, marginTop: 20, gap: 10 },
  button: { flex: 1, flexDirection: 'row', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveButton: { backgroundColor: '#43C0AF' },
  cancelButton: { backgroundColor: '#f0f0f0' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});