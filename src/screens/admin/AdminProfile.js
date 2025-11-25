import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Modal,
  TextInput,
  ActivityIndicator,
  Image,
  Platform
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../api/Supabase';
import { COLORS, FONTS, SIZES } from '../../theme/theme';

const BUCKET_ID = 'attachments';

// Componente de botón reutilizable
const ProfileButton = ({ icon, text, onPress, isDestructive = false }) => (
  <TouchableOpacity
    style={[styles.button, isDestructive && styles.destructiveButton]}
    onPress={onPress}
  >
    <MaterialCommunityIcons
      name={icon}
      size={22}
      color={isDestructive ? COLORS.accent : COLORS.primary}
    />
    <Text
      style={[styles.buttonText, isDestructive && styles.destructiveText]}
    >
      {text}
    </Text>
    <MaterialCommunityIcons
      name="chevron-right"
      size={22}
      color={isDestructive ? COLORS.accent : COLORS.gray}
    />
  </TouchableOpacity>
);

const AdminProfile = () => {
  const { signOut, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estados para Modales
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);

  // Estados para Edición de Perfil
  const [formData, setFormData] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);

  // Estados para Cambio de Contraseña
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  // Estados para Imagen
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [mediaPerm, requestMediaPerm] = ImagePicker.useMediaLibraryPermissions();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
      setFormData({
        name: data.name || '',
        phone: data.phone_number || '',
        address: data.address || ''
      });

      // Cargar avatar si existe
      if (data.avatar_url) {
        const { data: signed, error: signErr } = await supabase
          .storage.from(BUCKET_ID)
          .createSignedUrl(data.avatar_url, 60 * 60); // 1 hora
        if (!signErr) setAvatarUrl(signed.signedUrl);
      }

    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      if (!mediaPerm || mediaPerm.status !== 'granted') {
        const perm = await requestMediaPerm();
        if (!perm.granted) {
          Alert.alert('Permiso requerido', 'Se necesita acceso a la galería para cambiar la foto.');
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0].uri) {
        await uploadAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir la galería');
    }
  };

  const uploadAvatar = async (uri) => {
    try {
      setUploading(true);

      const res = await fetch(uri);
      const arrayBuffer = await res.arrayBuffer();
      const fileBytes = new Uint8Array(arrayBuffer);

      const ext = uri.split('.').pop().toLowerCase() === 'png' ? 'png' : 'jpg';
      const filePath = `${user.id}.${ext}`;
      const contentType = ext === 'png' ? 'image/png' : 'image/jpeg';

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_ID)
        .upload(filePath, fileBytes, {
          upsert: true,
          contentType: contentType,
        });

      if (uploadError) throw uploadError;

      // Actualizar perfil con la nueva ruta
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: filePath })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Obtener nueva URL firmada
      const { data: signed } = await supabase
        .storage.from(BUCKET_ID)
        .createSignedUrl(filePath, 60 * 60);

      setAvatarUrl(signed.signedUrl);
      Alert.alert('Éxito', 'Foto de perfil actualizada');

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'El nombre es obligatorio');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: formData.name,
          phone_number: formData.phone,
          address: formData.address
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('Éxito', 'Perfil actualizado correctamente');
      setProfile({ ...profile, ...formData, phone_number: formData.phone });
      setEditModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword });
      if (error) throw error;

      Alert.alert('Éxito', 'Contraseña actualizada correctamente');
      setPasswordModalVisible(false);
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar la sesión: ' + error.message);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      <View style={styles.container}>

        <View style={styles.infoBox}>
          <TouchableOpacity onPress={pickImage} disabled={uploading}>
            <View style={styles.avatarContainer}>
              {uploading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <MaterialCommunityIcons name="shield-account" size={40} color={COLORS.primary} />
              )}
              <View style={styles.editIconBadge}>
                <MaterialCommunityIcons name="camera" size={12} color="white" />
              </View>
            </View>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            <Text style={styles.infoName}>{profile?.name || 'Administrador'}</Text>
            <Text style={styles.infoEmail}>{user?.email || 'Cargando...'}</Text>
            <Text style={styles.infoRole}>Rol: Administrador</Text>
          </View>
        </View>

        <ProfileButton
          icon="account-edit-outline"
          text="Editar Información"
          onPress={() => setEditModalVisible(true)}
        />
        <ProfileButton
          icon="lock-reset"
          text="Cambiar Contraseña"
          onPress={() => setPasswordModalVisible(true)}
        />

        <ProfileButton
          icon="logout"
          text="Cerrar Sesión"
          onPress={handleLogout}
          isDestructive={true}
        />
      </View>

      {/* Modal Editar Perfil */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>

            <Text style={styles.label}>Nombre Completo</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(t) => setFormData({ ...formData, name: t })}
            />

            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={formData.phone}
              onChangeText={(t) => setFormData({ ...formData, phone: t })}
              keyboardType="phone-pad"
            />

            <Text style={styles.label}>Dirección</Text>
            <TextInput
              style={styles.input}
              value={formData.address}
              onChangeText={(t) => setFormData({ ...formData, address: t })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setEditModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleUpdateProfile} disabled={saving}>
                {saving ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Guardar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Cambiar Contraseña */}
      <Modal visible={passwordModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cambiar Contraseña</Text>

            <Text style={styles.label}>Nueva Contraseña</Text>
            <TextInput
              style={styles.input}
              value={passwordData.newPassword}
              onChangeText={(t) => setPasswordData({ ...passwordData, newPassword: t })}
              secureTextEntry
            />

            <Text style={styles.label}>Confirmar Contraseña</Text>
            <TextInput
              style={styles.input}
              value={passwordData.confirmPassword}
              onChangeText={(t) => setPasswordData({ ...passwordData, confirmPassword: t })}
              secureTextEntry
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setPasswordModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleChangePassword} disabled={changingPassword}>
                {changingPassword ? <ActivityIndicator color="white" /> : <Text style={styles.saveBtnText}>Actualizar</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.white },
  container: { flex: 1, padding: 16 },

  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee'
  },
  avatarContainer: {
    width: 70, height: 70, borderRadius: 35, backgroundColor: '#e0f7fa',
    justifyContent: 'center', alignItems: 'center', marginRight: 15,
    position: 'relative'
  },
  avatarImage: {
    width: 70, height: 70, borderRadius: 35
  },
  editIconBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: COLORS.primary, width: 24, height: 24, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white'
  },
  infoName: { fontFamily: FONTS.PoppinsBold, fontSize: 18, color: COLORS.primary },
  infoEmail: { fontFamily: FONTS.PoppinsRegular, fontSize: 14, color: COLORS.gray },
  infoRole: { fontFamily: FONTS.PoppinsSemiBold, fontSize: 12, color: COLORS.accent, marginTop: 4 },

  button: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 12,
    backgroundColor: COLORS.white, borderRadius: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', marginBottom: 10,
  },
  buttonText: { flex: 1, fontFamily: FONTS.PoppinsSemiBold, fontSize: 16, color: COLORS.black, marginLeft: 12 },
  destructiveButton: { marginTop: 20 },
  destructiveText: { color: COLORS.accent },

  // Modal Styles
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 5 },
  modalTitle: { fontFamily: FONTS.PoppinsBold, fontSize: 18, marginBottom: 20, textAlign: 'center', color: COLORS.primary },
  label: { fontFamily: FONTS.PoppinsSemiBold, fontSize: 14, color: COLORS.gray, marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 15, fontFamily: FONTS.PoppinsRegular },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
  cancelBtn: { backgroundColor: '#f0f0f0' },
  saveBtn: { backgroundColor: COLORS.primary },
  cancelBtnText: { fontFamily: FONTS.PoppinsSemiBold, color: COLORS.gray },
  saveBtnText: { fontFamily: FONTS.PoppinsSemiBold, color: 'white' },
});

export default AdminProfile;