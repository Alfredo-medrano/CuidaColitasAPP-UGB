import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, FlatList, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SIZES } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../hooks/useNotifications';
import HomeHeader from '../../components/client/HomeHeader';
import NotificationCard from '../../components/client/NotificationCard';
import ActionButton from '../../components/client/ActionButton';

const quickActions = [
  { id: '1', icon: 'paw-outline', label: 'Mis Mascotas', screen: 'MisMascotas' },
  { id: '2', icon: 'calendar-outline', label: 'Mis Citas', screen: 'MisCitas' },
  { id: '3', icon: 'chatbubble-ellipses-outline', label: 'Chat', screen: 'Mensajes' },
  { id: '4', icon: 'add-circle-outline', label: 'Pedir Cita', screen: 'SolicitarCita' },
];

export default function ClienteHome({ navigation }) {
  const isFocused = useIsFocused();
  const { profile } = useAuth();
  const { unreadNotifications, unreadCount, loading, refresh } = useNotifications();

  useEffect(() => {
    if (isFocused) {
      refresh();
    }
  }, [isFocused, refresh]);

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
          
          {unreadNotifications && unreadNotifications.length > 0 ? (
            <FlatList
              data={unreadNotifications}
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

// Estilos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.primary },
  centeredLoader: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary },
  scrollContent: { padding: 20, paddingTop: 10 },
  section: { marginTop: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontFamily: FONTS.PoppinsSemiBold, fontSize: SIZES.h3, color: COLORS.textPrimary },
  seeAll: { fontFamily: FONTS.PoppinsRegular, fontSize: SIZES.body, color: COLORS.accent },
  emptyContainer: { backgroundColor: COLORS.card, borderRadius: 12, padding: 20, alignItems: 'center' },
  emptyText: { fontFamily: FONTS.PoppinsRegular, color: COLORS.secondary, marginTop: 8 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});