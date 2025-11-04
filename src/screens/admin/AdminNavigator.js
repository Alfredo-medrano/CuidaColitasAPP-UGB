// src/screens/admin/AdminNavigator.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS, FONTS } from '../../theme/theme'; // Ajusta la ruta a tu theme

// Pantallas principales
import AdminHome from './AdminHome';
import AdminProfile from './AdminProfile';
import GestionVets from './GestionVets'; //

const Stack = createStackNavigator();



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

      <Stack.Screen
        name="AdminHome"
        component={AdminHome}
        options={{ headerShown: false }}
      />
      
      <Stack.Screen
        name="AdminProfile"
        component={AdminProfile}
        options={{ title: 'Mi Perfil' }}
      />

   
      <Stack.Screen
        name="Vets"
        component={GestionVets} 
        options={{ headerShown: false }} 
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