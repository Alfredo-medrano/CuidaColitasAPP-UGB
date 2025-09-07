import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { supabase } from '../../../Supabase';

export default function NuevoPaciente({ navigation }) {
  // Estados para la información de la Mascota
  const [petName, setPetName] = useState('');
  const [speciesId, setSpeciesId] = useState(null);
  const [breed, setBreed] = useState('');
  const [sex, setSex] = useState('');
  
  // Estados para la lista de clientes
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [speciesList, setSpeciesList] = useState([]);

  // Cargar la lista de clientes y especies al abrir la pantalla
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Cargar Especies
        const { data: speciesData, error: speciesError } = await supabase.from('pet_species').select('id, name');
        if (speciesError) throw speciesError;
        setSpeciesList(speciesData);

        // Cargar Clientes
        const { data: roleData, error: roleError } = await supabase.from('roles').select('id').eq('name', 'cliente').single();
        if (roleError) throw roleError;

        const { data: clientData, error: clientError } = await supabase
          .from('profiles')
          .select('id, name')
          .eq('role_id', roleData.id)
          .order('name', { ascending: true });
        
        if (clientError) throw clientError;
        setClients(clientData);

      } catch (error) {
        Alert.alert("Error", "No se pudieron cargar los datos iniciales.");
        console.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleCreatePaciente = async () => {
    if (!selectedClientId || !petName || !speciesId) {
      Alert.alert("Error", "Por favor selecciona un dueño y completa el nombre y la especie de la mascota.");
      return;
    }
    setLoading(true);

    try {
      const { data: { user: vetUser } } = await supabase.auth.getUser();
      if (!vetUser) throw new Error("No se pudo identificar al veterinario.");

      // Insertamos la nueva mascota con los IDs correctos
      const { error } = await supabase
        .from('pets')
        .insert({
          name: petName,
          species_id: speciesId,
          breed,
          sex,
          owner_id: selectedClientId, // ID del cliente seleccionado
          primary_vet_id: vetUser.id,   // ID del veterinario logueado
        });

      if (error) throw error;

      Alert.alert("Éxito", "Paciente creado y asignado exitosamente.", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);

    } catch (error) {
      console.error('Error al crear el paciente:', error.message);
      Alert.alert("Error", "Hubo un problema al crear el paciente.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#013847" /></View>;
  }

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Nuevo Paciente</Text>

      {/* --- Selector de Dueño --- */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Dueño del Paciente</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedClientId}
            onValueChange={(itemValue) => setSelectedClientId(itemValue)}
          >
            <Picker.Item label="-- Elige un cliente --" value={null} />
            {clients.map((client) => (
              <Picker.Item key={client.id} label={client.name} value={client.id} />
            ))}
          </Picker>
        </View>
      </View>

      {/* --- Información de la Mascota --- */}
      <View style={styles.formGroup}>
        <Text style={styles.label}>Información de la Mascota</Text>
        <TextInput style={styles.input} placeholder="Nombre de la mascota" value={petName} onChangeText={setPetName} />
        
        <View style={styles.pickerContainer}>
          <Picker selectedValue={speciesId} onValueChange={(itemValue) => setSpeciesId(itemValue)}>
            <Picker.Item label="Seleccionar especie..." value={null} />
            {speciesList.map(specie => (
              <Picker.Item key={specie.id} label={specie.name} value={specie.id} />
            ))}
          </Picker>
        </View>
        
        <TextInput style={styles.input} placeholder="Raza" value={breed} onChangeText={setBreed} />

        <View style={styles.pickerContainer}>
            <Picker selectedValue={sex} onValueChange={(itemValue) => setSex(itemValue)}>
            <Picker.Item label="Seleccionar sexo..." value="" />
            <Picker.Item label="Macho" value="Macho" />
            <Picker.Item label="Hembra" value="Hembra" />
            </Picker>
        </View>
      </View>

      <View style={styles.buttonsContainer}>
        <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.buttonText, {color: '#333'}]}>Cancelar</Text>
        </Pressable>
        <Pressable style={styles.createButton} onPress={handleCreatePaciente} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Crear Paciente</Text>}
        </Pressable>
      </View>
    </ScrollView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#E2ECED' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#013847', marginBottom: 20 },
  formGroup: { marginBottom: 20, backgroundColor: '#fff', padding: 15, borderRadius: 12 },
  label: { fontSize: 16, fontWeight: '500', color: '#333', marginBottom: 8 },
  input: { height: 50, borderColor: '#ccc', borderWidth: 1, borderRadius: 8, paddingLeft: 15, marginBottom: 15, backgroundColor: '#f9f9f9', fontSize: 16 },
  pickerContainer: { borderColor: '#ccc', borderWidth: 1, borderRadius: 8, marginBottom: 15, backgroundColor: '#f9f9f9', justifyContent: 'center' },
  buttonsContainer: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  createButton: { backgroundColor: '#43C0AF', padding: 15, borderRadius: 12, flex: 1, alignItems: 'center' },
  cancelButton: { backgroundColor: '#e1e1e1', padding: 15, borderRadius: 12, flex: 1, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});