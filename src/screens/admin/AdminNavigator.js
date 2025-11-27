import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, FONTS } from '../../theme/theme';

// Pantallas
import AdminHome from './AdminHome';
import AdminProfile from './AdminProfile';
import GestionVets from './GestionVets';
import EditVet from './EditVet';
import GestionClientes from './GestionClientes';
import DetalleCliente from './DetalleCliente';
import CalendarioMaestro from './CalendarioMaestro';
import AdminStats from './AdminStats';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// --- Stacks para cada Tab ---

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminHomeScreen" component={AdminHome} />
      <Stack.Screen name="CalendarioMaestro" component={CalendarioMaestro} />
    </Stack.Navigator>
  );
}

function VetsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GestionVetsScreen" component={GestionVets} />
      <Stack.Screen name="EditVet" component={EditVet} />
    </Stack.Navigator>
  );
}

function ClientsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GestionClientesScreen" component={GestionClientes} />
      <Stack.Screen name="DetalleCliente" component={DetalleCliente} />
    </Stack.Navigator>
  );
}

function StatsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminStatsScreen" component={AdminStats} />
    </Stack.Navigator>
  );
}

// --- Bottom Tab Navigator ---

function AdminTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: COLORS.white,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
        tabBarHideOnKeyboard: true,

        tabBarStyle: {
          backgroundColor: COLORS.primary,
          borderTopWidth: 0,
          elevation: 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
        },

        tabBarLabelStyle: {
          fontFamily: FONTS.PoppinsSemiBold,
          fontSize: 11,
          marginBottom: 0,
        },

        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'view-dashboard' : 'view-dashboard-outline';
          } else if (route.name === 'Vets') {
            iconName = 'stethoscope';
          } else if (route.name === 'Clients') {
            iconName = focused ? 'account-group' : 'account-group-outline';
          } else if (route.name === 'Stats') {
            iconName = 'chart-bar';
          }

          return <MaterialCommunityIcons name={iconName} size={26} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
        options={{ tabBarLabel: 'Inicio' }}
      />
      <Tab.Screen
        name="Vets"
        component={VetsStack}
        options={{ tabBarLabel: 'Vets' }}
      />
      <Tab.Screen
        name="Clients"
        component={ClientsStack}
        options={{ tabBarLabel: 'Clientes' }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsStack}
        options={{ tabBarLabel: 'Stats' }}
      />
    </Tab.Navigator>
  );
}

// --- Root Navigator ---

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminTabs" component={AdminTabs} />
      <Stack.Screen name="AdminProfile" component={AdminProfile} />
    </Stack.Navigator>
  );
}