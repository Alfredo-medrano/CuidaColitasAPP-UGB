import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../theme/theme';

// Función para tamaños responsivos
const { width } = Dimensions.get('window');
const guidelineBaseWidth = 375;
const responsiveSize = (size) => (width / guidelineBaseWidth) * size;

const HomeHeader = ({ userName, avatarUrl, onNotificationPress, onProfilePress, notificationCount }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onProfilePress} style={styles.userInfo}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={responsiveSize(24)} color={COLORS.primary} />
          </View>
        )}
        <View style={styles.textContainer}>
          <Text style={styles.greeting} numberOfLines={1}>Hola, {userName}</Text>
          <Text style={styles.welcome} numberOfLines={1}>Bienvenido a CuidaColitas</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={onNotificationPress} style={styles.notificationButton}>
        <Ionicons name="notifications-outline" size={responsiveSize(28)} color={COLORS.textPrimary} />
        {notificationCount > 0 && (
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationCount}>{notificationCount > 99 ? '99+' : notificationCount}</Text>
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
    paddingHorizontal: responsiveSize(20),
    paddingVertical: responsiveSize(10),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: responsiveSize(10),
  },
  avatar: {
    width: responsiveSize(48),
    height: responsiveSize(48),
    borderRadius: responsiveSize(24),
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: responsiveSize(12),
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: responsiveSize(18),
    color: COLORS.textPrimary,
  },
  welcome: {
    fontFamily: FONTS.PoppinsRegular,
    fontSize: responsiveSize(13),
    color: COLORS.secondary,
  },
  notificationButton: {
    position: 'relative',
    padding: responsiveSize(8),
  },
  notificationBadge: {
    position: 'absolute',
    top: responsiveSize(4),
    right: responsiveSize(4),
    backgroundColor: COLORS.alert,
    borderRadius: responsiveSize(10),
    minWidth: responsiveSize(20),
    height: responsiveSize(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: responsiveSize(4),
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  notificationCount: {
    color: COLORS.white,
    fontFamily: FONTS.PoppinsBold,
    fontSize: responsiveSize(10),
  },
});

export default HomeHeader;