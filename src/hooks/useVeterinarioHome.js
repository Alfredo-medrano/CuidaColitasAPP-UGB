import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../api/Supabase';
import { Alert } from 'react-native';

export function useVeterinarioHome() {
    const [profile, setProfile] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchHomeData = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // obtener datos del perfil
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('name, avatar_url')
                .eq('id', user.id)
                .single();

            if (profileError) throw profileError;
            setProfile(profileData);

            // obtener notificaciones recientes
            const { data: notifData, error: notifError } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(4); 

            if (notifError) throw notifError;
            setNotifications(notifData || []);

        } catch (error) {
            console.error("Error al cargar la Home del Veterinario:", error.message);
            Alert.alert("Error", "No se pudieron cargar los datos de bienvenida.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchHomeData();
    }, [fetchHomeData]);

    return {
        profile,
        notifications,
        loading,
        refetch: fetchHomeData,
        unreadCount: (notifications || []).filter(n => !n.is_read).length,
    };
}