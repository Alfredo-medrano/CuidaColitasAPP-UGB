import 'react-native-url-polyfill/auto';
import React, {useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from './Supabase';

// --- Importa todas tus pantallas ---
import SignIn from './screens/Auth/Signin';
import SignUp from './screens/Auth/signup';
import ForgotPassword from './screens/Auth/ForgotPassword';
import ResetPassword from './screens/Auth/ResetPassword';
import Home from './screens/Home';
import VeterinarioHome from './screens/userScreen/vetShort/VeterinarioHome';
import Profile from './screens/userScreen/vetShort/Profile'; 
import EditProfile from './screens/userScreen/vetShort/EditProfile';
import ClienteHome from './screens/userScreen/clienteShort/ClienteHome';
import MisPacientes from './screens/userScreen/vetShort/MisPacientes';
import AgendaDelDia from './screens/userScreen/vetShort/AgendaDelDia';
import Mensajes from './screens/userScreen/vetShort/Mensajes';
import NuevaCita from './screens/userScreen/vetShort/NuevaCita';
import NuevoPaciente from './screens/userScreen/vetShort/NuevoPaciente';
import DetallePaciente from './screens/userScreen/vetShort/DetallePaciente';
import Notificaciones from './screens/userScreen/vetShort/Notificaciones';
import HistorialMedico from './screens/userScreen/vetShort/HistorialMedico';
import NuevaVisita from './screens/userScreen/vetShort/NuevaVisita';
import NuevaVacuna from './screens/userScreen/vetShort/NuevaVacuna';
import NuevoMedicamento from './screens/userScreen/vetShort/NuevoMedicamento';

// -- CORRECTO: Importamos el componente del perfil del cliente --
import ProfileCliente from './screens/userScreen/clienteShort/ProfileCliente';
import EditProfileClient from './screens/userScreen/clienteShort/EditProfileClient';
import MisCitas from './screens/userScreen/clienteShort/MisCitas';
import SolicitarCita from './screens/userScreen/clienteShort/SolicitarCita';
import DetalleCita from './screens/components/DetalleCita';
import ReprogramarCita from './screens/userScreen/clienteShort/ReprogramarCita';


const Stack = createNativeStackNavigator();

// --- 1. NAVEGADOR PARA EL FLUJO DE AUTENTICACIÓN ---
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

      {/* -- PANTALLA DEL PERFIL DEL VETERINARIO -- */}
      <Stack.Screen 
        name="Profile" 
        component={Profile} 
        options={{ 
          title: 'Mi Perfil',
          headerStyle: { backgroundColor: '#013847' }, 
          headerTintColor: '#fff',
        }} 
      />
      
      {/* -- PANTALLA DEL PERFIL DEL CLIENTE -- */}
      <Stack.Screen 
        name="ProfileCliente" 
        component={ProfileCliente} 
        options={{ 
          title: 'Mi Perfil',
          headerStyle: { backgroundColor: '#43C0AF' }, 
          headerTintColor: '#fff',
        }} 
      />
      <Stack.Screen 
        name="EditProfile" 
        component={EditProfile} 
        options={{ 
          title: 'Editar Perfil',
        }} 
      />
    </Stack.Navigator>
  );
}

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