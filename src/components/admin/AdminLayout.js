import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, FONTS, SIZES } from '../../theme/theme';

/**
 * AdminLayout
 * Componente de layout reutilizable para las pantallas de administración
 */
const QuickActionButton = ({ icon, text, onPress }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <MaterialCommunityIcons name={icon} size={24} color={COLORS.primary} />
    <Text style={styles.actionButtonText}>{text}</Text>
  </TouchableOpacity>
);

export default function AdminLayout({ navigation, children }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerLogo}>
            <MaterialCommunityIcons name="stethoscope" size={20} color={COLORS.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>VetAdmin Pro</Text>
            <Text style={styles.headerSubtitle}>Panel de Administración</Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate('AdminProfile')}
          >
            <MaterialCommunityIcons name="account-circle-outline" size={28} color={COLORS.white} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.contentInner}>{children}</View>
      </View>

      <View style={styles.footer}>
        <View style={styles.actionButtonsContainer}>
          <QuickActionButton
            icon="stethoscope"
            text="Vets"
            onPress={() => navigation.navigate('Vets')}
          />
          <QuickActionButton
            icon="account-group-outline"
            text="Clientes"
            onPress={() => navigation.navigate('Clients')}
          />
          <QuickActionButton
            icon="chart-line"
            text="Stats"
            onPress={() => navigation.navigate('Stats')}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ---------- Estilos clonados de tu Home ---------- */
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.primary },

  header: {
    backgroundColor: COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 10,
    elevation: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 1,
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 20,
    paddingBottom: 10,
    
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerLogo: {
    width: 40, height: 40, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.accent, marginRight: 6,
  },
  headerTitle: {
    fontSize: SIZES.h1, color: COLORS.white, fontFamily: FONTS.PoppinsBold,
  },
  headerSubtitle: {
    fontSize: SIZES.caption, color: COLORS.textPrimary,
    fontFamily: FONTS.PoppinsRegular, marginTop: -2, opacity: 0.95,
  },
 profileButton: {
  width: 56,
  height: 56,
  borderRadius: 28,
  backgroundColor: 'rgba(255,255,255,0.15)',
  justifyContent: 'center',
  alignItems: 'center',
  marginLeft: 'auto',
},

  content: { flex: 1, backgroundColor: COLORS.primary, },
  contentInner: { padding: 12, paddingBottom: 100 }, // <- deja espacio al footer

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.white,
    paddingTop: 8, paddingBottom: 25,
    borderTopLeftRadius: 16, borderTopRightRadius: 16,
    borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)',
    elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1, shadowRadius: 4,
  },
  actionButtonsContainer: {
    flexDirection: 'row', justifyContent: 'space-around',
    alignItems: 'flex-start', paddingHorizontal: 10,
  },
  actionButton: {
    alignItems: 'center', padding: 8, borderRadius: 8, flex: 1, minHeight: 55,
  },
  actionButtonText: {
    fontFamily: FONTS.PoppinsRegular, fontSize: 11, color: COLORS.black, marginTop: 4,
  },
});
