import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../api/Supabase';
import { Alert } from 'react-native';

export const useSystemSettings = () => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState(null);

    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('system_settings')
                .select('*');

            if (fetchError) throw fetchError;

            // Convertir array a objeto para fácil acceso: { 'allow_registrations': true, ... }
            const settingsMap = {};
            data.forEach(item => {
                settingsMap[item.key] = item.value;
            });

            setSettings(settingsMap);
        } catch (err) {
            console.error('Error fetching settings:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateSetting = useCallback(async (key, newValue, label) => {
        try {
            setUpdating(true);

            // Optimistic update
            setSettings(prev => ({ ...prev, [key]: newValue }));

            const { error: updateError } = await supabase
                .from('system_settings')
                .update({ value: newValue, updated_at: new Date() })
                .eq('key', key);

            if (updateError) {
                // Revertir si falla
                setSettings(prev => ({ ...prev, [key]: !newValue }));
                throw updateError;
            }

            // Opcional: Mostrar feedback sutil o nada
            // Alert.alert('Éxito', `${label || key} actualizado correctamente`);

        } catch (err) {
            console.error(`Error updating setting ${key}:`, err.message);
            Alert.alert('Error', `No se pudo actualizar ${label || key}`);
        } finally {
            setUpdating(false);
        }
    }, []);

    // Cargar al montar
    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    return {
        settings,
        loading,
        updating,
        error,
        fetchSettings,
        updateSetting
    };
};
