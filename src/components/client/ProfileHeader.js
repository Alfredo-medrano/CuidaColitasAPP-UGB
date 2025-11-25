import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../theme/theme';

const ProfileHeader = ({ profile, onGoBack }) => (
  <View style={styles.headerContainer}>
    <TouchableOpacity onPress={onGoBack} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
    </TouchableOpacity>
    <View style={styles.profileIdentity}>
      {profile.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, { backgroundColor: COLORS.accent }]}>
          <Ionicons name="person-outline" size={40} color={COLORS.primary} />
        </View>
      )}
      <Text style={styles.profileName}>{profile.name || 'Nombre no disponible'}</Text>
      <Text style={styles.profileRole}>Cliente CuidaColitas</Text>
    </View>
    <View style={{ width: 24 }} />
  </View>
);

export default ProfileHeader;