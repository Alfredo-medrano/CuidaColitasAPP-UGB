// src/screens/Auth/Signin.js

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../api/Supabase.js';
import AuthLayout from '../../components/AuthLayout.js';
import { UnderlineInput, PrimaryButton, EyeToggle, LinkText } from '../../components/FormBits.js';
import { validateEmail, validateRequired } from '../../utils/validation.js';
import { COLORS, FONTS } from '../../theme/theme.js';

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
      const cleanEmail = email.trim();

      if (!validateRequired(cleanEmail) || !validateRequired(password)) {
        throw new Error('Por favor completa todos los campos.');
      }

      if (!validateEmail(cleanEmail)) {
        throw new Error('El formato del correo electrónico no es válido.');
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (loginError) {
        throw loginError;
      }

    } catch (err) {
      console.error('Error al iniciar sesión:', err.message);
      setError(err.message === 'Invalid login credentials'
        ? 'Email o contraseña incorrectos.'
        : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      activeTab="login"
      onTabChange={() => navigation.replace('SignUp', { prefillEmail: email.trim().toLowerCase() })}
      title="Bienvenido de nuevo"
    >
      {/* Input de Email con icono */}
      <UnderlineInput
        icon="mail-outline"
        placeholder="Correo electrónico"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      {/* Input de Contraseña con icono y toggle */}
      <View style={styles.passwordContainer}>
        <UnderlineInput
          icon="lock-closed-outline"
          placeholder="Contraseña"
          secureTextEntry={!show}
          value={password}
          onChangeText={setPassword}
          style={{ paddingRight: 44 }}
        />
        <EyeToggle shown={show} onToggle={() => setShow(s => !s)} />
      </View>

      {/* Mensaje de error */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={18} color={COLORS.red} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Botón de iniciar sesión */}
      <PrimaryButton
        title="INICIAR SESIÓN"
        onPress={onSignIn}
        loading={loading}
        disabled={loading}
        icon="log-in-outline"
      />

      {/* Link para recuperar contraseña */}
      <View style={styles.forgotContainer}>
        <LinkText
          onPress={() => navigation.navigate('ForgotPassword', { prefillEmail: email.trim().toLowerCase() })}
        >
          ¿Olvidaste tu contraseña?
        </LinkText>
      </View>

      {/* Separador decorativo */}
      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Ionicons name="paw" size={16} color={COLORS.secondary} style={{ marginHorizontal: 12 }} />
        <View style={styles.dividerLine} />
      </View>

      {/* Texto informativo */}
      <Text style={styles.infoText}>
        Al iniciar sesión, aceptas nuestros términos y condiciones de servicio.
      </Text>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  passwordContainer: {
    position: 'relative',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.red + '15',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    color: COLORS.red,
    marginLeft: 8,
    flex: 1,
    fontFamily: FONTS.PoppinsRegular,
    fontSize: 13,
  },
  forgotContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.secondary + '50',
  },
  infoText: {
    textAlign: 'center',
    fontFamily: FONTS.PoppinsRegular,
    fontSize: 11,
    color: COLORS.primary + '60',
    lineHeight: 16,
  },
});