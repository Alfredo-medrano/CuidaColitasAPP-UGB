import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, ActivityIndicator, Image, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { supabase } from '../../api/Supabase';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfileClient({ route, navigation }) {
  const { profile: initialProfile } = route.params;

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    if (initialProfile) {
      const fullName = initialProfile.name.split(' ');
      setName(fullName.length > 1 ? fullName[0] : initialProfile.name || '');
      setLastname(fullName.length > 1 ? fullName.slice(1).join(' ') : '');
      setPhone(initialProfile.phone_number || '');
      setAddress(initialProfile.address || '');
      setAvatarUrl(initialProfile.avatar_url || null);
      setEmergencyName(initialProfile.emergency_name || '');
      setEmergencyPhone(initialProfile.emergency_phone || '');
    }
  }, [initialProfile]);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos necesarios', 'Necesitamos permisos para acceder a tus fotos.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets[0].uri) {
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

  const handleSave = async () => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No hay un usuario logueado.");

      const updates = {
        id: user.id,
        name: `${name} ${lastname}`.trim(),
        phone_number: phone,
        address,
        emergency_name: emergencyName,
        emergency_phone: emergencyPhone,
        role_id: initialProfile.role_id, // SOLUCIÓN: Aseguramos que role_id siempre tenga un valor
        avatar_url: avatarUrl,
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
    <View style={{ flex: 1, backgroundColor: '#E2ECED' }}>
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={{ backgroundColor: '#00796B' }} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <View style={{ width: 28 }} />
        </View>
      </SafeAreaView>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Foto de Perfil</Text>
          <View style={{ alignItems: 'center', marginVertical: 12 }}>
            <TouchableOpacity onPress={pickImage} disabled={uploading}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: '#1CEA9B', justifyContent: 'center', alignItems: 'center' }]}>
                  <Ionicons name="person" size={54} color="#fff" />
                </View>
              )}
              {uploading && <ActivityIndicator style={styles.avatar} color="#00796B" />}
            </TouchableOpacity>
            <View style={{ flexDirection: 'row', marginTop: 10 }}>
              <TouchableOpacity style={styles.photoBtn} onPress={pickImage} disabled={uploading}>
                <Ionicons name="camera" size={18} color="#00796B" />
                <Text style={styles.photoBtnText}>Cambiar Foto</Text>
              </TouchableOpacity>
              {avatarUrl && (
                <TouchableOpacity style={[styles.photoBtn, { marginLeft: 12 }]} onPress={async () => {
                  setAvatarUrl(null);
                  const { data: { user } } = await supabase.auth.getUser();
                  if (user) {
                    await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
                    Alert.alert('Éxito', 'Foto eliminada.');
                  }
                }}>
                  <Ionicons name="trash" size={18} color="#FF1744" />
                  <Text style={[styles.photoBtnText, { color: '#FF1744' }]}>Eliminar Foto</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Información Personal</Text>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nombre"
                placeholderTextColor="#B0B0B0"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Apellidos</Text>
              <TextInput
                style={styles.input}
                value={lastname}
                onChangeText={setLastname}
                placeholder="Apellidos"
              />
            </View>
          </View>
          <View style={styles.inputGroupFull}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={initialProfile?.email || ''}
              editable={false} // El correo no se puede editar
              placeholder="Email"
              placeholderTextColor="#B0B0B0"
            />
          </View>
          <View style={styles.row}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="Teléfono"
                placeholderTextColor="#B0B0B0"
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dirección</Text>
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Dirección"
                placeholderTextColor="#B0B0B0"
              />
            </View>
          </View>
          <View style={styles.inputGroupFull}>
            <Text style={styles.inputLabel}>Contacto de Emergencia</Text>
            <TextInput
              style={styles.input}
              value={emergencyName}
              onChangeText={setEmergencyName}
              placeholder="Nombre de contacto"
              placeholderTextColor="#B0B0B0"
            />
            <TextInput
              style={[styles.input, { marginTop: 10 }]}
              value={emergencyPhone}
              onChangeText={setEmergencyPhone}
              placeholder="Teléfono de contacto"
              placeholderTextColor="#B0B0B0"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Botones de acción */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving || uploading}>
            <Ionicons name="save-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.saveBtnText}>Guardar Cambios</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#00796B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSectionTitle: {
    color: '#37474F',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#E0E0E0',
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  photoBtnText: {
    color: '#00796B',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  inputGroup: {
    flex: 1,
  },
  inputGroupFull: {
    marginBottom: 10,
  },
  inputLabel: {
    color: '#37474F',
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 15,
    color: '#37474F',
    borderWidth: 1,
    borderColor: '#E2ECED',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    marginBottom: 30,
    gap: 10,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1CEA9B',
    borderRadius: 12,
    paddingVertical: 14,
    justifyContent: 'center',
    marginRight: 8,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#B0B0B0',
    justifyContent: 'center',
    marginLeft: 8,
  },
  cancelBtnText: {
    color: '#37474F',
    fontWeight: 'bold',
    fontSize: 16,
  },
});