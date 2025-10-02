import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../theme/theme';

export const InfoRow = ({ icon, text }) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={20} color={COLORS.primary} style={{ marginRight: 15 }} />
    <Text style={styles.infoText}>{text || 'No especificado'}</Text>
  </View>
);

const InfoCard = ({ title, children }) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    {children}
  </View>
);
// Los estilos completos se encuentran en el archivo principal a continuación.
export default InfoCard;