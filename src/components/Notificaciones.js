import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import moment from 'moment';
import 'moment/locale/es';
import { COLORS, FONTS, SIZES } from '../theme/theme';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications } from '../hooks/useNotifications';

moment.locale('es');

const NotificationItem = ({ item }) => (
  <View style={styles.notificationCard}>
    <View style={styles.iconContainer}>
      <Ionicons name="notifications-outline" size={24} color={COLORS.primary} />
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.content}>{item.content}</Text>
      <Text style={styles.time}>{moment(item.created_at).fromNow()}</Text>
    </View>
    {!item.is_read && <View style={styles.unreadIndicator} />}
  </View>
);

export default function Notificaciones() {
  const isFocused = useIsFocused();
  const { allNotifications, loading, refresh, markAllAsRead } = useNotifications();

  useEffect(() => {
    if (isFocused) {
      markAllAsRead();
    }
  }, [isFocused, markAllAsRead]);

  if (loading && (!allNotifications || allNotifications.length === 0)) {
    return (
      <View style={styles.centeredLoader}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  
  if (!loading && (!allNotifications || allNotifications.length === 0)) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="notifications-off-outline" size={50} color={COLORS.secondary} />
        <Text style={styles.emptyText}>No tienes notificaciones</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <FlatList
        data={allNotifications}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <NotificationItem item={item} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} tintColor={COLORS.primary} />
        }
      />
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  centeredLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loader: { marginTop: 50 },
  listContent: { padding: 16 },
  notificationCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  iconContainer: { backgroundColor: '#E9ECEF', borderRadius: 25, width: 50, height: 50, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textContainer: { flex: 1 },
  title: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.body, color: COLORS.textPrimary },
  content: { fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.caption, color: COLORS.secondary, marginTop: 2 },
  time: { fontFamily: FONTS.PoppinsRegular, fontSize: 12, color: COLORS.secondary, marginTop: 6 },
  unreadIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORS.accent, marginLeft: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyText: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.h3, color: COLORS.secondary, marginTop: 16, textAlign: 'center' },
});