import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS } from '../theme/theme';

const { width } = Dimensions.get('window');

/**
 * AuthLayout - Layout moderno para pantallas de autenticación
 * Usa colores de la app e iconos de veterinaria
 */
export default function AuthLayout({ activeTab, onTabChange, title, children }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header con icono de huellita */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="paw" size={60} color={COLORS.white} />
            </View>
            <Text style={styles.brandName}>CuidaColitas</Text>
            <Text style={styles.brandTagline}>Tu mascota, nuestra prioridad</Text>
          </View>

          {/* Card principal */}
          <View style={styles.card}>
            {/* Tabs de Login/Signup */}
            <View style={styles.tabs}>
              <Pressable
                onPress={() => onTabChange('login')}
                style={[styles.tabBtn, activeTab === 'login' && styles.tabBtnActive]}
              >
                <Ionicons
                  name="log-in-outline"
                  size={18}
                  color={activeTab === 'login' ? COLORS.white : COLORS.primary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.tabTxt, activeTab === 'login' && styles.tabTxtActive]}>
                  INICIAR
                </Text>
              </Pressable>
              <Pressable
                onPress={() => onTabChange('signup')}
                style={[styles.tabBtn, activeTab === 'signup' && styles.tabBtnActive]}
              >
                <Ionicons
                  name="person-add-outline"
                  size={18}
                  color={activeTab === 'signup' ? COLORS.white : COLORS.primary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.tabTxt, activeTab === 'signup' && styles.tabTxtActive]}>
                  REGISTRO
                </Text>
              </Pressable>
            </View>

            {/* Título */}
            <Text style={styles.title}>{title}</Text>

            {/* Contenido del formulario */}
            <View style={styles.formContent}>
              {children}
            </View>
          </View>

          {/* Footer decorativo */}
          <View style={styles.footer}>
            <View style={styles.footerIcons}>
              <Ionicons name="heart" size={14} color={COLORS.accent} />
              <Ionicons name="paw" size={12} color={COLORS.secondary} style={{ marginHorizontal: 8 }} />
              <Ionicons name="heart" size={14} color={COLORS.accent} />
            </View>
            <Text style={styles.footerText}>Clínica Veterinaria</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 20,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 25,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    // Sombra sutil
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  brandName: {
    fontFamily: FONTS.PoppinsBold,
    fontSize: 32,
    color: COLORS.white,
    letterSpacing: 1,
  },
  brandTagline: {
    fontFamily: FONTS.PoppinsRegular,
    fontSize: 14,
    color: COLORS.secondary,
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    // Sombra elegante
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.secondary + '40',
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: COLORS.accent,
    // Sombra del tab activo
    shadowColor: COLORS.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  tabTxt: {
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: 13,
    color: COLORS.primary,
  },
  tabTxtActive: {
    color: COLORS.white,
  },

  // Title
  title: {
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: 18,
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 20,
  },

  // Form content
  formContent: {
    // Espacio para los inputs
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 30,
    paddingBottom: 20,
  },
  footerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  footerText: {
    fontFamily: FONTS.PoppinsRegular,
    fontSize: 12,
    color: COLORS.secondary,
    opacity: 0.8,
  },
});
