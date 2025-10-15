import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../api/Supabase';

export function useNotifications() {
  const [allNotifications, setAllNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado.");

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

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

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return { 
    allNotifications, 
    unreadNotifications, 
    unreadCount, 
    loading, 
    refresh: fetchNotifications, 
    markAllAsRead 
  };
}