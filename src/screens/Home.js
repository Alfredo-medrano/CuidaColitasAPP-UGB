import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, ImageBackground, Alert } from 'react-native';
import { supabase } from '../api/Supabase';
import { useIsFocused } from '@react-navigation/native';

export default function Home({ navigation }) {
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const fetchUserAndRedirect = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return;
      }

      const { data, error } = await supabase
        .from('profiles') 
        .select('role:roles ( name )') 
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      const role = data?.role?.name;

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
        setLoading(false);
    }
  };

  useEffect(() => {
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