// src/screens/Home.js

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext'; // Importamos nuestro hook de autenticación
import { COLORS } from '../theme/theme';

export default function Home({ navigation }) {
  // Obtenemos el perfil del usuario y el estado de carga desde nuestro contexto global
  const { profile, loading } = useAuth();

  // Este efecto se ejecuta cada vez que el perfil del usuario cambia
  useEffect(() => {
    // Si no estamos cargando y ya tenemos un perfil...
    if (!loading && profile) {
      // Leemos el nombre del rol desde el perfil
      // NOTA: Asegúrate que en tu AuthContext estés obteniendo 'roles(name)' en la consulta del perfil.
      // Si no, puedes simplemente usar 'role_id' si es un número.
      const roleName = profile.roles?.name;

      // Redirigimos al usuario basado en su rol
      if (roleName === 'veterinario') {
        navigation.replace('VeterinarioHome');
      } else if (roleName === 'cliente') {
        navigation.replace('ClienteHome');
      } else {
        // Si el rol no es reconocido, por seguridad, lo mejor es cerrar sesión.
        // Esto podría pasar si hay datos inconsistentes en la base de datos.
        console.warn('Rol desconocido, cerrando sesión:', roleName);
        supabase.auth.signOut();
      }
    }
  }, [profile, loading, navigation]); // Dependencias del efecto

  // Mientras se carga el perfil, mostramos un indicador de actividad
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={COLORS.accent} />
    </View>
  );
}

// Estilos para el contenedor de carga
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
});