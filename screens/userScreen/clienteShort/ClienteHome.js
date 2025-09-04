import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { supabase } from '../../../Supabase'; // Asegúrate de que la ruta sea correcta

export default function ClienteHome() {

  // Esta función se encarga de cerrar la sesión del usuario
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      Alert.alert("Error", "No se pudo cerrar la sesión.");
      console.error('Error al cerrar sesión:', error.message);
    }
    // No necesitas navegar manualmente. Tu archivo App.js detectará
    // el cambio de sesión y te llevará al login automáticamente.
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido Cliente</Text>

      {/* Botón para cerrar sesión */}
      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Salir</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  title: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: '#013847' 
  },
  // Estilos para el nuevo botón
  logoutButton: {
    marginTop: 30,
    backgroundColor: '#FF4136', // Un color rojo para la acción de salir
    paddingVertical: 12,
    paddingHorizontal: 40,
    borderRadius: 8,
    elevation: 3, // Sombra para Android
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});