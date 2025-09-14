import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../../Supabase.js';
import AuthLayout from '../components/AuthLayout.js';
import { UnderlineInput, PrimaryButton, EyeToggle } from '../components/FormBits.js';

export default function SignIn({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        throw loginError;
      }

      // Desestructuramos user de forma segura para evitar el error 'NONE'
      const user = data?.user;
      if (!user) {
        throw new Error("Usuario o contraseña incorrectos.");
      }
      
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`
          name,
          roles ( name )
        `)
        .eq('id', user.id)
        .single();

      if (profileError) {
        throw new Error("No se pudo obtener la información del perfil.");
      }
      
      const userRole = profileData?.roles?.name;

      if (userRole === 'veterinario' || userRole === 'cliente') {
        navigation.replace('Home');
      } else {
        throw new Error("Rol de usuario no reconocido.");
      }
    } catch (err) {
      console.error('--- ERROR DETALLADO DE SUPABASE EN SIGNIN ---', err);
      const authErrorMessages = {
        'invalid login credentials': 'Email o contraseña incorrectos.',
      };
      
      const errorMessage = err.message || 'Ocurrió un error inesperado.';
      setError(authErrorMessages[errorMessage.toLowerCase()] || errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      activeTab="login"
      onTabChange={(t) => navigation.replace(t === 'login' ? 'SignIn' : 'SignUp', { prefillEmail: email.trim().toLowerCase() })}
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

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <PrimaryButton title={loading ? '...' : 'LOG IN'} onPress={onSignIn} disabled={loading} />

      <Text
        onPress={() => navigation.navigate('ForgotPassword', { prefillEmail: email.trim().toLowerCase() })}
        style={styles.switchText}
      >
        Forgot Password?
      </Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  errorText: { color: 'red', textAlign: 'center', marginBottom: 6 },
  switchText: { textAlign: 'center', marginTop: 10, color: '#013847' },
});