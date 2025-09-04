import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { supabase } from '../../../Supabase';
import Navbar from './../../components/Navbar'; // Asegúrate que esta ruta es correcta
import { useIsFocused } from '@react-navigation/native'; // <-- Añadir useIsFocused

export default function VeterinarioHome({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ appointments: 0, messages: 0 });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused(); // Hook para saber si la pantalla está visible

  useEffect(() => {
    // Se ejecutará cada vez que la pantalla se muestre
    if (isFocused) {
      const fetchDashboardData = async () => {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (!authUser) throw new Error("Usuario no encontrado");

          // 1. CORRECCIÓN: Obtenemos también el 'title' para el Navbar
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select(`name, title`)
            .eq('id', authUser.id)
            .single();
          if (profileError) throw profileError;
          setProfile(profileData);

          // (El resto de tu lógica para citas y mensajes se queda igual)
          const { count: appointmentCount } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('veterinarian_id', authUser.id)
            .eq('status', 'pendiente');
          
          const { count: messageCount } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', authUser.id);
          
          setStats({ appointments: appointmentCount || 0, messages: messageCount || 0 });

        } catch (error) {
          console.error('Error al cargar datos del dashboard:', error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchDashboardData();
    }
  }, [isFocused]); // El efecto se ejecuta cuando la pantalla gana foco

  const handleNotifications = () => {
    // Aquí puedes navegar a una pantalla de notificaciones
    console.log('Botón de notificaciones presionado');
  };

  if (loading) {
    // ... tu JSX de carga
  }

  return (
    <View style={styles.appContainer}>
      {/* 2. CORRECCIÓN: Pasamos todas las props necesarias al Navbar */}
      <Navbar 
        userName={profile?.name || 'Cargando...'}
        userTitle={profile?.title || 'Veterinario'}
        onProfileClick={() => navigation.navigate('Profile')}
        onNotificationsClick={handleNotifications}
      />
      
     
      <ScrollView style={styles.content}>
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
          <Text style={styles.sectionTitle}>Notificaciones</Text>
          {notifications.map(notification => (
            <View key={notification.id} style={styles.notificationCard}>
              <Icon
                name={notification.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}
                size={20}
                color={notification.type === 'warning' ? '#FF9800' : '#2196F3'}
              />
              <View style={styles.notificationText}>
                <Text style={styles.notificationMessage}>{notification.message}</Text>
                <Text style={styles.notificationTime}>{notification.time}</Text>
              </View>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <View style={styles.quickActions}>
          <Pressable style={[styles.quickActionCard, styles.quickActionGreen]} onPress={() => navigation.navigate('MisPacientes')}>
            <Icon name="user-md" size={30} color="#fff" />
            <Text style={styles.cardText}>Ver Pacientes</Text>
          </Pressable>
          <Pressable style={[styles.quickActionCard, styles.quickActionBlue]} onPress={() => navigation.navigate('AgendaDelDia')}>
            <Icon name="calendar-alt" size={30} color="#fff" />
            <Text style={styles.cardText}>Agenda del Día</Text>
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
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#013847d3',
  },
  content: {
    marginTop: 60,  
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
    marginBottom: 20,
    gap: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
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