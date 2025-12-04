import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../api/Supabase';

/**
 * Hook para manejar la lógica de notificaciones de un usuario.
 * Se encarga de la autenticación, la consulta de la API, el manejo del estado,
 * y suscripción en tiempo real para actualizaciones automáticas.
 */
export function useNotifications() {
  const [allNotifications, setAllNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // ✅ Referencia para el ID del usuario (para Realtime)
  const userIdRef = useRef(null);

  // Función para cargar notificaciones
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado.");

      // Guardar userId para Realtime
      userIdRef.current = user.id;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50); // ✅ OPTIMIZACIÓN: Limitar a las últimas 50 notificaciones

      if (error) throw error;

      const notificationsData = data || [];
      const unread = notificationsData.filter(n => !n.is_read);

      setAllNotifications(notificationsData);
      setUnreadNotifications(unread.slice(0, 3));
      setUnreadCount(unread.length);
    } catch (error) {
      console.error("Error al obtener notificaciones:", error.message);
      setAllNotifications([]);
      setUnreadNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Función para marcar todas las notificaciones como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || unreadCount === 0) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setUnreadCount(0);
      setUnreadNotifications([]);
      setAllNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error al marcar notificaciones como leídas:", error.message);
    }
  }, [unreadCount]);

  // Carga inicial de notificaciones
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ✅ REALTIME: Suscripción a nuevas notificaciones
  useEffect(() => {
    // Solo suscribirse si tenemos userId
    if (!userIdRef.current) return;

    const channel = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userIdRef.current}`
        },
        (payload) => {
          // ✅ Agregar nueva notificación sin refetch
          const newNotification = payload.new;
          setAllNotifications(prev => [newNotification, ...prev].slice(0, 50));

          if (!newNotification.is_read) {
            setUnreadNotifications(prev => [newNotification, ...prev].slice(0, 3));
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userIdRef.current}`
        },
        (payload) => {
          // Actualizar notificación existente
          const updatedNotification = payload.new;
          setAllNotifications(prev =>
            prev.map(n => n.id === updatedNotification.id ? updatedNotification : n)
          );

          // Recalcular no leídas
          setAllNotifications(prev => {
            const unread = prev.filter(n => !n.is_read);
            setUnreadNotifications(unread.slice(0, 3));
            setUnreadCount(unread.length);
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    allNotifications,
    unreadNotifications,
    unreadCount,
    loading,
    refresh: fetchNotifications,
    markAllAsRead
  };
}