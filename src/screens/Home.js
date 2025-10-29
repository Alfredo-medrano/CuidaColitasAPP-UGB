import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../api/Supabase';
import { useAuth } from '../context/AuthContext';

const Home = ({ navigation }) => {
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      getProfile();
    } else {
      navigation.replace('Signin'); // Asegúrate que tu ruta se llame 'Signin'
    }
  }, [session]);

  const getProfile = async () => {
    try {
      const { user } = session;

      // 1. Hacemos un 'join' para obtener el NOMBRE del rol
      let { data, error } = await supabase
        .from('profiles')
        .select(`
          role_id ( name ) 
        `) // <-- CORREGIDO: 'name' en lugar de 'nombre'
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data && data.role_id) {
        // 2. Comparamos el nombre del rol
        const roleName = data.role_id.name; // <-- CORREGIDO: 'name' en lugar de 'nombre'
        
        switch (roleName) {
          case 'admin':
            navigation.replace('AdminHome');
            break;
          case 'veterinario':
            navigation.replace('VeterinarioHome');
            break;
          case 'cliente':
            navigation.replace('ClienteHome');
            break;
          default:
            navigation.replace('ClienteHome');
        }
      } else {
        // Fallback si no hay perfil (ej. cliente)
        navigation.replace('ClienteHome');
      }
    } catch (error) {
      console.error('Error getting profile:', error.message);
      navigation.replace('Signin');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
};

export default Home;