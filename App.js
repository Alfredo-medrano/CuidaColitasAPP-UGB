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
      
      {/* // <-- ¡AQUÍ ESTÁ LA LÍNEA QUE FALTABA! */}
      <Stack.Screen 
        name="Profile" 
        component={Profile} 
        options={{ 
          title: 'Mi Perfil',
          headerStyle: { backgroundColor: '#013847' }, // Color de fondo del header
          headerTintColor: '#fff', // Color del texto y flecha de regreso
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

// --- COMPONENTE PRINCIPAL DE LA APP ---
export default function App() {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Revisa la sesión al iniciar la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // Escucha los cambios de sesión (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    // Limpia el listener al desmontar el componente
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
      {/* Muestra el stack de Autenticación o el de la App según el estado de la sesión */}
      {session && session.user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}