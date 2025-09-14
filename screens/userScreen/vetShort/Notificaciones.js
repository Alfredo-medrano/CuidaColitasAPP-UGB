import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../../../Supabase';
import { useIsFocused } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { SafeAreaView } from 'react-native-safe-area-context';

// Objeto para mapear tipos de notificación a íconos y colores.
// Facilita añadir nuevos tipos en el futuro.
const notificationStyles = {
  vaccine_due: { icon: 'syringe', color: '#f8d7da', iconColor: '#721c24' },
  appointment_reminder: { icon: 'calendar-check', color: '#d1ecf1', iconColor: '#0c5460' },
  new_message: { icon: 'comment-dots', color: '#e2d9f3', iconColor: '#492c7c' },
  medical_checkup: { icon: 'heartbeat', color: '#fff3cd', iconColor: '#856404' },
  app_update: { icon: 'info-circle', color: '#d4d4d4', iconColor: '#383d41' },
};

export default function Notificaciones({ navigation }) {
  // --- Estados del Componente ---
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  // --- Carga de Datos ---
  useEffect(() => {
    // Se ejecuta cada vez que el usuario entra a esta pantalla
    if (isFocused) {
      const fetchNotifications = async () => {
        try {
          setLoading(true);
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error("Usuario no encontrado");

          const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;
          setNotifications(data || []);

        } catch (error) {
          Alert.alert("Error", "No se pudieron cargar las notificaciones.");
          console.error(error.message);
        } finally {
          setLoading(false);
        }
      };
      
      fetchNotifications();
    }
  }, [isFocused]);

  // --- Interacción del Usuario ---
  const handleNotificationPress = async (notification) => {
    // Si la notificación no está leída, la marca como leída
    if (!notification.is_read) {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);
      
      if (error) {
        console.error("Error al marcar como leída:", error);
      } else {
        // Actualiza el estado local para una respuesta visual inmediata
        setNotifications(currentNotifications =>
          currentNotifications.map(n =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
      }
    }
    
    // Futuro: Navegar a la pantalla correspondiente usando notification.link_id
    // ej. if (notification.link_id) navigation.navigate('DetalleCita', { id: notification.link_id });
    Alert.alert(notification.title, notification.content);
  };

  // --- Renderizado de Items de la Lista ---
  const renderItem = ({ item }) => {
    const styleInfo = notificationStyles[item.type] || notificationStyles['app_update'];
    const timeAgo = new Date(item.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

    return (
      <Pressable style={styles.card} onPress={() => handleNotificationPress(item)}>
        <View style={[styles.iconContainer, { backgroundColor: styleInfo.color }]}>
          <Icon name={styleInfo.icon} size={20} color={styleInfo.iconColor} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardText}>{item.content}</Text>
          <Text style={styles.cardTime}>{timeAgo}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </Pressable>
    );
  };

  // --- Renderizado del Componente Principal ---
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Icon name="arrow-left" size={20} color="#013847" /></Pressable>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={{width: 20}} />
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color="#013847" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<View style={styles.centered}><Text style={styles.emptyText}>No tienes notificaciones.</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

// --- Hoja de Estilos ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E2ECED' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: '#d1d1d1', backgroundColor: '#fff' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#013847' },
  list: { padding: 15 },
  emptyText: { textAlign: 'center', marginTop: 50, fontSize: 16, color: '#666' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  iconContainer: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardText: { fontSize: 14, color: '#555', marginTop: 2 },
  cardTime: { fontSize: 12, color: '#999', marginTop: 5 },
  unreadDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#28a745', marginLeft: 10 },
});