import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, ActivityIndicator, FlatList, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { supabase } from '../../api/Supabase';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment';
import 'moment/locale/es';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import HomeHeader from '../../components/client/HomeHeader';
import NotificationCard from '../../components/client/NotificationCard';
import ActionButton from '../../components/client/ActionButton';

moment.locale('es');

const quickActions = [
  { id: '1', icon: 'paw-outline', label: 'Mis Mascotas', screen: 'MisMascotas' },
  { id: '2', icon: 'calendar-outline', label: 'Mis Citas', screen: 'MisCitas' },
  { id: '3', icon: 'chatbubble-ellipses-outline', label: 'Chat', screen: 'Mensajes' },
  { id: '4', icon: 'add-circle-outline', label: 'Pedir Cita', screen: 'SolicitarCita' },
];

export default function ClienteHome({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const isFocused = useIsFocused();

  const fetchScreenData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuario no autenticado.');

      const [profileResponse, notificationsResponse, unreadCountResponse] = await Promise.all([
        supabase.from('profiles').select(`name, avatar_url`).eq('id', user.id).single(),
        supabase.from('notifications').select(`*`).eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false)
      ]);

      if (profileResponse.error) throw profileResponse.error;
      if (notificationsResponse.error) throw notificationsResponse.error;
      if (unreadCountResponse.error) throw unreadCountResponse.error;

      setProfile(profileResponse.data);
      setNotifications(notificationsResponse.data || []);
      setUnreadCount(unreadCountResponse.count || 0);

    } catch (error) {
      Alert.alert("Error", `No se pudieron cargar los datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      setLoading(true); 
      fetchScreenData();
    }
  }, [isFocused, fetchScreenData]);

  if (loading) {
    return (
      <View style={styles.centeredLoader}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      <HomeHeader
        userName={profile?.name?.split(' ')[0] || 'Cliente'}
        avatarUrl={profile?.avatar_url}
        notificationCount={unreadCount}
        onProfilePress={() => navigation.navigate('ProfileCliente')}
        onNotificationPress={() => navigation.navigate('Notificaciones')}
      />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Notificaciones Importantes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Notificaciones')}>
              <Text style={styles.seeAll}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          {notifications.length > 0 ? (
            <FlatList
              data={notifications}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => <NotificationCard notification={item} />}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
                <Ionicons name="notifications-off-outline" size={30} color={COLORS.secondary} />
                <Text style={styles.emptyText}>No tienes notificaciones pendientes.</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <ActionButton
                key={action.id}
                icon={action.icon}
                label={action.label}
                onPress={() => navigation.navigate(action.screen)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  centeredLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  section: {
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: FONTS.PoppinsSemiBold,
    fontSize: SIZES.h3,
    color: COLORS.textPrimary,
  },
  seeAll: {
    fontFamily: FONTS.PoppinsRegular,
    fontSize: SIZES.body,
    color: COLORS.accent,
  },
  emptyContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: FONTS.PoppinsRegular,
    color: COLORS.secondary,
    marginTop: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
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