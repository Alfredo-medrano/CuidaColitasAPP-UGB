import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { supabase } from '../../../Supabase';

export default function NuevaCita({ navigation }) {
  const [patient, setPatient] = useState('');
  const [time, setTime] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = async () => {
    const { data, error } = await supabase
      .from('appointments')
      .insert([
        { patient, time, reason, status: 'pendiente' },  
      ]);

    if (error) {
      console.log('Error al crear cita:', error.message);
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nueva Cita</Text>
      <TextInput
        style={styles.input}
        placeholder="Nombre del Paciente"
        value={patient}
        onChangeText={setPatient}
      />
      <TextInput
        style={styles.input}
        placeholder="Hora de la Cita"
        value={time}
        onChangeText={setTime}
      />
      <TextInput
        style={styles.input}
        placeholder="Motivo de la Cita"
        value={reason}
        onChangeText={setReason}
      />
      <Button title="Guardar Cita" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#013847', marginBottom: 20 },
  input: { borderColor: '#ccc', borderWidth: 1, padding: 10, marginBottom: 15, borderRadius: 8 },
});
