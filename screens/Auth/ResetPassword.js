import React from 'react';
import { View, Text } from 'react-native';
import { supabase } from '../../Supabase';
import AuthLayout from '../components/AuthLayout';
import { UnderlineInput, PrimaryButton, EyeToggle } from '../components/FormBits.js';

// Recibimos 'route' para acceder a los parámetros de navegación
export default function ResetPassword({ navigation, route }) {
  // Obtenemos el email que pasamos desde la pantalla anterior
  const { email } = route.params;

  const [token, setToken] = React.useState(''); // Nuevo estado para el código (OTP)
  const [p1, setP1] = React.useState('');
  const [p2, setP2] = React.useState('');
  const [show1, setShow1] = React.useState(false);
  const [show2, setShow2] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [msg, setMsg] = React.useState('');
  const [err, setErr] = React.useState('');

  const change = async () => {
    setMsg('');
    setErr('');
    if (!token) { setErr('Ingresa el código que recibiste.'); return; }
    if (!p1 || !p2) { setErr('Llena ambas contraseñas.'); return; }
    if (p1 !== p2) { setErr('Las contraseñas no coinciden.'); return; }
    
    try {
      setLoading(true);
      // PASO 1: Verificar el código (token)
      const { data, error: otpError } = await supabase.auth.verifyOtp({
        email: email,
        token: token,
        type: 'recovery', // Muy importante especificar el tipo
      });

      if (otpError) throw otpError;

      // PASO 2: Si el código fue válido, actualizar la contraseña
      const { error: updateError } = await supabase.auth.updateUser({ password: p1 });
      
      if (updateError) throw updateError;
      
      setMsg('Contraseña actualizada. Inicia sesión.');
      setTimeout(() => navigation.replace('SignIn'), 1500);
    } catch (e) {
      setErr('Código inválido o expirado.'); // Mensaje de error más específico
      console.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      activeTab="login"
      onTabChange={(t) =>
        navigation.replace(t === 'login' ? 'SignIn' : 'SignUp')
      }
      title="Create new password"
    >
      {/* Nuevo campo para el código */}
      <UnderlineInput
        placeholder="Código de verificación"
        keyboardType="number-pad"
        value={token}
        onChangeText={setToken}
      />

      <View style={{ position: 'relative' }}>
        <UnderlineInput
          placeholder="Nueva contraseña"
          secureTextEntry={!show1}
          value={p1}
          onChangeText={setP1}
          style={{ paddingRight: 44 }}
        />
        <EyeToggle shown={show1} onToggle={() => setShow1(s => !s)} />
      </View>

      <View style={{ position: 'relative' }}>
        <UnderlineInput
          placeholder="Repite contraseña"
          secureTextEntry={!show2}
          value={p2}
          onChangeText={setP2}
          style={{ paddingRight: 44, marginBottom: 6 }}
        />
        <EyeToggle shown={show2} onToggle={() => setShow2(s => !s)} />
      </View>

      {err ? <Text style={{ color: 'red', textAlign: 'center', marginBottom: 6 }}>{err}</Text> : null}
      {msg ? <Text style={{ color: 'green', textAlign: 'center', marginBottom: 6 }}>{msg}</Text> : null}

      <PrimaryButton
        title={loading ? '...' : 'ACTUALIZAR CONTRASEÑA'}
        onPress={change}
        disabled={loading}
      />
    </AuthLayout>
  );
}