import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from 'react-native';
import { Picker } from '@react-native-picker/picker';  

export default function NuevoPaciente({ navigation }) {
  const [nombrePropietario, setNombrePropietario] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [nombreMascota, setNombreMascota] = useState('');
  const [especie, setEspecie] = useState('');
  const [raza, setRaza] = useState('');
  const [sexo, setSexo] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [peso, setPeso] = useState('');
  const [color, setColor] = useState('');

  const handleCreatePaciente = async () => {

    if (!nombrePropietario || !telefono || !email || !direccion || !nombreMascota || !especie || !raza || !sexo || !fechaNacimiento || !peso || !color) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }

    const { data, error } = await supabase
      .from('patients')  
      .insert([
        {
          nombre_propietario: nombrePropietario,
          telefono: telefono,
          email: email,
          direccion: direccion,
          nombre_mascota: nombreMascota,
          especie: especie,
          raza: raza,
          sexo: sexo,
          fecha_nacimiento: fechaNacimiento,
          peso: peso,
          color: color,
        },
      ]);

    if (error) {
      console.error('Error al crear el paciente:', error.message);
      Alert.alert("Error", "Hubo un problema al crear el paciente. Intenta nuevamente.");
    } else {
      Alert.alert("Éxito", "Paciente creado exitosamente.", [
        { text: "OK", onPress: () => navigation.goBack() },  
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nuevo Paciente</Text>

      <View style={styles.formGroup}>
        <Text>Información del Propietario</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre del propietario"
          value={nombrePropietario}
          onChangeText={setNombrePropietario}
        />
        <TextInput
          style={styles.input}
          placeholder="Teléfono"
          keyboardType="phone-pad"
          value={telefono}
          onChangeText={setTelefono}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Dirección"
          value={direccion}
          onChangeText={setDireccion}
        />
      </View>

      <View style={styles.formGroup}>
        <Text>Información de la Mascota</Text>
        <TextInput
          style={styles.input}
          placeholder="Nombre de la mascota"
          value={nombreMascota}
          onChangeText={setNombreMascota}
        />
        <Picker
          style={styles.input}
          selectedValue={especie}
          onValueChange={setEspecie}>
          <Picker.Item label="Seleccionar especie" value="" />
          <Picker.Item label="Perro" value="Perro" />
          <Picker.Item label="Gato" value="Gato" />
        </Picker>
        <TextInput
          style={styles.input}
          placeholder="Raza de la mascota"
          value={raza}
          onChangeText={setRaza}
        />
        <Picker
          style={styles.input}
          selectedValue={sexo}
          onValueChange={setSexo}>
          <Picker.Item label="Seleccionar sexo" value="" />
          <Picker.Item label="Macho" value="Macho" />
          <Picker.Item label="Hembra" value="Hembra" />
        </Picker>
        <TextInput
          style={styles.input}
          placeholder="Fecha de nacimiento (dd/mm/aaaa)"
          value={fechaNacimiento}
          onChangeText={setFechaNacimiento}
        />
        <TextInput
          style={styles.input}
          placeholder="Peso (kg)"
          keyboardType="numeric"
          value={peso}
          onChangeText={setPeso}
        />
        <TextInput
          style={styles.input}
          placeholder="Color del pelaje"
          value={color}
          onChangeText={setColor}
        />
      </View>

      <View style={styles.buttonsContainer}>
        <Pressable style={styles.createButton} onPress={handleCreatePaciente}>
          <Text style={styles.buttonText}>Crear Paciente</Text>
        </Pressable>
        <Pressable style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Cancelar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#E2ECED',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#013847',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  input: {
    height: 40,
    borderColor: '#43C0AF',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  createButton: {
    backgroundColor: '#43C0AF',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

