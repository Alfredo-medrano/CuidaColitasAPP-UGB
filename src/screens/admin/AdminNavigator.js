// src/navigation/AdminNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, FONTS } from '../../theme/theme'; // ← ajusta la ruta si es distinta

// Pantallas
import AdminHome from './AdminHome.js';
const VetsScreen = () => null;
const ClientsScreen = () => null;
const StatsScreen = () => null;

const Tab = createBottomTabNavigator();

export default function AdminNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: '#7A8B8F',
        tabBarLabelStyle: {
          fontFamily: FONTS.PoppinsRegular,
          fontSize: 11,
          marginBottom: 2,
        },
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: 'rgba(0,0,0,0.06)',
          height: 64,
          paddingTop: 6,
          paddingBottom: 6,
          borderTopLeftRadius: 14,
          borderTopRightRadius: 14,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          elevation: 12,
        },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={AdminHome}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="view-grid-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Vets"
        component={VetsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="stethoscope" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Clientes"
        component={ClientsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-group-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-line" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
