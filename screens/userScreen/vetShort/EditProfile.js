import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, ActivityIndicator, Image } from 'react-native';
import { supabase } from '../../../Supabase';
import * as ImagePicker from 'expo-image-picker';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Picker } from '@react-native-picker/picker';

export default function EditProfile({ route, navigation }) {
  const { profile: initialProfile } = route.params;
  
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Estados para todos los campos del formulario
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [address, setAddress] = useState('');
  const [biography, setBiography] = useState('');
  const [specialties, setSpecialties] = useState([]);
  const [newSpecialty, setNewSpecialty] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [clinics, setClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState(null);

  useEffect(() => {
    // Cargar datos del perfil en el formulario
    if (initialProfile) {
      setName(initialProfile.name || '');
      setTitle(initialProfile.title || '');
      setPhone(initialProfile.phone_number || '');
      setCollegeId(initialProfile.college_id || '');
      setAddress(initialProfile.address || '');
      setBiography(initialProfile.biography || '');
      setSpecialties(initialProfile.specialties || []);
      setAvatarUrl(initialProfile.avatar_url || null);
      setSelectedClinicId(initialProfile.clinic_id);
    }

    // Cargar la lista de clínicas
    const fetchClinics = async () => {
      const { data, error } = await supabase.from('clinics').select('id, name');
      if (error) {
        console.error("Error cargando clínicas:", error);
      } else {
        setClinics(data);
      }
    };

    fetchClinics();
  }, [initialProfile]);

  // Lógica para gestionar especialidades
  const addSpecialty = () => {
    const trimmedSpecialty = newSpecialty.trim();
    if (trimmedSpecialty && !specialties.includes(trimmedSpecialty)) {
      setSpecialties([...specialties, trimmedSpecialty]);
      setNewSpecialty('');
    }
  };
  const removeSpecialty = (indexToRemove) => {
    setSpecialties(specialties.filter((_, index) => index !== indexToRemove));
  };

  // Lógica para la foto de perfil
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos necesarios', 'Necesitamos permisos para acceder a tus fotos.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      uploadAvatar(result.assets[0].uri);
    }
  };

  const uploadAvatar = async (uri) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no encontrado.");
      
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop();
      const filePath = `${user.id}.${fileExt}`;

      const { error } = await supabase.storage.from('avatars').upload(filePath, blob, { upsert: true });
      if (error) throw error;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
      
    } catch (error) {
      Alert.alert('Error', 'No se pudo subir la imagen.');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  // Lógica para guardar todos los cambios
  const handleUpdateProfile = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay un usuario logueado.");
      
      const updates = {
        id: user.id,
        name,
        title,
        phone_number: phone,
        college_id: collegeId,
        address,
        biography,
        specialties,
        avatar_url: avatarUrl,
        role_id: initialProfile.role_id,
        clinic_id: selectedClinicId,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      
      Alert.alert("Éxito", "Perfil guardado correctamente.");
      navigation.goBack();

    } catch (error) {
      Alert.alert("Error", "No se pudo guardar el perfil.");
      console.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Foto de Perfil</Text>
        <View style={styles.avatarContainer}>
          {uploading ? <ActivityIndicator size="large" color="#013847"/> : (
            avatarUrl ? 
              <Image source={{ uri: avatarUrl }} style={styles.avatar} /> : 
              <View style={styles.avatarPlaceholder}><Icon name="stethoscope" size={40} color="#013847"/></View>
          )}
        </View>
        <Pressable style={styles.photoButton} onPress={pickImage} disabled={uploading}>
            <Icon name="camera" size={16} color="#fff" style={{marginRight: 10}}/>
            <Text style={styles.buttonText}>Cambiar Foto</Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Información Personal y Profesional</Text>
        <Text style={styles.label}>Nombre Completo</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />
        
        <Text style={styles.label}>Título Profesional</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />
        
        <Text style={styles.label}>Clínica</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedClinicId}
            onValueChange={(itemValue) => setSelectedClinicId(itemValue)}
          >
            <Picker.Item label="-- Selecciona una clínica --" value={null} />
            {clinics.map((clinic) => (
              <Picker.Item key={clinic.id} label={clinic.name} value={clinic.id} />
            ))}
          </Picker>
        </View>
        
        <View style={styles.row}>
            <View style={styles.col}>
                <Text style={styles.label}>Email</Text>
                <TextInput style={[styles.input, styles.readOnly]} value={initialProfile?.email || ''} editable={false} />
            </View>
            <View style={styles.col}>
                <Text style={styles.label}>Teléfono</Text>
                <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            </View>
        </View>
        
        <View style={styles.row}>
            <View style={styles.col}>
                <Text style={styles.label}>Nº Colegiado</Text>
                <TextInput style={styles.input} value={collegeId} onChangeText={setCollegeId} />
            </View>
            <View style={styles.col}>
                <Text style={styles.label}>Dirección</Text>
                <TextInput style={styles.input} value={address} onChangeText={setAddress} />
            </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Especialidades</Text>
        <View style={styles.specialtiesContainer}>
          {specialties.map((spec, index) => (
            <Pressable key={index} onPress={() => removeSpecialty(index)} style={styles.specialtyTag}>
              <Text style={styles.specialtyText}>{spec}</Text>
              <Icon name="times" size={12} color="#555" style={{ marginLeft: 8 }} />
            </Pressable>
          ))}
        </View>
        <View style={styles.addSpecialtyContainer}>
          <TextInput
            style={styles.addSpecialtyInput}
            placeholder="Agregar nueva"
            value={newSpecialty}
            onChangeText={setNewSpecialty}
            onSubmitEditing={addSpecialty}
          />
          <Pressable style={styles.addSpecialtyButton} onPress={addSpecialty}>
            <Icon name="plus" size={20} color="#fff" />
          </Pressable>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Biografía Profesional</Text>
        <TextInput
          style={[styles.input, {height: 120, textAlignVertical: 'top'}]}
          value={biography}
          onChangeText={setBiography}
          multiline
        />
      </View>

      <View style={styles.actionButtons}>
        <Pressable style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
          <Text style={[styles.buttonText, {color: '#333'}]}>Cancelar</Text>
        </Pressable>
        <Pressable style={[styles.button, styles.saveButton]} onPress={handleUpdateProfile} disabled={saving || uploading}>
          <Icon name="save" size={16} color="#fff" style={{marginRight: 10}}/>
          <Text style={styles.buttonText}>{saving ? 'Guardando...' : 'Guardar Cambios'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#013847' },
    card: { backgroundColor: '#fff', borderRadius: 16, padding: 20, marginHorizontal: 15, marginBottom: 15 },
    cardTitle: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 20 },
    avatarContainer: { alignSelf: 'center', marginBottom: 15 },
    avatar: { width: 100, height: 100, borderRadius: 50 },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: '#e1e1e1', justifyContent: 'center', alignItems: 'center' },
    photoButton: { flexDirection: 'row', padding: 12, borderRadius: 8, backgroundColor: '#013847', alignItems: 'center', justifyContent: 'center' },
    label: { fontSize: 14, color: '#555', marginBottom: 8, fontWeight: '500' },
    input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, backgroundColor: '#f9f9f9' },
    readOnly: { backgroundColor: '#eee', color: '#888' },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: 15, marginTop: 15 },
    col: { flex: 1 },
    pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 15, backgroundColor: '#f9f9f9', justifyContent: 'center' },
    specialtiesContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
    specialtyTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e1e1e1', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, marginBottom: 8 },
    specialtyText: { color: '#333' },
    addSpecialtyContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
    addSpecialtyInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginRight: 10, fontSize: 14 },
    addSpecialtyButton: { backgroundColor: '#43C0AF', padding: 12, borderRadius: 8 },
    actionButtons: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 15, marginBottom: 40, gap: 10 },
    button: { flex: 1, flexDirection: 'row', padding: 15, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    saveButton: { backgroundColor: '#43C0AF' },
    cancelButton: { backgroundColor: '#f0f0f0' },
    buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});