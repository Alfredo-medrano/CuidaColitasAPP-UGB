import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker'; // 1. Importar
import { supabase } from '../../../Supabase';
import Icon from 'react-native-vector-icons/FontAwesome5';

export default function DetallePaciente({ navigation, route }) {
  const { petId, mode, userRole } = route.params;
  
  // Estados para la información de la Mascota
  const [petName, setPetName] = useState('');
  const [speciesId, setSpeciesId] = useState(null);
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState('');
  const [birthDate, setBirthDate] = useState(new Date()); // 2. Usar un objeto Date
  const [showDatePicker, setShowDatePicker] = useState(false); // 3. Estado para mostrar/ocultar
  const [weightKg, setWeightKg] = useState('');
  const [color, setColor] = useState('');
  const [isNeutered, setIsNeutered] = useState(false);
  
  // Estados para el Dueño
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');

  // Estados de la UI
  const [speciesList, setSpeciesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(mode === 'edit');

  useEffect(() => {
    const loadPetDetails = async () => {
      try {
        setLoading(true);

        const { data: speciesData, error: speciesError } = await supabase.from('pet_species').select('id, name');
        if (speciesError) throw speciesError;
        setSpeciesList(speciesData);

        const { data: petData, error: petError } = await supabase
          .from('pets')
          .select(`*, species:pet_species(id, name), owner:profiles!owner_id(id, name, phone_number)`) // Consulta corregida
          .eq('id', petId)
          .single();
        if (petError) throw petError;

        // Poblar el estado del formulario con los datos de la BD
        setPetName(petData.name);
        setSpeciesId(petData.species_id);
        setBreed(petData.breed || '');
        setSex(petData.sex || '');
        // 4. Convertir la fecha de texto de la BD a un objeto Date
        setBirthDate(petData.birth_date ? new Date(petData.birth_date) : new Date());
        setWeightKg(petData.weight_kg ? String(petData.weight_kg) : '');
        setColor(petData.color || '');
        setIsNeutered(petData.is_neutered);
        setOwnerName(petData.owner.name);
        setOwnerPhone(petData.owner.phone_number || '');

      } catch (error) {
        Alert.alert("Error", "No se pudo cargar la información del paciente.");
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadPetDetails();
  }, [petId]);

  // 5. Nueva función para manejar el cambio de fecha
  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || birthDate;
    setShowDatePicker(Platform.OS === 'ios');
    setBirthDate(currentDate);
  };

  const handleUpdatePet = async () => {
    if (!petName || !speciesId) {
      Alert.alert("Error", "El nombre y la especie son obligatorios.");
      return;
    }
    setLoading(true);

    try {
      const updates = {
        name: petName,
        species_id: speciesId,
        breed: breed,
        sex: sex,
        // 6. Formatear la fecha correctamente antes de guardar
        birth_date: birthDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
        weight_kg: parseFloat(weightKg) || null,
        color: color,
        is_neutered: isNeutered,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('pets').update(updates).eq('id', petId);
      if (error) throw error;
      
      Alert.alert("Éxito", "Información del paciente actualizada.");
      setIsEditing(false);
      navigation.goBack();
    } catch (error) {
      console.error('Error al actualizar el paciente:', error.message);
      Alert.alert("Error", "Hubo un problema al actualizar el paciente.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View style={[styles.container, styles.centered]}><ActivityIndicator size="large" color="#013847" /></View>;
  }
  
  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-left" size={20} color="#013847" />
        </Pressable>
        <Text style={styles.headerTitle}>{isEditing ? 'Editar Paciente' : 'Ver Paciente'}</Text>
        {mode === 'view' && userRole === 'veterinario' && ( // Solo veterinarios pueden editar desde aquí si están viendo
          <Pressable style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Icon name="edit" size={18} color="#013847" />
            <Text style={styles.editButtonText}>Editar</Text>
          </Pressable>
        )}
        {(mode === 'edit' || isEditing) && <View style={styles.editButtonPlaceholder} />}
      </View>

      {/* Información del Propietario (solo lectura aquí) */}
      <View style={styles.formGroup}>
        <Text style={styles.groupTitle}>Información del Propietario</Text>
        <Text style={styles.infoText}>Nombre: {ownerName}</Text>
        <Text style={styles.infoText}>Teléfono: {ownerPhone || 'N/A'}</Text>
        {/* Aquí podrías añadir un botón para 'Ver Perfil del Dueño' si tienes una pantalla para ello */}
      </View>

      {/* Información de la Mascota */}
      <View style={styles.formGroup}>
        <Text style={styles.groupTitle}>Información de la Mascota</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre de la mascota"
          value={petName}
          onChangeText={setPetName}
          editable={isEditing}
        />
        
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={speciesId}
            onValueChange={(itemValue) => setSpeciesId(itemValue)}
            enabled={isEditing}
          >
            <Picker.Item label="Seleccionar especie..." value={null} />
            {speciesList.map(specie => (
              <Picker.Item key={specie.id} label={specie.name} value={specie.id} />
            ))}
          </Picker>
        </View>
        
        <TextInput
          style={styles.input}
          placeholder="Raza"
          value={breed}
          onChangeText={setBreed}
          editable={isEditing}
        />

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={sex}
            onValueChange={(itemValue) => setSex(itemValue)}
            enabled={isEditing}
          >
            <Picker.Item label="Seleccionar sexo..." value="" />
            <Picker.Item label="Macho" value="Macho" />
            <Picker.Item label="Hembra" value="Hembra" />
          </Picker>
        </View>

        <Text style={styles.label}>Fecha de Nacimiento</Text>
        <Pressable onPress={() => isEditing && setShowDatePicker(true)} disabled={!isEditing}>
          <TextInput
            style={[styles.input, !isEditing && styles.readOnly]}
            value={birthDate.toLocaleDateString('es-ES', {year: 'numeric', month: '2-digit', day: '2-digit'})}
            editable={false}
          />
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={birthDate}
            mode={'date'}
            display="default"
            onChange={onChangeDate}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Peso (kg)"
          keyboardType="numeric"
          value={weightKg}
          onChangeText={setWeightKg}
          editable={isEditing}
        />
        <TextInput
          style={styles.input}
          placeholder="Color"
          value={color}
          onChangeText={setColor}
          editable={isEditing}
        />
        
        <View style={styles.checkboxContainer}>
          <Text style={styles.checkboxLabel}>Esterilizado/a:</Text>
          <Pressable
            style={[styles.checkbox, isNeutered && styles.checkboxChecked]}
            onPress={() => isEditing && setIsNeutered(!isNeutered)}
            disabled={!isEditing}
          >
            {isNeutered && <Icon name="check" size={14} color="#fff" />}
          </Pressable>
        </View>

      </View>

      {isEditing && (
        <View style={styles.buttonsContainer}>
          <Pressable style={styles.cancelButton} onPress={() => {
            if (mode === 'edit') navigation.goBack(); // Si venía de editar, regresa
            else setIsEditing(false); // Si cambió de modo 'view', vuelve a view
          }} disabled={loading}>
            <Text style={[styles.buttonText, {color: '#333'}]}>Cancelar</Text>
          </Pressable>
          <Pressable style={styles.createButton} onPress={handleUpdatePet} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Guardar Cambios</Text>}
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#E2ECED' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#013847' },
  editButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e0ffe0', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  editButtonText: { color: '#013847', marginLeft: 5, fontWeight: 'bold' },
  editButtonPlaceholder: { width: 70 }, // Para mantener el espaciado cuando el botón de editar no está visible

  formGroup: { marginBottom: 20, backgroundColor: '#fff', padding: 15, borderRadius: 12 },
  groupTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 15 },
  label: { fontSize: 16, fontWeight: '500', color: '#333', marginBottom: 8 },
  infoText: { fontSize: 16, color: '#333', marginBottom: 5 },

  input: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingLeft: 15, marginBottom: 15, backgroundColor: '#f9f9f9', fontSize: 16 },
  pickerContainer: { borderColor: '#ccc', borderWidth: 1, borderRadius: 8, marginBottom: 15, backgroundColor: '#f9f9f9', justifyContent: 'center' },
  
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  checkboxLabel: { fontSize: 16, marginRight: 10, color: '#333' },
  checkbox: { width: 20, height: 20, borderWidth: 2, borderColor: '#013847', borderRadius: 4, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: '#43C0AF', borderColor: '#43C0AF' },

  buttonsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, marginTop: 10 },
  createButton: { backgroundColor: '#43C0AF', padding: 15, borderRadius: 12, flex: 1, alignItems: 'center' },
  cancelButton: { backgroundColor: '#e1e1e1', padding: 15, borderRadius: 12, flex: 1, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});