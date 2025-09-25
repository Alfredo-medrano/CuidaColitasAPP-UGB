import 'react-native-url-polyfill/auto';
import React, {useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from './src/api/Supabase'; // <-- CORREGIDO

// --- Pantallas de Autenticación ---
import SignIn from './src/screens/Auth/Signin';
import SignUp from './src/screens/Auth/signup';
import ForgotPassword from './src/screens/Auth/ForgotPassword';
import ResetPassword from './src/screens/Auth/ResetPassword';

// --- Pantalla Principal ---
import Home from './src/screens/Home';

// --- Pantallas del Veterinario ---
import VeterinarioHome from './src/screens/Vet/VeterinarioHome';
import Profile from './src/screens/Vet/Profile'; 
import EditProfile from './src/screens/Vet/EditProfile';
import MisPacientes from './src/screens/Vet/MisPacientes';
import AgendaDelDia from './src/screens/Vet/AgendaDelDia';
import Mensajes from './src/screens/Vet/Mensajes';
import NuevaCita from './src/screens/Vet/NuevaCita';
import NuevoPaciente from './src/screens/Vet/NuevoPaciente';
import DetallePaciente from './src/screens/Vet/DetallePaciente';
import Notificaciones from './src/screens/Vet/Notificaciones';
import HistorialMedico from './src/screens/Vet/HistorialMedico';
import NuevaVisita from './src/screens/Vet/NuevaVisita';
import NuevaVacuna from './src/screens/Vet/NuevaVacuna';
import NuevoMedicamento from './src/screens/Vet/NuevoMedicamento';

// --- Pantallas del Cliente ---
import ClienteHome from './src/screens/Client/ClienteHome';
import ProfileCliente from './src/screens/Client/ProfileCliente';
import EditProfileClient from './src/screens/Client/EditProfileClient';
import MisCitas from './src/screens/Client/MisCitas';
import SolicitarCita from './src/screens/Client/SolicitarCita';
import ReprogramarCita from './src/screens/Client/ReprogramarCita';

// --- Componentes Reutilizables ---
import DetalleCita from './src/components/DetalleCita'; // <-- CORREGIDO

const Stack = createNativeStackNavigator();

// --- 1. NAVEGADOR PARA EL FLUJO DE AUTENTICACIÓN ---
// (Esta parte no necesita cambios)
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center', headerShown: false }}>
      <Stack.Screen name="SignIn" component={SignIn} />
      <Stack.Screen name="SignUp" component={SignUp} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
    </Stack.Navigator>
  );
}

// --- 2. NAVEGADOR PARA EL FLUJO PRINCIPAL DE LA APP ---
// (Esta parte no necesita cambios)
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
      <Stack.Screen name="VeterinarioHome" component={VeterinarioHome} options={{ headerShown: false }} />
      <Stack.Screen name="ClienteHome" component={ClienteHome} options={{ title: 'Cliente' }} />
      <Stack.Screen name="MisPacientes" component={MisPacientes} options={{ title: 'Mis Pacientes' }} />
      <Stack.Screen name="AgendaDelDia" component={AgendaDelDia} options={{ title: 'Agenda del Día' }} />
      <Stack.Screen name="Mensajes" component={Mensajes} options={{ title: 'Mensajes' }} />
      <Stack.Screen name="NuevaCita" component={NuevaCita} options={{ title: 'Nueva Cita' }} />
      <Stack.Screen name="NuevoPaciente" component={NuevoPaciente} options={{ title: 'Nuevo Paciente' }} />
      <Stack.Screen name="DetallePaciente" component={DetallePaciente} options={{ title: 'Detalle del Paciente' }} />
      <Stack.Screen name="Notificaciones" component={Notificaciones} options={{ title: 'Notificaciones' }} />
      <Stack.Screen name="HistorialMedico" component={HistorialMedico} options={{ title: 'Historial Médico' }} />
      <Stack.Screen name="NuevaVisita" component={NuevaVisita} options={{ title: 'Nueva Visita' }} />
      <Stack.Screen name="NuevaVacuna" component={NuevaVacuna} options={{ title: 'Nueva Vacuna' }} />
      <Stack.Screen name="NuevoMedicamento" component={NuevoMedicamento} options={{ title: 'Nuevo Medicamento' }} />
      <Stack.Screen name="EditProfileClient" component={EditProfileClient} options={{ title: 'Editar Perfil' }} />
      <Stack.Screen name="MisCitas" component={MisCitas} options={{ title: 'Mis Citas' }} />
      <Stack.Screen name="SolicitarCita" component={SolicitarCita} options={{ title: 'Solicitar Cita' }} />
      <Stack.Screen name="ReprogramarCita" component={ReprogramarCita} options={{ title: 'Reprogramar Cita' }} />
      <Stack.Screen name="DetalleCita" component={DetalleCita} options={{ title: 'Detalle de Cita' }} />
      <Stack.Screen name="Profile" component={Profile} options={{ title: 'Mi Perfil', headerStyle: { backgroundColor: '#013847' }, headerTintColor: '#fff',}} />
      <Stack.Screen name="ProfileCliente" component={ProfileCliente} options={{ title: 'Mi Perfil', headerStyle: { backgroundColor: '#43C0AF' }, headerTintColor: '#fff',}}/>
      <Stack.Screen name="EditProfile" component={EditProfile} options={{ title: 'Editar Perfil',}} /> 
    </Stack.Navigator>
  );
}


// (Esta parte no necesita cambios)
export default function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {session && session.user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}