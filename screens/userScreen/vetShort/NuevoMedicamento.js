import React, {useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator, TextInput, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../../Supabase';
import Icon from 'react-native-vector-icons/FontAwesome5';

export default function NuevoMedicamento({ route, navigation }) {
  const { petId, petName } = route.params;

  // Estados del formulario
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [duration, setDuration] = useState('');
  const [prescriptionDate, setPrescriptionDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  // Handler para el selector de fecha
  const onChangeDate = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    setPrescriptionDate(selectedDate || prescriptionDate);
  };

  // Guardar el registro del medicamento
  const handleSaveMedication = async () => {
    if (!medicationName || !dosage || !duration) {
      Alert.alert("Error", "Debes completar todos los campos del medicamento.");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No se pudo identificar al veterinario.");

      const { error } = await supabase
        .from('pet_medications')
        .insert({
          pet_id: petId,
          vet_id: user.id,
          medication_name: medicationName,
          dosage: dosage,
          duration: duration,
          prescription_date: prescriptionDate.toISOString().split('T')[0],
        });
      
      if (error) throw error;

      Alert.alert("Éxito", "Medicamento guardado en el historial.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);

    } catch (error) {
      console.error("Error al guardar medicamento:", error.message);
      Alert.alert("Error", "No se pudo guardar el registro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Icon name="arrow-left" size={20} color="#013847" /></Pressable>
        <Text style={styles.headerTitle}>Nuevo Medicamento</Text>
        <Text style={styles.headerSubtitle}>para {petName}</Text>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.label}>Nombre del Medicamento</Text>
        <TextInput style={styles.input} value={medicationName} onChangeText={setMedicationName} placeholder="Ej: Apoquel 16mg" />
        
        <Text style={styles.label}>Dosis</Text>
        <TextInput style={styles.input} value={dosage} onChangeText={setDosage} placeholder="Ej: 1 tableta/12h" />

        <Text style={styles.label}>Duración del Tratamiento</Text>
        <TextInput style={styles.input} value={duration} onChangeText={setDuration} placeholder="Ej: 15 días" />
        
        <Text style={styles.label}>Fecha de Prescripción</Text>
        <Pressable onPress={() => setShowDatePicker(true)}>
          <TextInput style={styles.input} editable={false} value={prescriptionDate.toLocaleDateString('es-ES')} />
        </Pressable>
      </View>

      <View style={styles.actionButtons}>
        <Pressable style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
          <Text style={[styles.buttonText, {color: '#333'}]}>Cancelar</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.saveButton]} onPress={handleSaveMedication} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Icon name="save" size={16} color="#fff" style={{marginRight: 10}}/>}
          <Text style={styles.buttonText}>Guardar</Text>
        </Pressable>
      </View>

      {showDatePicker && <DateTimePicker value={prescriptionDate} mode="date" display="default" onChange={onChangeDate} />}
    </ScrollView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E2ECED' },
  header: { alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#013847' },
  headerSubtitle: { fontSize: 16, color: '#666' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginHorizontal: 15 },
  label: { fontSize: 14, color: '#555', marginBottom: 8, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#f9f9f9', marginBottom: 15, color: '#000' },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 15, marginTop: 20, gap: 10 },
  button: { flex: 1, flexDirection: 'row', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveButton: { backgroundColor: '#43C0AF' },
  cancelButton: { backgroundColor: '#f0f0f0' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});