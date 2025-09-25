import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator, TextInput, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../api/Supabase';
import Icon from 'react-native-vector-icons/FontAwesome5';

export default function NuevaVacuna({ route, navigation }) {
  const { petId, petName } = route.params;

  // Estados del formulario
  const [vaccinesList, setVaccinesList] = useState([]);
  const [selectedVaccineId, setSelectedVaccineId] = useState(null);
  const [applicationDate, setApplicationDate] = useState(new Date());
  const [nextDoseDate, setNextDoseDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState({ app: false, next: false });
  const [lotNumber, setLotNumber] = useState('');
  const [loading, setLoading] = useState(true);

  // Cargar el catálogo de vacunas
  useEffect(() => {
    const fetchVaccines = async () => {
      try {
        const { data, error } = await supabase.from('vaccines').select('id, name');
        if (error) throw error;
        setVaccinesList(data);
      } catch (error) {
        Alert.alert("Error", "No se pudo cargar el catálogo de vacunas.");
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVaccines();
  }, []);

  // Handlers para los selectores de fecha
  const onChangeApplicationDate = (event, selectedDate) => {
    setShowPicker(s => ({ ...s, app: false }));
    setApplicationDate(selectedDate || applicationDate);
  };
  const onChangeNextDoseDate = (event, selectedDate) => {
    setShowPicker(s => ({ ...s, next: false }));
    setNextDoseDate(selectedDate || nextDoseDate);
  };

  // Guardar el registro de vacunación
  const handleSaveVaccine = async () => {
    if (!selectedVaccineId) {
      Alert.alert("Error", "Debes seleccionar una vacuna.");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No se pudo identificar al veterinario.");

      const { error } = await supabase
        .from('pet_vaccination_records')
        .insert({
          pet_id: petId,
          vaccine_id: selectedVaccineId,
          vet_id: user.id,
          application_date: applicationDate.toISOString().split('T')[0],
          next_dose_date: nextDoseDate.toISOString().split('T')[0],
          lot_number: lotNumber,
        });
      
      if (error) throw error;

      Alert.alert("Éxito", "Registro de vacunación guardado.", [
        { text: "OK", onPress: () => navigation.goBack() }
      ]);

    } catch (error) {
      console.error("Error al guardar vacuna:", error.message);
      Alert.alert("Error", "No se pudo guardar el registro.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && vaccinesList.length === 0) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#013847" /></View>;
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Icon name="arrow-left" size={20} color="#013847" /></Pressable>
        <Text style={styles.headerTitle}>Nueva Vacuna para {petName}</Text>
        <View style={{width: 20}}/>
      </View>
      
      <View style={styles.card}>
        <Text style={styles.label}>Vacuna</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedVaccineId}
            onValueChange={(itemValue) => setSelectedVaccineId(itemValue)}
          >
            <Picker.Item label="-- Selecciona una vacuna --" value={null} />
            {vaccinesList.map(vaccine => (
              <Picker.Item key={vaccine.id} label={vaccine.name} value={vaccine.id} />
            ))}
          </Picker>
        </View>

        <Text style={styles.label}>Fecha de Aplicación</Text>
        <Pressable onPress={() => setShowPicker({ ...showPicker, app: true })}>
          <TextInput style={styles.input} editable={false} value={applicationDate.toLocaleDateString('es-ES')} />
        </Pressable>

        <Text style={styles.label}>Próxima Dosis</Text>
        <Pressable onPress={() => setShowPicker({ ...showPicker, next: true })}>
          <TextInput style={styles.input} editable={false} value={nextDoseDate.toLocaleDateString('es-ES')} />
        </Pressable>

        <Text style={styles.label}>Lote</Text>
        <TextInput style={styles.input} value={lotNumber} onChangeText={setLotNumber} placeholder="Número de lote" />
      </View>

      <View style={styles.actionButtons}>
        <Pressable style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
          <Text style={[styles.buttonText, {color: '#333'}]}>Cancelar</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.saveButton]} onPress={handleSaveVaccine} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Icon name="save" size={16} color="#fff" style={{marginRight: 10}}/>}
          <Text style={styles.buttonText}>Guardar</Text>
        </Pressable>
      </View>

      {showPicker.app && <DateTimePicker value={applicationDate} mode="date" display="default" onChange={onChangeApplicationDate} />}
      {showPicker.next && <DateTimePicker value={nextDoseDate} mode="date" display="default" onChange={onChangeNextDoseDate} />}
    </ScrollView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E2ECED' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#013847', textAlign: 'center', flex: 1 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginHorizontal: 15 },
  label: { fontSize: 14, color: '#555', marginBottom: 8, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#f9f9f9', marginBottom: 15, color: '#000' },
  pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 15, backgroundColor: '#f9f9f9', justifyContent: 'center' },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 15, marginTop: 20, gap: 10 },
  button: { flex: 1, flexDirection: 'row', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveButton: { backgroundColor: '#43C0AF' },
  cancelButton: { backgroundColor: '#f0f0f0' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});