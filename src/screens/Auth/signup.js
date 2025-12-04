// src/screens/Auth/signup.js

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../api/Supabase.js';
import AuthLayout from '../../components/AuthLayout.js';
import { UnderlineInput, PrimaryButton, EyeToggle, LinkText } from '../../components/FormBits.js';
import { validateEmail, validateRequired, getPasswordError, sanitizeInput } from '../../utils/validation.js';
import { COLORS, FONTS } from '../../theme/theme.js';

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
  const [success, setSuccess] = useState(false);

  const onSignUp = async () => {
    setError('');
    setSuccess(false);

    const emailNorm = normalize(email);
    const nameClean = sanitizeInput(name);

    if (!validateRequired(nameClean)) { setError('El nombre es obligatorio.'); return; }
    if (!validateEmail(emailNorm)) { setError('Correo inválido.'); return; }

    const passError = getPasswordError(password);
    if (passError) { setError(passError); return; }

    if (password !== confirm) { setError('Las contraseñas no coinciden.'); return; }

    setLoading(true);
    try {
      // Verificar si el registro está permitido
      const { data: setting, error: settingError } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'allow_registrations')
        .single();

      if (!settingError && setting && setting.value === false) {
        throw new Error('El registro de nuevos usuarios está deshabilitado temporalmente.');
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: emailNorm,
        password,
      });

      if (signUpError) throw signUpError;
      if (!authData.user) throw new Error("No se pudo crear el usuario.");

      // Busca el rol 'cliente'
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'cliente')
        .single();

      if (roleError || !roleData) throw new Error("Error al obtener el rol de cliente.");

      // Inserta el perfil
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          name: nameClean,
          role_id: roleData.id,
        });

      if (insertError) throw insertError;

      setSuccess(true);

    } catch (err) {
      console.error('Error en registro:', err);
      const msg = (err.message || '').toLowerCase();
      if (msg.includes("already registered")) {
        setError('Ese correo ya está registrado. Inicia sesión.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      activeTab="signup"
      onTabChange={(t) => navigation.replace(t === 'login' ? 'SignIn' : 'SignUp', { prefillEmail: normalize(email) })}
      title="Crea tu cuenta"
    >
      {/* Mensaje de éxito */}
      {success ? (
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={48} color={COLORS.accent} />
          </View>
          <Text style={styles.successTitle}>¡Registro exitoso!</Text>
          <Text style={styles.successText}>
            Te enviamos un correo para confirmar tu cuenta. Revisa tu bandeja de entrada.
          </Text>
          <LinkText
            onPress={() => navigation.replace('SignIn')}
            style={{ marginTop: 20 }}
          >
            Ir a Iniciar Sesión
          </LinkText>
        </View>
      ) : (
        <>
          {/* Input de Nombre */}
          <UnderlineInput
            icon="person-outline"
            placeholder="Nombre completo"
            value={name}
            onChangeText={setName}
          />

          {/* Input de Email */}
          <UnderlineInput
            icon="mail-outline"
            placeholder="Correo electrónico"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          {/* Input de Contraseña */}
          <View style={styles.passwordContainer}>
            <UnderlineInput
              icon="lock-closed-outline"
              placeholder="Crear contraseña"
              secureTextEntry={!show1}
              value={password}
              onChangeText={setPassword}
              style={{ paddingRight: 44 }}
            />
            <EyeToggle shown={show1} onToggle={() => setShow1(s => !s)} />
          </View>

          {/* Input de Confirmar Contraseña */}
          <View style={styles.passwordContainer}>
            <UnderlineInput
              icon="shield-checkmark-outline"
              placeholder="Confirmar contraseña"
              secureTextEntry={!show2}
              value={confirm}
              onChangeText={setConfirm}
              style={{ paddingRight: 44 }}
            />
            <EyeToggle shown={show2} onToggle={() => setShow2(s => !s)} />
          </View>

          {/* Mensaje de error */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={18} color={COLORS.red} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Requisitos de contraseña */}
          <View style={styles.passwordHints}>
            <Text style={styles.hintTitle}>La contraseña debe tener:</Text>
            <View style={styles.hintRow}>
              <Ionicons
                name={password.length >= 8 ? "checkmark-circle" : "ellipse-outline"}
                size={14}
                color={password.length >= 8 ? COLORS.accent : COLORS.primary + '40'}
              />
              <Text style={[styles.hintText, password.length >= 8 && styles.hintValid]}>
                Mínimo 8 caracteres
              </Text>
            </View>
            <View style={styles.hintRow}>
              <Ionicons
                name={/[A-Z]/.test(password) ? "checkmark-circle" : "ellipse-outline"}
                size={14}
                color={/[A-Z]/.test(password) ? COLORS.accent : COLORS.primary + '40'}
              />
              <Text style={[styles.hintText, /[A-Z]/.test(password) && styles.hintValid]}>
                Una mayúscula
              </Text>
            </View>
            <View style={styles.hintRow}>
              <Ionicons
                name={/[0-9]/.test(password) ? "checkmark-circle" : "ellipse-outline"}
                size={14}
                color={/[0-9]/.test(password) ? COLORS.accent : COLORS.primary + '40'}
              />
              <Text style={[styles.hintText, /[0-9]/.test(password) && styles.hintValid]}>
                Un número
              </Text>
            </View>
          </View>

          {/* Botón de registro */}
          <PrimaryButton
            title="CREAR CUENTA"
            onPress={onSignUp}
            loading={loading}
            disabled={loading}
            icon="person-add-outline"
          />

          {/* Link para ir a login */}
          <View style={styles.loginLink}>
            <Text style={styles.loginLinkText}>¿Ya tienes cuenta? </Text>
            <LinkText onPress={() => navigation.replace('SignIn', { prefillEmail: email.trim().toLowerCase() })}>
              Inicia sesión
            </LinkText>
          </View>
        </>
      )}
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
  passwordHints: {
    backgroundColor: COLORS.secondary + '20',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  hintTitle: {
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: 12,
    color: COLORS.primary,
    marginBottom: 6,
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  hintText: {
    fontFamily: FONTS.PoppinsRegular,
    fontSize: 12,
    color: COLORS.primary + '60',
    marginLeft: 8,
  },
  hintValid: {
    color: COLORS.accent,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginLinkText: {
    fontFamily: FONTS.PoppinsRegular,
    fontSize: 14,
    color: COLORS.primary + '80',
  },
  // Success state
  successContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontFamily: FONTS.PoppinsBold,
    fontSize: 20,
    color: COLORS.accent,
    marginBottom: 8,
  },
  successText: {
    fontFamily: FONTS.PoppinsRegular,
    fontSize: 14,
    color: COLORS.primary + '80',
    textAlign: 'center',
    lineHeight: 20,
  },
});