import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

// El Navbar ahora recibe 'userTitle' y 'onNotificationsClick'
const Navbar = ({ userName, userTitle, onProfileClick, onNotificationsClick }) => {
  return (
    <View style={styles.navbar}>
      {/* Ícono de perfil (estetoscopio) */}
      <Pressable onPress={onProfileClick}>
        <View style={styles.iconContainer}>
          <Icon name="stethoscope" size={22} color="#013847" />
        </View>
      </Pressable>

      {/* Saludo y título del usuario */}
      <View style={styles.titleContainer}>
        <Text style={styles.greeting}>Hola, {userName}</Text>
        <Text style={styles.title}>{userTitle}</Text>
      </View>

      {/* Ícono de notificaciones */}
      <Pressable onPress={onNotificationsClick}>
        <Icon name="bell" solid size={24} color="#fff" />
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  navbar: {
    backgroundColor: '#013847',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 50, // Espacio para la barra de estado del teléfono
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    // Se eliminó 'position: absolute' para un mejor layout
  },
  iconContainer: {
    backgroundColor: '#fff',
    borderRadius: 20, // Lo hace perfectamente circular
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    // El contenedor del texto se alinea a la izquierda
    flex: 1,
    marginLeft: 15,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  title: {
    fontSize: 14,
    color: '#d3d3d3', // Un gris claro para el subtítulo
  },
});

export default Navbar;