// src/screens/admin/AdminNavigator.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS, FONTS } from '../../theme/theme'; // Ajusta la ruta a tu theme

// Pantallas principales
import AdminHome from './AdminHome';
import AdminProfile from './AdminProfile';

const Stack = createStackNavigator();

/* Pantallas de relleno */
const VetsScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Pantalla de Veterinarios (WIP)</Text>
  </View>
);
const ClientsScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Pantalla de Clientes (WIP)</Text>
  </View>
);
const StatsScreen = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Pantalla de Estadísticas (WIP)</Text>
  </View>
);


export default function AdminNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="AdminHome"
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.white,
          elevation: 1,
          shadowOpacity: 0.05,
        },
        headerTintColor: COLORS.black,
        headerTitleStyle: {
          fontFamily: FONTS.PoppinsSemiBold,
          fontSize: 18,
        },
        headerBackTitleVisible: false,
      }}
    >
      {/* 2. AdminHome sin header propio */}
      <Stack.Screen
        name="AdminHome"
        component={AdminHome}
        options={{ headerShown: false }}
      />
      
      {/* 3. El resto de pantallas con header */}
      <Stack.Screen
        name="AdminProfile"
        component={AdminProfile} // <-- 3. ¡Ahora está registrado!
        options={{ title: 'Mi Perfil' }}
      />
      <Stack.Screen
        name="Vets"
        component={VetsScreen}
        options={{ title: 'Gestionar Veterinarios' }}
      />
      <Stack.Screen
        name="Clients"
        component={ClientsScreen}
        options={{ title: 'Gestionar Clientes' }}
      />
      <Stack.Screen
        name="Stats"
        component={StatsScreen}
        options={{ title: 'Estadísticas' }}
      />
    </Stack.Navigator>
  );
}

// Estilos para las pantallas de relleno
const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  placeholderText: {
    fontFamily: FONTS.PoppinsRegular,
    fontSize: 16,
    color: '#777',
  },
});