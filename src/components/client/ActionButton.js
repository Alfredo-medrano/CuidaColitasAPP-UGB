import React from 'react';
import { Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../theme/theme';

// Función para tamaños responsivos
const { width } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const responsiveSize = (size) => (width / guidelineBaseWidth) * size;

const ActionButton = ({ icon, label, onPress }) => {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <Ionicons name={icon} size={responsiveSize(36)} color={COLORS.textPrimary} />
      <Text style={styles.actionButtonLabel} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: responsiveSize(12),
    padding: responsiveSize(20),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: responsiveSize(12),
    aspectRatio: 1,
    minHeight: responsiveSize(120),
  },
  actionButtonLabel: {
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: responsiveSize(14),
    color: COLORS.textPrimary,
    marginTop: responsiveSize(8),
    textAlign: 'center',
  },
});

export default ActionButton;