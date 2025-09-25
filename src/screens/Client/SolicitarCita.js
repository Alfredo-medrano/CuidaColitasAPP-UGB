import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator, TextInput, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../api/Supabase';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';
import moment from 'moment';
import 'moment/locale/es';

moment.locale('es');

export default function SolicitarCita({ navigation }) {
  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(null);
  const [selectedPet, setSelectedPet] = useState(null);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState({ date: false, time: false });
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadPets = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuario no autenticado");

        const { data: petData, error } = await supabase
          .from('pets')
          .select('id, name, owner_id, primary_vet_id')
          .eq('owner_id', user.id);

        if (error) throw error;
        setPets(petData || []);
        if (petData.length > 0) {
          setSelectedPetId(petData[0].id);
          setSelectedPet(petData[0]);
        }
      } catch (error) {
        console.error("Error cargando mascotas:", error.message);
        Alert.alert("Error", "No se pudieron cargar tus mascotas.");
      } finally {
        setLoading(false);
      }
    };
    loadPets();
  }, []);

  useEffect(() => {
    const pet = pets.find(p => p.id === selectedPetId);
    setSelectedPet(pet);
  }, [selectedPetId, pets]);

  const onChangeDate = (event, selectedDate) => {
    setShowPicker({ ...showPicker, date: false });
    setDate(selectedDate || date);
  };
  const onChangeTime = (event, selectedTime) => {
    setShowPicker({ ...showPicker, time: false });
    setTime(selectedTime || time);
  };

  const handleSubmit = async () => {
    if (!selectedPetId || !reason.trim()) {
      Alert.alert("Error", "Debes seleccionar una mascota y especificar un motivo.");
      return;
    }
    if (!selectedPet?.primary_vet_id) {
      Alert.alert("Error", "Tu mascota no tiene un veterinario asignado. Por favor, contacta a un administrador.");
      return;
    }
    setSaving(true);

    try {
      const { data: { user: clientUser } } = await supabase.auth.getUser();
      const appointmentTime = moment(date).hour(moment(time).hour()).minute(moment(time).minute()).toDate();
      const vetId = selectedPet.primary_vet_id;

      // === VALIDACIÓN DE DISPONIBILIDAD: PASO CLAVE ===
      // Obtenemos todas las citas para el mismo veterinario en la misma franja de 30 minutos.
      const startOfAppointment = moment(appointmentTime).toDate();
      const endOfAppointment = moment(appointmentTime).add(30, 'minutes').toDate();

      const { data: existingAppointments, error: availabilityError } = await supabase
        .from('appointments')
        .select('id')
        .eq('vet_id', vetId)
        .gte('appointment_time', startOfAppointment.toISOString())
        .lt('appointment_time', endOfAppointment.toISOString());

      if (availabilityError) throw availabilityError;

      // Si ya existe una cita, no permitimos la nueva.
      if (existingAppointments && existingAppointments.length > 0) {
        Alert.alert("Error", "Ya existe una cita agendada en este horario. Por favor, selecciona otro.");
        return; // Detiene la ejecución.
      }
      // === FIN DE LA VALIDACIÓN ===

      const { data: statusData, error: statusError } = await supabase
        .from('appointment_status')
        .select('id')
        .eq('status', 'Programada')
        .single();
      if (statusError) throw statusError;

      const { data: vetProfileData, error: vetProfileError } = await supabase
        .from('profiles')
        .select('clinic_id')
        .eq('id', vetId)
        .single();

      if (vetProfileError) throw vetProfileError;
      const clinicId = vetProfileData.clinic_id;

      if (!clinicId) {
        Alert.alert("Error", "El veterinario principal no tiene una clínica asignada.");
        return;
      }

      const { data: newAppointment, error: insertError } = await supabase
        .from('appointments')
        .insert({
          pet_id: selectedPetId,
          vet_id: vetId,
          client_id: clientUser.id,
          clinic_id: clinicId,
          status_id: statusData.id,
          appointment_time: appointmentTime.toISOString(),
          reason,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: vetId,
          type: 'new_appointment',
          title: `Nueva solicitud de cita para ${selectedPet.name}`,
          content: `El cliente ha solicitado una cita para el ${moment(appointmentTime).format('LLL')}.`,
          link_id: newAppointment.id
        });

      if (notificationError) {
        console.error("Error al crear la notificación:", notificationError.message);
      }

      Alert.alert("Éxito", "Tu solicitud de cita ha sido enviada.");
      navigation.goBack();
    } catch (error) {
      console.error('Error al solicitar cita:', error.message);
      Alert.alert("Error", error.message || "No se pudo solicitar la cita.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#43C0AF" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}><Icon name="arrow-left" size={20} color="#013847" /></Pressable>
          <Text style={styles.headerTitle}>Solicitar Cita</Text>
          <View style={{ width: 20 }} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información de la Cita</Text>

          <Text style={styles.label}>Mascota</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={selectedPetId} onValueChange={(itemValue) => setSelectedPetId(itemValue)}>
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
                  value={moment(date).format('L')}
                />
              </Pressable>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Hora</Text>
              <Pressable onPress={() => setShowPicker({ ...showPicker, time: true })}>
                <TextInput
                  style={styles.input}
                  editable={false}
                  value={moment(time).format('LT')}
                />
              </Pressable>
            </View>
          </View>

          <Text style={styles.label}>Motivo</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
            multiline
            value={reason}
            onChangeText={setReason}
            placeholder="Describe brevemente el motivo de la cita..."
          />

          {showPicker.date && <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} />}
          {showPicker.time && <DateTimePicker value={time} mode="time" display="default" onChange={onChangeTime} />}
        </View>

        <View style={styles.actionButtons}>
          <Pressable style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
            <Text style={[styles.buttonText, { color: '#333' }]}>Cancelar</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.saveButton]} onPress={handleSubmit} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Icon name="calendar-check" size={16} color="#fff" style={{ marginRight: 10 }} />}
            <Text style={styles.buttonText}>Enviar Solicitud</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E2ECED' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#013847' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginHorizontal: 15 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20 },
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