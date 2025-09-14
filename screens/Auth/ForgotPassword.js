import React from 'react';
import { Text } from 'react-native';
import { supabase } from '../../Supabase';
import AuthLayout from '../components/AuthLayout';
import { UnderlineInput, PrimaryButton } from '../components/FormBits.js';

export default function ForgotPassword({ navigation, route }) {
  const prefillEmail = route?.params?.prefillEmail || '';
  const [email, setEmail] = React.useState(prefillEmail);
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [err, setErr] = React.useState('');

  const send = async () => {
    setMsg('');
    setErr('');
    const e = email.trim().toLowerCase();
    if (!e) {
      setErr('Escribe tu correo.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(e);
      if (error) {
        throw error;
      }
      navigation.navigate('ResetPassword', { email: e });

    } catch (error) {
      setErr('No se pudo enviar el correo. Revisa la dirección e intenta de nuevo.');
      console.error('Error al enviar correo de recuperación:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      activeTab="login"
      onTabChange={(t) => navigation.replace(t === 'login' ? 'SignIn' : 'SignUp', { prefillEmail: email.trim().toLowerCase() })}
      title="Reset your password"
    >
      <UnderlineInput
        placeholder="E-mail"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      {err ? <Text style={{ color: 'red', textAlign: 'center', marginBottom: 6 }}>{err}</Text> : null}
      {msg ? <Text style={{ color: 'green', textAlign: 'center', marginBottom: 6 }}>{msg}</Text> : null}
      <PrimaryButton title={loading ? '...' : 'ENVIAR CÓDIGO'} onPress={send} disabled={loading} />
      <Text
        onPress={() => navigation.replace('SignIn', { prefillEmail: email.trim().toLowerCase() })}
        style={{ textAlign: 'center', marginTop: 10, color: '#013847' }}
      >
        Volver a Login
      </Text>
    </AuthLayout>
  );
}