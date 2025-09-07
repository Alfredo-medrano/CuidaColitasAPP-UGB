import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { supabase } from '../../Supabase.js';
import AuthLayout from '../components/AuthLayout.js';
import { UnderlineInput, PrimaryButton, EyeToggle } from '../components/FormBits.js';

// --- Funciones de validación ---
const emailOk = (e) => /\S+@\S+\.\S+/.test(e);
const passStrong = (p) => /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d).{8,}$/.test(p);
const normalize = (s) => String(s || '').trim().toLowerCase();

export default function SignUp({ navigation, route }) {
  const prefillEmail = route?.params?.prefillEmail || '';
  const [email, setEmail] = useState(prefillEmail);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

   const onSignUp = async () => {
    setError('');
    setInfo('');

    const emailNorm = normalize(email);
    if (!emailOk(emailNorm)) { setError('Correo inválido.'); return; }
    if (!name) { setError('El nombre es obligatorio.'); return; }
    if (!passStrong(password)) { setError('Contraseña débil...'); return; }
    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }

    setLoading(true);
    try {
      // 1. Crear el usuario en Supabase Auth.
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: emailNorm,
        password,
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("No se pudo crear el usuario en el sistema de autenticación.");

      // 2. Buscar el UUID del rol 'cliente'.
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'veterinario')
        .single();
      
      if (roleError || !roleData) throw new Error("No se encontró el rol de cliente en la base de datos.");

      // 3. Insertar en la tabla 'profiles'
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: name, // <-- CORRECCIÓN: De 'full_name' a 'name' para que coincida con la BD
          role_id: roleData.id,
        });

      if (insertError) throw insertError;

      setInfo('Te enviamos un correo para confirmar tu cuenta.');

    } catch (err) {
      console.error('--- ERROR DETALLADO DE SUPABASE EN SIGNUP ---', err);
      const msg = (err.message || '').toLowerCase();
      if (msg.includes("already registered")) {
        setError('Ese correo ya está registrado. Inicia sesión.');
      } else {
        setError(err.message || 'Ocurrió un error inesperado.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      activeTab="signup"
      onTabChange={(t) => navigation.replace(t === 'login' ? 'SignIn' : 'SignUp', { prefillEmail: normalize(email) })}
      title="Welcome to CuidaColitas"
    >
       <UnderlineInput
        placeholder="Nombre Completo"
        value={name}
        onChangeText={setName}
      />
      <UnderlineInput
        placeholder="E-mail"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <View style={{ position: 'relative' }}>
        <UnderlineInput
          placeholder="Crear Contraseña"
          secureTextEntry={!show1}
          value={password}
          onChangeText={setPassword}
          style={{ paddingRight: 44 }}
        />
        <EyeToggle shown={show1} onToggle={() => setShow1(s => !s)} />
      </View>
      <View style={{ position: 'relative' }}>
        <UnderlineInput
          placeholder="Confirmar Contraseña"
          secureTextEntry={!show2}
          value={confirm}
          onChangeText={setConfirm}
          style={{ paddingRight: 44, marginBottom: 6 }}
        />
        <EyeToggle shown={show2} onToggle={() => setShow2(s => !s)} />
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {info ? <Text style={styles.infoText}>{info}</Text> : null}

      <PrimaryButton title={loading ? '...' : 'REGISTRARSE'} onPress={onSignUp} disabled={loading} />
      <Text
        onPress={() => navigation.replace('SignIn', { prefillEmail: email.trim().toLowerCase() })}
        style={styles.switchText}
      >
        ¿Ya tienes cuenta? Inicia sesión
      </Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  errorText: { color: 'red', textAlign: 'center', marginBottom: 6 },
  infoText: { color: 'green', textAlign: 'center', marginBottom: 6 },
  switchText: { textAlign: 'center', marginTop: 10, color: '#013847' },
});