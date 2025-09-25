import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, ImageBackground, Alert } from 'react-native';
import { supabase } from '../api/Supabase';
import { useIsFocused } from '@react-navigation/native';

export default function Home({ navigation }) {
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const fetchUserAndRedirect = async () => {
    try {
      // 1. Verificar si hay un usuario logueado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // Si no hay usuario, la navegación condicional en App.js lo maneja.
        // Solo salimos de esta función.
        return;
      }

      // 2. Obtener el rol del usuario desde la base de datos
      const { data, error } = await supabase
        .from('profiles') 
        .select('role:roles ( name )') 
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      const role = data?.role?.name;

      // 3. Redirigir según el rol
      if (role === 'veterinario') {
        navigation.replace('VeterinarioHome');
      } else if (role === 'cliente') {
        navigation.replace('ClienteHome');
      } else {
        console.error("Rol no reconocido:", role);
        Alert.alert("Error de Acceso", "Tu rol no es válido. Saliendo de la sesión.");
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Error al obtener el rol y redirigir:', error.message);
      Alert.alert("Error de Redirección", "No pudimos verificar tu rol. Saliendo de la sesión.");
      await supabase.auth.signOut();
    } finally {
        // Este bloque se ejecuta siempre, asegurando que el loading se detenga.
        setLoading(false);
    }
  };

  useEffect(() => {
    // Solo ejecutamos la lógica de redirección cuando la pantalla está enfocada.
    if (isFocused) {
        fetchUserAndRedirect();
    }
  }, [isFocused]);

  if (loading) {
    return (
        <ImageBackground 
            source={require('../assets/welcome.png')}
            style={styles.container}
            resizeMode="cover"
        >
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#ffffff" />
                <Text style={styles.loadingText}>Verificando usuario...</Text>
            </View>
        </ImageBackground>
    );
  }

  // Si no está cargando y no se ha redirigido, se muestra un fallback
  return (
    <View style={styles.container}>
        <Text>Error de carga o redirección</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(90, 194, 59, 0.671)',
    textShadowOffset: { width: -1, height: 5 },
    textShadowRadius: 10,
  }
});