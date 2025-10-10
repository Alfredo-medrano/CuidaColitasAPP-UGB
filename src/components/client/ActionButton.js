import React from 'react';
import { Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../theme/theme';

const ActionButton = ({ icon, label, onPress }) => {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <Ionicons name={icon} size={SIZES.h1} color={COLORS.textPrimary} />
      <Text style={styles.actionButtonLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  actionButton: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    aspectRatio: 1,
  },
  actionButtonLabel: {
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    marginTop: 8,
    textAlign: 'center'
  },
});

export default ActionButton;