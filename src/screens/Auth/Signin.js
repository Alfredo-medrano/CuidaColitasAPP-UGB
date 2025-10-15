// src/screens/Auth/Signin.js

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../../api/Supabase.js';
import AuthLayout from '../../components/AuthLayout.js';
import { UnderlineInput, PrimaryButton, EyeToggle } from '../../components/FormBits.js';

export default function SignIn({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Esta es la función que se ejecuta al presionar "LOG IN"
  const onSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      // Intenta iniciar sesión con el email y la contraseña
      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(), // Usamos trim() para limpiar espacios en blanco
        password,
      });

      // Si Supabase devuelve un error, lo mostramos
      if (loginError) {
        throw loginError;
      }
      
      // Si el inicio de sesión es exitoso, nuestro AuthContext
      // se encargará del resto automáticamente. No necesitamos hacer más nada aquí.

    } catch (err) {
      // Muestra un mensaje de error amigable al usuario
      console.error('Error al iniciar sesión:', err.message);
      setError('Email o contraseña incorrectos. Intenta de nuevo.');
    } finally {
      // Pase lo que pase, dejamos de mostrar el indicador de carga
      setLoading(false);
    }
  };

  // Esta es la parte visual de la pantalla (la UI)
  return (
    <AuthLayout
      activeTab="login"
      onTabChange={() => navigation.replace('SignUp', { prefillEmail: email.trim().toLowerCase() })}
      title="Welcome to CuidaColitas"
    >
      <UnderlineInput
        placeholder="E-mail"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <View style={{ position: 'relative' }}>
        <UnderlineInput
          placeholder="Password"
          secureTextEntry={!show}
          value={password}
          onChangeText={setPassword}
          style={{ paddingRight: 44, marginBottom: 6 }}
        />
        <EyeToggle shown={show} onToggle={() => setShow(s => !s)} />
      </View>

      {/* Muestra el mensaje de error si existe */}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Botón principal para iniciar sesión */}
      <PrimaryButton title={loading ? 'Ingresando...' : 'LOG IN'} onPress={onSignIn} disabled={loading} />

      {/* Texto para ir a la pantalla de recuperar contraseña */}
      <Text
        onPress={() => navigation.navigate('ForgotPassword', { prefillEmail: email.trim().toLowerCase() })}
        style={styles.switchText}
      >
        Forgot Password?
      </Text>
    </AuthLayout>
  );
}

// Estos son los estilos para los componentes de la pantalla
const styles = StyleSheet.create({
  errorText: { color: 'red', textAlign: 'center', marginBottom: 10, marginTop: 5 },
  switchText: { textAlign: 'center', marginTop: 15, color: '#013847', fontWeight: '500' },
});