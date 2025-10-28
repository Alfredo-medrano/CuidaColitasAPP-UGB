// EditProfile.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, Alert, ActivityIndicator, Image, TouchableOpacity, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { z } from 'zod';

import { supabase } from '../../api/Supabase';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SIZES } from '../../theme/theme';

const BUCKET_ID = 'attachments';

// -------------------- Validación --------------------
const ProfileUpdateSchema = z.object({
  name: z.string().min(2, 'Nombre demasiado corto').max(120).trim(),
  lastName: z.string().min(1, 'Apellidos requeridos').max(120).trim(),
  title: z.string().max(120, 'Máx 120 caracteres').trim().optional().nullable(),
  phone: z.string().regex(/^[\d+\-\s()]{7,20}$/, 'Teléfono inválido').trim(),
  collegeId: z.string().min(3, 'Colegiado inválido').max(50).trim(),
  address: z.string().min(5, 'Dirección demasiado corta').max(250).trim(),
  avatarPath: z.string().nullable().optional(), // ruta en Storage
  clinicId: z.string().uuid().nullable().optional(),
});

// -------------------- Componentes --------------------
const FormInput = ({ label, value, onChangeText, placeholder, editable = true, ...props }) => {
  const isReadOnly = !editable;
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={[styles.input, isReadOnly && styles.inputReadOnly]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.primary + '80'}
        editable={editable}
        {...props}
      />
    </View>
  );
};

// -------------------- Pantalla --------------------
export default function EditProfile({ route, navigation }) {
  const { profile: initialProfile } = route.params || {};
  const { session, refetchProfile } = useAuth();

  // Estados de Carga
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Estados del Formulario
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [phone, setPhone] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [address, setAddress] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);     // Signed URL para mostrar
  const [avatarPath, setAvatarPath] = useState(null);   // Ruta real en Storage
  const [clinics, setClinics] = useState([]);
  const [selectedClinicId, setSelectedClinicId] = useState(null);
  const [clinicName, setClinicName] = useState('');

  // Permisos (Expo Go/emulador)
  const [mediaPerm, requestMediaPerm] = ImagePicker.useMediaLibraryPermissions();

  // --------- Carga inicial de datos reales ---------
  useEffect(() => {
    const hydrate = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No hay usuario autenticado');

        // Perfil fresco desde BD
        const { data: prof, error } = await supabase
          .from('profiles')
          .select('id,name,title,phone_number,college_id,address,avatar_url,clinic_id,updated_at')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        // nombre -> nombre + apellidos (para UI)
        const fullName = prof?.name || '';
        const parts = fullName.split(' ');
        setName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');

        setTitle(prof?.title || 'Medicina General Veterinaria');
        setPhone(prof?.phone_number || '+34 911 123 456');
        setCollegeId(prof?.college_id || 'COV-28-5678');
        setAddress(prof?.address || 'Calle Veterinarios 123, Madrid');
        setSelectedClinicId(prof?.clinic_id || null);

        // Guardamos la RUTA; generamos signed URL para mostrar
        setAvatarPath(prof?.avatar_url || null);
        if (prof?.avatar_url) {
          const { data: signed, error: signErr } = await supabase
            .storage.from(BUCKET_ID)
            .createSignedUrl(prof.avatar_url, 60 * 15);
          if (!signErr) setAvatarUrl(signed.signedUrl);
        } else {
          setAvatarUrl(null);
        }

        // Clínicas (para mostrar nombre)
        const { data: clinicsData } = await supabase.from('clinics').select('id,name');
        if (clinicsData) setClinics(clinicsData);
      } catch (e) {
        console.log('[EditProfile.hydrate]', e?.message);
        // Fallback a route.params si viene algo
        if (initialProfile) {
          const fullName = initialProfile.name || '';
          const parts = fullName.split(' ');
          setName(parts[0] || '');
          setLastName(parts.slice(1).join(' ') || '');
          setTitle(initialProfile.title || 'Medicina General Veterinaria');
          setPhone(initialProfile.phone_number || '+34 911 123 456');
          setCollegeId(initialProfile.college_id || 'COV-28-5678');
          setAddress(initialProfile.address || 'Calle Veterinarios 123, Madrid');
          setSelectedClinicId(initialProfile.clinic_id || null);
          setAvatarPath(initialProfile.avatar_url || null);
          setAvatarUrl(initialProfile.avatar_url || null);
        }
      } finally {
        setLoadingInitial(false);
      }
    };

    hydrate();
  }, [initialProfile]);

  // nombre de clínica read-only (como tu UI)
  useEffect(() => {
    const currentClinic = clinics.find(c => c.id === selectedClinicId);
    setClinicName(currentClinic?.name || '');
  }, [selectedClinicId, clinics]);

  // --------- Imagen: pick + upload (ruta + signed URL) ---------
  const pickImage = async () => {
    try {
      // 1) Permisos robustos
      if (!mediaPerm || mediaPerm.status !== 'granted') {
        const perm = await requestMediaPerm();
        if (!perm.granted) {
          Alert.alert(
            'Permiso requerido',
            Platform.OS === 'ios'
              ? 'Habilita “Fotos” para Expo Go en Ajustes > Privacidad > Fotos.'
              : 'Habilita “Fotos/Multimedia” para Expo Go en Ajustes > Apps > Expo Go > Permisos.'
          );
          return;
        }
      }

      // 2) Construir opciones según API disponible (evita warning)
      const opts = {
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
        selectionLimit: 1,
      };
      if (ImagePicker?.MediaType) {
        // API nueva: array de MediaType
        opts.mediaTypes = [ImagePicker.MediaType.Images];
      } else {
        // API antigua: enum
        opts.mediaTypes = ImagePicker.MediaTypeOptions.Images;
      }

      const result = await ImagePicker.launchImageLibraryAsync(opts);

      // 3) Procesar selección
      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        await uploadAvatar(result.assets[0].uri);
      } else if (Platform.OS === 'android') {
        console.log('[ImagePicker] No image selected / empty gallery');
      }
    } catch (e) {
      console.log('[pickImage] error', e?.message);
      Alert.alert('Error', 'No se pudo abrir la galería.');
    }
  };

  const uploadAvatar = async (uri) => {
    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no encontrado.');

      // Leer el archivo como arrayBuffer (evita .blob())
      const res = await fetch(uri);
      const arrayBuffer = await res.arrayBuffer();
      const fileBytes = new Uint8Array(arrayBuffer);

      // Derivar extensión por la URI (fallback a jpg)
      const rawExt = (uri.split('.').pop() || '').toLowerCase();
      const ext = ['png', 'webp', 'jpg', 'jpeg'].includes(rawExt) ? (rawExt === 'jpeg' ? 'jpg' : rawExt) : 'jpg';
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      // ✅ Guardar en la RAÍZ del bucket para cumplir RLS más simple: "<uid>.<ext>"
      const filePath = `${user.id}.${ext}`;

      // Subir binario
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_ID)
        .upload(filePath, fileBytes, {
          upsert: true,
          contentType: mime,
        });
      if (uploadError) throw uploadError;

      // Guardamos la RUTA en estado (se persistirá al guardar)
      setAvatarPath(filePath);

      // Mostrar signed URL temporal en la UI
      const { data: signed, error: signedErr } = await supabase
        .storage.from(BUCKET_ID)
        .createSignedUrl(filePath, 60 * 15);
      if (signedErr) throw signedErr;

      setAvatarUrl(signed.signedUrl);
    } catch (error) {
      console.log('[uploadAvatar]', error?.message);
      Alert.alert('Error', 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  // --------- Guardar cambios (validación + upsert seguro) ---------
  const handleSave = async () => {
    const parsed = ProfileUpdateSchema.safeParse({
      name, lastName, title, phone, collegeId, address,
      avatarPath, clinicId: selectedClinicId || null,
    });
    if (!parsed.success) {
      const first = parsed.error.errors?.[0];
      Alert.alert('Datos inválidos', first?.message || 'Verifica los campos obligatorios.');
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No hay un usuario logueado.');

      // Obtener role_id actual para no violar NOT NULL
      const { data: current, error: curErr } = await supabase
        .from('profiles')
        .select('role_id')
        .eq('id', user.id)
        .single();
      if (curErr) throw curErr;

      // Construir update explícito (evitar sobrescribir campos no editables)
      const updates = {
        id: user.id,
        name: `${name.trim()} ${lastName.trim()}`,
        title: (title || '').trim() || null,
        phone_number: phone.trim(),
        college_id: collegeId.trim(),
        address: address.trim(),
        clinic_id: selectedClinicId || null,
        role_id: current?.role_id || null,
        avatar_url: avatarPath || null, // guardamos RUTA (raíz), no URL pública
        updated_at: new Date().toISOString(),
      };

      const { error: saveError } = await supabase
        .from('profiles')
        .upsert(updates, { onConflict: 'id' });

      if (saveError) throw saveError;

      // refrescar signed URL si hay avatar
      if (avatarPath) {
        const { data: signed } = await supabase
          .storage.from(BUCKET_ID)
          .createSignedUrl(avatarPath, 60 * 15);
        if (signed?.signedUrl) setAvatarUrl(signed.signedUrl);
      }

      // refrescar perfil global
      if (refetchProfile) { try { await refetchProfile(true); } catch (_) {} }

      Alert.alert('Éxito', 'Perfil guardado correctamente.');
      navigation.goBack();
    } catch (e) {
      console.log('[handleSave]', e?.name, e?.code);
      Alert.alert('Error', 'No se pudo guardar el perfil. Intenta más tarde.');
    } finally {
      setSaving(false);
    }
  };

  if (loadingInitial) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* --- HEADER --- */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* --- SECCIÓN FOTO DE PERFIL --- */}
        <View style={[styles.card, styles.cardAvatar]}>
          <Text style={styles.cardTitle}>Foto de Perfil</Text>
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={pickImage} disabled={uploading} style={styles.avatarWrapper}>
              <View style={[styles.avatarCircle, { backgroundColor: COLORS.accent }]}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Ionicons name="bandage" size={40} color={COLORS.white} />
                )}
              </View>
              {uploading && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color={COLORS.white} size="large" />
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.changePhotoButton} onPress={pickImage} disabled={uploading}>
              <Ionicons name="camera-outline" size={20} color={COLORS.primary} />
              <Text style={styles.changePhotoButtonText}>Cambiar Foto</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- SECCIÓN INFORMACIÓN PROFESIONAL --- */}
        <View style={[styles.card, styles.cardInfo]}>
          <Text style={styles.cardTitle}>Información Profesional</Text>

          <View style={styles.row}>
            <FormInput label="Nombre" value={name} onChangeText={setName} placeholder="Carlos" />
            <FormInput label="Apellidos" value={lastName} onChangeText={setLastName} placeholder="González Ruiz" />
          </View>

          <FormInput
            label="Especialidad"
            value={title}
            onChangeText={setTitle}
            placeholder="Medicina General Veterinaria"
          />

          <View style={styles.row}>
            <FormInput
              label="Email"
              value={session?.user?.email || 'carlos.gonzalez@cuidacolitas.com'}
              editable={false}
            />
            <FormInput
              label="Teléfono"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+34 911 123 456"
            />
          </View>

          <View style={styles.row}>
            <FormInput
              label="Nº Colegiado"
              value={collegeId}
              onChangeText={setCollegeId}
              placeholder="COV-28-5678"
            />
            <FormInput
              label="Clínica"
              value={clinicName}
              onChangeText={setClinicName}
              placeholder="Clínica Veterinaria C"
              editable={false}
            />
          </View>

          <FormInput
            label="Dirección"
            value={address}
            onChangeText={setAddress}
            placeholder="Calle Veterinarios 123, Madrid"
          />
        </View>

        {/* --- BOTONES DE ACCIÓN --- */}
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.button, styles.cancelButton]}
            onPress={() => navigation.goBack()}
            disabled={saving || uploading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </Pressable>
          <Pressable
            style={[styles.button, styles.saveButton, (saving || uploading) && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={saving || uploading}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.primary} />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
              </>
            )}
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// -------------------- Estilos (sin cambios) --------------------
const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: COLORS.primary },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: SIZES.h2,
    color: COLORS.textPrimary
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingVertical: 10,
    paddingBottom: 40,
    backgroundColor: COLORS.secondary,
    flexGrow: 1,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: COLORS.white,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardAvatar: {
    backgroundColor: COLORS.secondary,
    alignItems: 'center',
    paddingVertical: 30,
    marginBottom: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  cardInfo: {
    marginTop: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  cardTitle: {
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: SIZES.h3,
    color: COLORS.primary,
    marginBottom: 15,
    textAlign: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 15,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 50,
  },
  changePhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  changePhotoButtonText: {
    fontFamily: FONTS.PoppinsSemiBold,
    color: COLORS.primary,
    marginLeft: 8,
    fontSize: SIZES.body,
  },
  inputGroup: {
    flex: 1,
    marginBottom: 10,
  },
  inputLabel: {
    fontFamily: FONTS.PoppinsRegular,
    fontSize: SIZES.body,
    color: COLORS.card,
    marginBottom: 4,
  },
  input: {
    backgroundColor: COLORS.textPrimary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: FONTS.PoppinsRegular,
    fontSize: SIZES.body,
    color: COLORS.primary,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  inputReadOnly: {
    backgroundColor: COLORS.secondary,
    color: COLORS.primary,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
    marginBottom: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 10,
    gap: 15,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
    elevation: 3,
  },
  saveButton: {
    backgroundColor: COLORS.accent,
  },
  saveButtonText: {
    fontFamily: FONTS.PoppinsBold,
    fontSize: SIZES.h3,
    color: COLORS.primary,
  },
  cancelButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  cancelButtonText: {
    fontFamily: FONTS.PoppinsBold,
    fontSize: SIZES.h3,
    color: COLORS.primary,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
