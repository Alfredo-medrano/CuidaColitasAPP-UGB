// src/components/client/HomeHeader.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../theme/theme';

const HomeHeader = ({ userName, avatarUrl, onNotificationPress, onProfilePress, notificationCount }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onProfilePress} style={styles.userInfo}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={24} color={COLORS.primary} />
          </View>
        )}
        <View>
          <Text style={styles.greeting}>Hola, {userName}</Text>
          <Text style={styles.welcome}>Bienvenido a CuidaColitas</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={onNotificationPress} style={styles.notificationButton}>
        <Ionicons name="notifications-outline" size={28} color={COLORS.textPrimary} />
        {notificationCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>{notificationCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  greeting: {
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: SIZES.h3,
    color: COLORS.textPrimary,
  },
  welcome: {
    fontFamily: FONTS.PoppinsRegular,
    fontSize: SIZES.body,
    color: COLORS.secondary,
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.alert,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  notificationCount: {
      color: COLORS.white,
      fontFamily: FONTS.PoppinsBold,
      fontSize: 12,
  },
});

export default HomeHeader;