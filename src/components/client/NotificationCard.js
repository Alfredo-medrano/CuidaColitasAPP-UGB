// src/components/client/NotificationCard.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import moment from 'moment';
import 'moment/locale/es';
moment.locale('es');

const iconMap = {
  vaccine_due: { name: 'medical-outline', color: '#721c24', bg: '#f8d7da' },
  appointment_reminder: { name: 'calendar-outline', color: COLORS.accent, bg: COLORS.lightBlue },
  results_ready: { name: 'document-text-outline', color: '#155724', bg: '#d4edda' },
  default: { name: 'notifications-outline', color: '#333', bg: '#e0e0e0' }
};

const NotificationCard = ({ notification }) => {
  const { type, title, content, created_at, is_read } = notification;
  const iconInfo = iconMap[type] || iconMap.default;

  return (
    <TouchableOpacity style={styles.notificationCard}>
      <View style={[styles.notificationIcon, { backgroundColor: iconInfo.bg }]}>
        <Ionicons name={iconInfo.name} size={22} color={iconInfo.color} />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{title}</Text>
        <Text style={styles.notificationText}>{content}</Text>
        <Text style={styles.notificationTime}>{moment(created_at).fromNow()}</Text>
      </View>
      {!is_read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  notificationCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  notificationText: {
    fontFamily: FONTS.PoppinsRegular,
    fontSize: SIZES.body,
    color: COLORS.secondary,
    marginTop: 2,
  },
  notificationTime: {
    fontFamily: FONTS.PoppinsRegular,
    fontSize: SIZES.caption,
    color: COLORS.secondary,
    marginTop: 4,
    opacity: 0.8,
  },
  unreadIndicator: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: COLORS.accent,
      marginLeft: 10,
  },
});

export default NotificationCard;