import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator, TextInput, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../api/Supabase';
import Icon from 'react-native-vector-icons/FontAwesome5';

export default function NuevaCita({ navigation }) {
  // --- Estados del Formulario ---
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState({ date: false, time: false });
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  // Carga los pacientes del veterinario para el selector
  useEffect(() => {
    const loadPets = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuario no autenticado");

        const { data: petData, error } = await supabase
          .from('pets')
          .select('id, name, owner_id')
          .eq('primary_vet_id', user.id);

        if (error) throw error;
        setPets(petData || []);
      } catch (error) {
        console.error("Error cargando pacientes:", error.message);
        Alert.alert("Error", "No se pudieron cargar los pacientes.");
      } finally {
        setLoading(false);
      }
    };
    loadPets();
  }, []);

  // --- Handlers para el selector de fecha y hora ---
  const onChangeDate = (event, selectedDate) => {
    setShowPicker({ ...showPicker, date: false });
    setDate(selectedDate || date);
  };
  const onChangeTime = (event, selectedTime) => {
    setShowPicker({ ...showPicker, time: false });
    setTime(selectedTime || time);
  };

  // --- Lógica para Guardar la Cita y Crear Notificación ---
  const handleSubmit = async () => {
    if (!selectedPetId) {
      Alert.alert("Error", "Debes seleccionar un paciente.");
      return;
    }
    setLoading(true);

    try {
      // 1. Obtener perfil completo del veterinario (incluyendo clinic_id)
      const { data: { user: vetUser } } = await supabase.auth.getUser();
      const { data: vetProfile, error: profileError } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('id', vetUser.id)
        .single();
      
      if (profileError) throw profileError;

      // 2. VERIFICACIÓN CRÍTICA: Asegurarse de que el vet tiene una clínica
      if (!vetProfile || !vetProfile.clinic_id) {
        throw new Error("No tienes una clínica asignada. Por favor, actualiza tu perfil.");
      }
      const clinicId = vetProfile.clinic_id;

      // 3. Obtener el ID del estado 'Programada'
      const { data: statusData, error: statusError } = await supabase
        .from('appointment_status')
        .select('id')
        .eq('status', 'Programada')
        .single();
      if (statusError) throw statusError;

      // 4. Preparar datos para la inserción
      const selectedPet = pets.find(p => p.id === selectedPetId);
      const appointmentTime = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        time.getHours(),
        time.getMinutes()
      );

      // 5. Insertar la cita y obtener su ID
      const { data: newAppointment, error: insertError } = await supabase
        .from('appointments')
        .insert({
          pet_id: selectedPetId,
          vet_id: vetUser.id,
          client_id: selectedPet.owner_id,
          clinic_id: clinicId,
          status_id: statusData.id,
          appointment_time: appointmentTime.toISOString(),
          reason,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 6. Crear la notificación para el CLIENTE
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: selectedPet.owner_id,
          type: 'new_appointment',
          title: 'Nueva Cita Programada',
          content: `Se agendó una cita para ${selectedPet.name} el ${appointmentTime.toLocaleDateString('es-ES')}.`,
          link_id: newAppointment.id
        });

      if (notificationError) {
        console.error("Error al crear la notificación:", notificationError.message);
      }

      Alert.alert("Éxito", "La cita ha sido programada y el cliente notificado.", [{ text: "OK", onPress: () => navigation.goBack() }]);

    } catch (error) {
      console.error('Error al crear cita:', error.message);
      Alert.alert("Error", error.message || "No se pudo programar la cita.");
    } finally {
      setLoading(false);
    }
  };

  if (loading && pets.length === 0) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#013847" /></View>;
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Icon name="arrow-left" size={20} color="#013847" /></Pressable>
        <Text style={styles.headerTitle}>Nueva Cita</Text>
        <View style={{width: 20}} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Información de la Cita</Text>
        
        <Text style={styles.label}>Paciente</Text>
        <View style={styles.pickerContainer}>
          <Picker selectedValue={selectedPetId} onValueChange={(itemValue) => setSelectedPetId(itemValue)}>
            <Picker.Item label="Seleccionar paciente..." value={null} />
            {pets.map(p => <Picker.Item key={p.id} label={p.name} value={p.id} />)}
          </Picker>
        </View>

        <View style={styles.row}>
            <View style={styles.col}>
                <Text style={styles.label}>Fecha</Text>
                <Pressable onPress={() => setShowPicker({ ...showPicker, date: true })}>
                    <TextInput 
                      style={styles.input} 
                      editable={false} 
                      value={date.toLocaleDateString('es-ES', {day: '2-digit', month: '2-digit', year: 'numeric'})} 
                    />
                </Pressable>
            </View>
            <View style={styles.col}>
                <Text style={styles.label}>Hora</Text>
                 <Pressable onPress={() => setShowPicker({ ...showPicker, time: true })}>
                    <TextInput 
                      style={styles.input} 
                      editable={false} 
                      value={time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                    />
                </Pressable>
            </View>
        </View>
        
        <Text style={styles.label}>Tipo de Consulta / Motivo</Text>
        <TextInput 
          style={[styles.input, {height: 100, textAlignVertical: 'top'}]} 
          multiline 
          value={reason} 
          onChangeText={setReason} 
          placeholder="Motivo de la consulta o notas adicionales..." 
        />

        {showPicker.date && <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} />}
        {showPicker.time && <DateTimePicker value={time} mode="time" display="default" onChange={onChangeTime} />}
      </View>

      <View style={styles.actionButtons}>
        <Pressable style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
          <Text style={[styles.buttonText, {color: '#333'}]}>Cancelar</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.saveButton]} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Icon name="calendar-check" size={16} color="#fff" style={{marginRight: 10}}/>}
          <Text style={styles.buttonText}>Programar Cita</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E2ECED' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#013847' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginHorizontal: 15 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 20 },
  label: { fontSize: 14, color: '#555', marginBottom: 8, fontWeight: '500' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#f9f9f9', color: '#000' },
  pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 15, backgroundColor: '#f9f9f9', justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, marginBottom: 15 },
  col: { flex: 1 },
  actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 15, marginTop: 20, gap: 10 },
  button: { flex: 1, flexDirection: 'row', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  saveButton: { backgroundColor: '#43C0AF' },
  cancelButton: { backgroundColor: '#f0f0f0' },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});