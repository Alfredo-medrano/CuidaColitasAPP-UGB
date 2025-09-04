import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, ImageBackground } from 'react-native';
import { supabase } from '../Supabase';

export default function Home({ navigation }) {
  // El estado de 'loading' no es estrictamente necesario aquí, 
  // ya que la pantalla navega de inmediato, pero no causa problemas.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndRedirect = async () => {
      try {
        // 1. Obtenemos el usuario de la sesión
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          // Si no hay usuario, el listener de App.js ya se encargaría de esto.
          return; 
        }

        // 2. Usamos la consulta correcta con el nombre de tabla correcto
        const { data, error } = await supabase
          .from('profiles') // <-- CORRECCIÓN: El nombre de la tabla es en plural
          .select('roles ( name )') // Obtenemos el 'name' de la tabla 'roles'
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        const role = data?.roles?.name;

        // 3. Redirigimos según el rol obtenido
        if (role === 'veterinario') {
          navigation.replace('VeterinarioHome');
        } else if (role === 'cliente') {
          navigation.replace('ClienteHome');
        } else {
          // Si el rol no se reconoce, cerramos sesión por seguridad
          console.error("Rol no reconocido:", role);
          await supabase.auth.signOut();
        }
      } catch (error) {
        console.error('Error al obtener el rol y redirigir:', error.message);
        // Si hay algún error, es más seguro cerrar la sesión
        await supabase.auth.signOut();
      }
      // No es necesario llamar a setLoading(false) porque el componente se desmontará.
    };

    fetchUserAndRedirect();
  }, [navigation]);

  // Esta pantalla solo se verá por un instante mientras se obtiene el rol.
  return (
    <ImageBackground 
      source={require('../assets/welcome.jpg')}
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

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#ffffff',
    fontSize: 40,
    fontWeight: 'bold',
    textShadowColor: 'rgba(90, 194, 59, 0.671)',
    textShadowOffset: { width: -1, height: 5 },
    textShadowRadius: 10,
  }
});