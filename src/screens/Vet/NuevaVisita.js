import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator, TextInput, StatusBar, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../api/Supabase';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SIZES } from '../../theme/theme';

// Componente de Input Reutilizable
const FormInput = ({ label, value, onChangeText, placeholder, multiline = false, isInvalid = false, ...props }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        multiline && styles.inputMultiline,
        isInvalid && styles.inputInvalid
      ]}
      placeholder={placeholder}
      placeholderTextColor={COLORS.secondary}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      {...props}
    />
  </View>
);

export default function NuevaVisita({ route, navigation }) {
  // Recibimos parámetros opcionales si venimos desde el perfil de una mascota
  const { petId: initialPetId = null, petName: initialPetName = null } = route?.params ?? {};

  const [pets, setPets] = useState([]);
  const [selectedPetId, setSelectedPetId] = useState(initialPetId);
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Cargar lista de mascotas del veterinario
  useEffect(() => {
    const fetchPets = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Usuario no autenticado");

        // Obtenemos todas las mascotas asignadas a este veterinario
        const { data: petData, error } = await supabase
          .from('pets')
          .select('id, name, owner_id')
          .eq('primary_vet_id', user.id)
          .order('name', { ascending: true });

        if (error) throw error;
        setPets(petData || []);

        // Si no veníamos con una mascota preseleccionada, no seleccionamos ninguna por defecto
        if (!initialPetId) {
          setSelectedPetId(null);
        }

      } catch (error) {
        console.error("Error cargando pacientes:", error.message);
        Alert.alert("Error", "No se pudieron cargar los pacientes.");
      } finally {
        setLoading(false);
      }
    };
    fetchPets();
  }, [initialPetId]);

  const validate = () => {
    const newErrors = {};
    if (!selectedPetId) newErrors.pet = true;
    if (!diagnosis.trim()) newErrors.diagnosis = true;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveVisit = async () => {
    if (!validate()) {
      Alert.alert('Atención', 'Por favor selecciona un paciente y escribe el diagnóstico.');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 1. Buscar si existe una cita HOY para esta mascota que esté pendiente
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: existingAppointments, error: searchError } = await supabase
        .from('appointments')
        .select('id, status:appointment_status(status)')
        .eq('pet_id', selectedPetId)
        .gte('appointment_time', todayStart.toISOString())
        .lte('appointment_time', todayEnd.toISOString())
        // Filtramos manualmente o en query los estados válidos para usar
        // Idealmente buscamos una que NO esté cancelada ni completada, o 'En Progreso'
        .lte('appointment_time', todayEnd.toISOString());

      if (searchError) throw searchError;

      // Filtramos en JS para mayor seguridad sobre los estados
      // Buscamos una cita que sea 'Programada', 'Confirmada' o 'En Progreso'
      const validAppointment = existingAppointments?.find(app =>
        ['Programada', 'Confirmada', 'Pendiente'].includes(app.status?.status)
      );

      let appointmentIdToUse = validAppointment?.id;

      // 2. Si NO existe cita, CREAR una nueva automáticamente
      if (!appointmentIdToUse) {
        // Necesitamos datos del dueño para crear la cita
        const selectedPetData = pets.find(p => p.id === selectedPetId);

        // Obtener ID de estado 'Completada' (porque la estamos creando al momento de finalizar la visita)
        const { data: statusCompleted } = await supabase
          .from('appointment_status')
          .select('id')
          .eq('status', 'Completada')
          .single();

        // Obtener clinic_id del veterinario
        const { data: vetProfile } = await supabase
          .from('profiles')
          .select('clinic_id')
          .eq('id', user.id)
          .single();

        if (!vetProfile?.clinic_id) throw new Error("No tienes clínica asignada para crear citas.");

        const { data: newApp, error: createError } = await supabase
          .from('appointments')
          .insert({
            pet_id: selectedPetId,
            vet_id: user.id,
            client_id: selectedPetData.owner_id,
            clinic_id: vetProfile.clinic_id,
            status_id: statusCompleted.id, // Nace completada
            appointment_time: new Date().toISOString(),
            reason: 'Consulta Express / Sin Cita Previa'
          })
          .select()
          .single();

        if (createError) throw createError;
        appointmentIdToUse = newApp.id;
      } else {
        // Si YA existía, actualizamos su estado a 'Completada'
        const { data: statusCompleted } = await supabase
          .from('appointment_status')
          .select('id')
          .eq('status', 'Completada')
          .single();

        if (statusCompleted) {
          await supabase
            .from('appointments')
            .update({ status_id: statusCompleted.id })
            .eq('id', appointmentIdToUse);
        }
      }

      // 3. Guardar el Registro Médico vinculado a la cita (existente o nueva)
      const { error: recordError } = await supabase.from('medical_records').insert({
        appointment_id: appointmentIdToUse,
        diagnosis,
        treatment,
        notes,
      });

      if (recordError) throw recordError;

      Alert.alert('Éxito', 'La visita ha sido registrada correctamente.', [
        { text: 'Aceptar', onPress: () => navigation.goBack() },
      ]);

    } catch (error) {
      console.error('Error al guardar la visita:', error.message);
      Alert.alert('Error', error.message || 'No se pudo guardar el registro.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Nueva Visita</Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Información del Paciente</Text>

          {/* Selector de Mascota */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Paciente</Text>
            <View style={[styles.pickerContainer, errors.pet && styles.inputInvalid]}>
              <Picker
                selectedValue={selectedPetId}
                onValueChange={(itemValue) => {
                  setSelectedPetId(itemValue);
                  if (itemValue) setErrors(prev => ({ ...prev, pet: false }));
                }}
                style={Platform.OS === 'android' ? styles.pickerAndroid : {}}
                itemStyle={Platform.OS === 'ios' ? styles.pickerIOSItem : {}}
              // Si veníamos con mascota preseleccionada, podríamos deshabilitar el cambio si se desea
              // enabled={!initialPetId} 
              >
                <Picker.Item label="Selecciona un paciente..." value={null} color={COLORS.secondary} />
                {pets.map((p) => (
                  <Picker.Item
                    key={p.id}
                    label={p.name}
                    value={p.id}
                    color={COLORS.primary}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Detalles Médicos</Text>

          <FormInput
            label="Diagnóstico"
            placeholder="Ej. Otitis externa leve..."
            value={diagnosis}
            onChangeText={(t) => {
              setDiagnosis(t);
              if (t) setErrors(prev => ({ ...prev, diagnosis: false }));
            }}
            isInvalid={errors.diagnosis}
            multiline
          />

          <FormInput
            label="Tratamiento"
            placeholder="Ej. Limpieza ótica y antibióticos..."
            value={treatment}
            onChangeText={setTreatment}
            multiline
          />

          <FormInput
            label="Notas Adicionales"
            placeholder="Observaciones privadas..."
            value={notes}
            onChangeText={setNotes}
            multiline
            style={[styles.input, styles.inputMultiline, { minHeight: 100 }]}
          />

        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={saving}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </Pressable>
        <Pressable
          style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSaveVisit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>Guardar Visita</Text>
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: COLORS.primary },
  headerButton: { width: 40 },
  headerTitle: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.h2, color: COLORS.textPrimary },

  scrollContent: { padding: 20, paddingBottom: 100 },

  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  sectionTitle: { fontFamily: FONTS.PoppinsBold, fontSize: 18, color: COLORS.primary, marginBottom: 15 },
  divider: { height: 1, backgroundColor: COLORS.secondary, marginVertical: 20, opacity: 0.5 },

  inputGroup: { marginBottom: 15 },
  inputLabel: { fontFamily: FONTS.PoppinsRegular, fontSize: 14, color: COLORS.primary, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: COLORS.secondary, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: FONTS.PoppinsRegular, color: COLORS.primary, backgroundColor: '#FAFAFA' },
  inputMultiline: { minHeight: 80, textAlignVertical: 'top' },
  inputInvalid: { borderColor: COLORS.red, borderWidth: 1.5 },

  pickerContainer: { borderWidth: 1, borderColor: COLORS.secondary, borderRadius: 10, backgroundColor: '#FAFAFA', overflow: 'hidden' },
  pickerAndroid: { height: 50, color: COLORS.primary },
  pickerIOSItem: { height: 120, fontSize: 14 },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', padding: 20, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.secondary },
  button: { flex: 1, flexDirection: 'row', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancelButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: COLORS.secondary, marginRight: 10 },
  saveButton: { backgroundColor: COLORS.accent, marginLeft: 10 },
  buttonDisabled: { opacity: 0.7 },

  cancelButtonText: { fontFamily: FONTS.PoppinsSemiBold, color: COLORS.secondary, fontSize: 16 },
  saveButtonText: { fontFamily: FONTS.PoppinsSemiBold, color: COLORS.primary, fontSize: 16 },
});
