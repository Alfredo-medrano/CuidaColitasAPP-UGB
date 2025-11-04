import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../context/AuthContext'; 
import { COLORS, FONTS, SIZES } from '../../theme/theme'; 

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
          <Text style={styles.infoLabel}>Cuenta de Administrador</Text>
          <Text style={styles.infoEmail}>{user?.email || 'Cargando...'}</Text>
        </View>

        <ProfileButton
          icon="account-edit-outline"
          text="Editar Información"
          onPress={() => Alert.alert('WIP', 'Próximamente: Editar Perfil')}
        />
        <ProfileButton
          icon="security"
          text="Seguridad y Contraseña"
          onPress={() => Alert.alert('WIP', 'Próximamente: Cambiar Contraseña')}
        />
        
        {/* Botón de Cerrar Sesión */}
        <ProfileButton
          icon="logout"
          text="Cerrar Sesión"
          onPress={handleLogout}
          isDestructive={true}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  infoBox: {
    marginBottom: 24,
    padding: 14,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  infoLabel: {
    fontFamily: FONTS.PoppinsRegular,
    fontSize: 12,
    color: COLORS.gray,
  },
  infoEmail: {
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: 16,
    color: COLORS.black,
    marginTop: 2,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    marginBottom: 10,
  },
  buttonText: {
    flex: 1,
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: 16,
    color: COLORS.black,
    marginLeft: 12,
  },
  destructiveButton: {
    marginTop: 20, 
  },
  destructiveText: {
    color: COLORS.accent, 
  },
});

export default AdminProfile;