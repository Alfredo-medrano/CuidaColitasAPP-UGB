import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { supabase } from '../../api/Supabase';
import Navbar from './../../components/Navbar';
import { useIsFocused } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Objeto para mapear tipos de notificación a íconos y colores.
const notificationStyles = {
  vaccine_due: { icon: 'syringe', color: '#f8d7da', iconColor: '#721c24' },
  new_appointment: { icon: 'calendar-plus', color: '#d1ecf1', iconColor: '#0c5460' },
  appointment_reminder: { icon: 'calendar-check', color: '#d1ecf1', iconColor: '#0c5460' },
  new_message: { icon: 'comment-dots', color: '#e2d9f3', iconColor: '#492c7c' },
  medical_checkup: { icon: 'heartbeat', color: '#fff3cd', iconColor: '#856404' },
  app_update: { icon: 'info-circle', color: '#d4d4d4', iconColor: '#383d41' },
};

export default function VeterinarioHome({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ appointments: 0, messages: 0 });
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  const fetchDashboardData = useCallback(async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Usuario no encontrado");

      const [
        profileRes,
        messagesRes,
        notificationsRes,
        unreadNotifRes,
        statusRes
      ] = await Promise.all([
        // CORRECCIÓN: Usamos 'full_name' para que coincida con la base de datos
        supabase.from('profiles').select(`name, title`).eq('id', authUser.id).single(),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', authUser.id).eq('is_read', false),
        supabase.from('notifications').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }).limit(3),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id).eq('is_read', false),
        supabase.from('appointment_status').select('id').eq('status', 'Programada').single()
      ]);

      if (profileRes.error) throw profileRes.error;
      setProfile(profileRes.data);

      const scheduledStatusId = statusRes.data?.id;
      let appointmentCount = 0;
      if (scheduledStatusId) {
        const { count, error } = await supabase
          .from('appointments')
          .select('*', { count: 'exact', head: true })
          .eq('vet_id', authUser.id)
          .eq('status_id', scheduledStatusId);
        if (error) throw error;
        appointmentCount = count;
      }
      
      setStats({ appointments: appointmentCount || 0, messages: messagesRes.count || 0 });
      setNotifications(notificationsRes.data || []);
      setUnreadNotifCount(unreadNotifRes.count || 0);

    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchDashboardData();
    }
    
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, 
        (payload) => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isFocused, fetchDashboardData]);

  const handleNotifications = () => {
    navigation.navigate('Notificaciones');
  };

  if (loading) {
    return (
      <View style={styles.appContainer}>
        <ActivityIndicator style={{flex: 1}} size="large" color="#013847" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.appContainer} edges={['top']}> 
      <Navbar 
        // CORRECCIÓN: Pasamos 'full_name' al Navbar
        userName={profile?.name || 'Cargando...'}
        userTitle={profile?.title || 'Veterinario'}
        onProfileClick={() => navigation.navigate('Profile')}
        onNotificationsClick={handleNotifications}
        notificationCount={unreadNotifCount}
      />
      
      <ScrollView>
        <View style={styles.content}>
            <View style={styles.statsContainer}>
              <View style={[styles.stat, styles.statYellow]}>
                <Icon name="clock" size={30} color="#fff" />
                <Text style={styles.statTitle}>{stats.appointments}</Text>
                <Text style={styles.statText}>Citas Pendientes</Text>
              </View>
              <View style={[styles.stat, styles.statPurple]}>
                <Icon name="comment-dots" size={30} color="#fff" />
                <Text style={styles.statTitle}>{stats.messages}</Text>
                <Text style={styles.statText}>Mensajes Nuevos</Text>
              </View>
            </View>

            <View style={styles.notificationsSection}>
              <Text style={styles.sectionTitle}>Actividad Reciente</Text>
              {notifications.length > 0 ? notifications.map(notification => {
                  // MEJORA: Hacemos que el ícono y color sean dinámicos
                  const styleInfo = notificationStyles[notification.type] || notificationStyles['app_update'];
                  return (
                    <View key={notification.id} style={styles.notificationCard}>
                      <View style={[styles.iconContainer, { backgroundColor: styleInfo.color }]}>
                          <Icon name={styleInfo.icon} size={20} color={styleInfo.iconColor} />
                      </View>
                      <View style={styles.notificationText}>
                        <Text style={styles.notificationMessage}>{notification.title}</Text>
                        <Text style={styles.notificationTime}>{notification.content}</Text>
                      </View>
                    </View>
                  );
                }) : (
                <View style={styles.notificationCard}>
                  <Text style={{color: '#666'}}>No hay notificaciones recientes.</Text>
                </View>
              )}
            </View>

            <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
            <View style={styles.quickActions}>
              <Pressable style={[styles.quickActionCard, styles.quickActionGreen]} onPress={() => navigation.navigate('MisPacientes')}>
                <Icon name="paw" size={30} color="#fff" />
                <Text style={styles.cardText}>Pacientes</Text>
              </Pressable>
              <Pressable style={[styles.quickActionCard, styles.quickActionBlue]} onPress={() => navigation.navigate('AgendaDelDia')}>
                <Icon name="calendar-alt" size={30} color="#fff" />
                <Text style={styles.cardText}>Agenda</Text>
              </Pressable>
              <Pressable style={[styles.quickActionCard, styles.quickActionPurple]} onPress={() => navigation.navigate('Mensajes')}>
                <Icon name="comments" size={30} color="#fff" />
                <Text style={styles.cardText}>Mensajes</Text>
              </Pressable>
              <Pressable style={[styles.quickActionCard, styles.quickActionYellow]} onPress={() => navigation.navigate('NuevaCita')}>
                <Icon name="plus" size={30} color="#fff" />
                <Text style={styles.cardText}>Nueva Cita</Text>
              </Pressable>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// TU HOJA DE ESTILOS ORIGINAL
const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#013847d3',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 10,
    marginTop: 10,
  },
  notificationsSection: {
    marginBottom: 20,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  // Añadido para el mapeo de estilos dinámicos
  iconContainer: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  notificationText: {
    marginLeft: 10,
    flex: 1,
  },
  notificationMessage: {
    fontWeight: '500',
    color: '#333',
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 12,
    marginTop: 20,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    padding: 10,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statYellow: {
    backgroundColor: '#F8B500',
  },
  statPurple: {
    backgroundColor: '#9C27B0',
  },
  statTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  statText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 5,
    textAlign: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    padding: 24,
    marginBottom: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  quickActionGreen: {
    backgroundColor: '#43C0AF',
  },
  quickActionBlue: {
    backgroundColor: '#2196F3',
  },
  quickActionPurple: {
    backgroundColor: '#9C27B0',
  },
  quickActionYellow: {
    backgroundColor: '#F8B500',
  },
  cardText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
});