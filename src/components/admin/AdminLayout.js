import React from 'react';
import {
  View, Text, StyleSheet, StatusBar, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import { responsiveSize } from '../../utils/helpers';

/**
 * AdminLayout
 * Layout principal para admin con colores consistentes del tema.
 * NO usa ScrollView para permitir que FlatList funcione correctamente en las pantallas hijas.
 */
export default function AdminLayout({ navigation, children, showProfileButton = true }) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Header Fijo */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.headerLogo}>
              <MaterialCommunityIcons name="shield-account" size={responsiveSize(20)} color={COLORS.white} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Panel Admin</Text>
              <Text style={styles.headerSubtitle}>CuidaColitas</Text>
            </View>
          </View>

          {showProfileButton && (
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate('AdminProfile')}
            >
              <MaterialCommunityIcons name="account-circle-outline" size={responsiveSize(24)} color={COLORS.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contenido Flexible (Ocupa el resto de la pantalla) */}
      <View style={styles.content}>
        {children}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: responsiveSize(16),
    paddingVertical: responsiveSize(12),
    paddingTop: responsiveSize(8),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: responsiveSize(12),
  },
  headerLogo: {
    width: responsiveSize(40),
    height: responsiveSize(40),
    borderRadius: responsiveSize(10),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.accent,
  },
  headerTitle: {
    fontSize: SIZES.h3,
    color: COLORS.white,
    fontFamily: FONTS.PoppinsBold,
  },
  headerSubtitle: {
    fontSize: SIZES.caption,
    color: COLORS.textPrimary,
    fontFamily: FONTS.PoppinsRegular,
    opacity: 0.9,
  },
  profileButton: {
    width: responsiveSize(44),
    height: responsiveSize(44),
    borderRadius: responsiveSize(22),
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingHorizontal: responsiveSize(16),
    paddingTop: responsiveSize(16),
  },
});
