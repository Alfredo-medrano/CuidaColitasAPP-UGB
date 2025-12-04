// App.js

import 'react-native-url-polyfill/auto';
import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { COLORS } from './src/theme/theme';
import AnimatedSplash from './src/components/AnimatedSplash';

// Prevenir que splash nativo se oculte automáticamente
SplashScreen.preventAutoHideAsync().catch(() => { });

// --- REACT QUERY (CACHÉ) ---
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, queryPersister } from './src/config/queryClient';

// --- NOTIFICACIONES PUSH ---
import {
  initializeNotifications,
  handleNotificationResponse
} from './src/services/notificationService';

// --- NUESTRAS IMPORTACIONES ---
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Importa todas tus pantallas
import SignIn from './src/screens/Auth/Signin';
import SignUp from './src/screens/Auth/signup';
import ForgotPassword from './src/screens/Auth/ForgotPassword';
import ResetPassword from './src/screens/Auth/ResetPassword';
import Home from './src/screens/Home';
import VeterinarioHome from './src/screens/Vet/VeterinarioHome';
import Profile from './src/screens/Vet/Profile';
import EditProfile from './src/screens/Vet/EditProfile';
import MisPacientes from './src/screens/Vet/MisPacientes';
import AgendaDelDia from './src/screens/Vet/AgendaDelDia';
import NuevaCita from './src/screens/Vet/NuevaCita';
import NuevoPaciente from './src/screens/Vet/NuevoPaciente';
import DetallePaciente from './src/screens/Vet/DetallePaciente';
import Notificaciones from './src/components/Notificaciones';
import HistorialMedico from './src/screens/Vet/HistorialMedico';
import NuevaVisita from './src/screens/Vet/NuevaVisita';
import NuevaVacuna from './src/screens/Vet/NuevaVacuna';
import NuevoMedicamento from './src/screens/Vet/NuevoMedicamento';
import ClienteHome from './src/screens/Client/ClienteHome';
import ProfileCliente from './src/screens/Client/ProfileCliente';
import EditProfileClient from './src/screens/Client/EditProfileClient';
import MisCitas from './src/screens/Client/MisCitas';
import SolicitarCita from './src/screens/Client/SolicitarCita';
import ReprogramarCita from './src/screens/Client/ReprogramarCita';
import MisMascotas from './src/screens/Client/MisMascotas';
import HistorialMedicoC from './src/screens/Client/HistorialMedicoC';
import DetalleCita from './src/components/DetalleCita';
import AdminHome from './src/screens/admin/AdminHome';
import AdminProfile from './src/screens/admin/AdminProfile';
import GestionVets from './src/screens/admin/GestionVets';
import EditVet from './src/screens/admin/EditVet';
import GestionClientes from './src/screens/admin/GestionClientes';
import DetalleCliente from './src/screens/admin/DetalleCliente';
import CalendarioMaestro from './src/screens/admin/CalendarioMaestro';
import AdminStats from './src/screens/admin/AdminStats';
import AdminMensajes from './src/screens/admin/AdminMensajes';
import AdminNotificaciones from './src/screens/admin/AdminNotificaciones';
import GestionMascotas from './src/screens/admin/GestionMascotas';
import AdminNuevaCita from './src/screens/admin/AdminNuevaCita';
import AdminLogs from './src/screens/admin/AdminLogs';
import ConfiguracionSistema from './src/screens/admin/ConfiguracionSistema';
import ConversationListScreen from './src/screens/Chat/ConversationListScreen';
import ChatScreen from './src/screens/Chat/ChatScreen';
import BotpressScreen from './src/screens/ChatBot/BotpressScreen';
import MaintenanceScreen from './src/screens/MaintenanceScreen';

const Stack = createNativeStackNavigator();

// navegacion de autenticacion
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SignIn" component={SignIn} />
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
    </Stack.Navigator>
  );
}

// navegacion principal de la app
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      {/* Home es la primera pantalla para redirigir según rol */}
      <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />

      {/* Pantallas de Cliente */}
      <Stack.Screen name="ClienteHome" component={ClienteHome} options={{ headerShown: false }} />
      <Stack.Screen name="ProfileCliente" component={ProfileCliente} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfileClient" component={EditProfileClient} options={{ headerShown: false }} />
      <Stack.Screen name="MisMascotas" component={MisMascotas} options={{ headerShown: false }} />
      <Stack.Screen name="HistorialMedicoC" component={HistorialMedicoC} options={{ headerShown: false }} />
      <Stack.Screen name="MisCitas" component={MisCitas} options={{ headerShown: false }} />
      <Stack.Screen name="SolicitarCita" component={SolicitarCita} options={{ headerShown: false }} />
      <Stack.Screen name="ReprogramarCita" component={ReprogramarCita} options={{ headerShown: false }} />

      {/* Pantallas de Veterinario */}
      <Stack.Screen name="VeterinarioHome" component={VeterinarioHome} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={Profile} options={{ headerShown: false }} />
      <Stack.Screen name="EditProfile" component={EditProfile} options={{ headerShown: false }} />
      <Stack.Screen name="MisPacientes" component={MisPacientes} options={{ headerShown: false }} />
      <Stack.Screen name="AgendaDelDia" component={AgendaDelDia} options={{ headerShown: false }} />
      <Stack.Screen name="NuevaCita" component={NuevaCita} options={{ headerShown: false }} />
      <Stack.Screen name="NuevoPaciente" component={NuevoPaciente} options={{ title: 'Nuevo Paciente' }} />
      <Stack.Screen name="DetallePaciente" component={DetallePaciente} options={{ headerShown: false }} />
      <Stack.Screen name="HistorialMedico" component={HistorialMedico} options={{ headerShown: false }} />
      <Stack.Screen name="NuevaVisita" component={NuevaVisita} options={{ headerShown: false }} />
      <Stack.Screen name="NuevaVacuna" component={NuevaVacuna} options={{ headerShown: false }} />
      <Stack.Screen name="NuevoMedicamento" component={NuevoMedicamento} options={{ headerShown: false }} />

      {/* Pantallas de Admin */}
      <Stack.Screen name="AdminHome" component={AdminHome} options={{ headerShown: false }} />
      <Stack.Screen name="AdminProfile" component={AdminProfile} options={{ title: 'Mi Perfil' }} />
      <Stack.Screen name="Vets" component={GestionVets} options={{ headerShown: false }} />
      <Stack.Screen name="EditVet" component={EditVet} options={{ headerShown: false }} />
      <Stack.Screen name="Clients" component={GestionClientes} options={{ headerShown: false }} />
      <Stack.Screen name="DetalleCliente" component={DetalleCliente} options={{ headerShown: false }} />
      <Stack.Screen name="CalendarioMaestro" component={CalendarioMaestro} options={{ headerShown: false }} />
      <Stack.Screen name="Stats" component={AdminStats} options={{ title: 'Estadísticas' }} />
      <Stack.Screen name="AdminMensajes" component={AdminMensajes} options={{ headerShown: false }} />
      <Stack.Screen name="AdminNotificaciones" component={AdminNotificaciones} options={{ headerShown: false }} />
      <Stack.Screen name="GestionMascotas" component={GestionMascotas} options={{ headerShown: false }} />
      <Stack.Screen name="AdminNuevaCita" component={AdminNuevaCita} options={{ headerShown: false }} />
      <Stack.Screen name="AdminLogs" component={AdminLogs} options={{ headerShown: false }} />
      <Stack.Screen name="ConfiguracionSistema" component={ConfiguracionSistema} options={{ headerShown: false }} />

      {/* Pantallas Comunes / Chat */}
      <Stack.Screen name="DetalleCita" component={DetalleCita} options={{ title: 'Detalle de Cita' }} />
      <Stack.Screen name="Mensajes" component={ConversationListScreen} options={{ title: 'Mensajes' }} />
      <Stack.Screen name="ChatScreen" component={ChatScreen} options={({ route }) => ({ title: route.params?.other_user_name || 'Chat' })} />
      <Stack.Screen name="ChatBot" component={BotpressScreen} options={{ title: 'Asistente Virtual', headerStyle: { backgroundColor: COLORS.primary }, headerTintColor: '#fff' }} />
      <Stack.Screen name="Notificaciones" component={Notificaciones} options={{ title: 'Notificaciones' }} />
    </Stack.Navigator>
  );
}

// Aqui se decide que stack mostrar
function RootNavigator() {
  const { session, loading, isMaintenance, profile } = useAuth();
  const navigationRef = useRef(null);

  // Estado para controlar splash animado
  const [showSplash, setShowSplash] = useState(true);

  const [fontsLoaded] = useFonts({
    'Poppins-Regular': require('./src/assets/fonts/Poppins-Regular.ttf'),
    'Poppins-SemiBold': require('./src/assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('./src/assets/fonts/Poppins-Bold.ttf'),
  });

  // Inicializar notificaciones cuando el usuario está autenticado
  useEffect(() => {
    if (session?.user) {
      initializeNotifications(navigationRef.current);
    }
  }, [session]);

  // Ocultar splash nativo inmediatamente
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => { });
  }, []);

  // Callback cuando termina la animación del splash
  const handleSplashEnd = () => {
    setShowSplash(false);
  };

  // Mostrar splash animado primero
  if (showSplash) {
    return <AnimatedSplash onAnimationEnd={handleSplashEnd} />;
  }

  // Mientras cargan fuentes o auth, mostrar loading
  if (loading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  // Check for maintenance mode
  if (isMaintenance) {
    const isAdmin = profile?.roles?.name === 'admin';
    if (!isAdmin) {
      return <MaintenanceScreen />;
    }
  }

  return (
    <NavigationContainer ref={navigationRef}>
      {session && session.user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: queryPersister }}
    >
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </PersistQueryClientProvider>
  );
}