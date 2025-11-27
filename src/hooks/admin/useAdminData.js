import { useState, useCallback } from 'react';
import { supabase } from '../../api/Supabase';
import { useAdminRole } from './useAdminRole';

// Cache de datos con timestamp
const dataCache = {
    vets: { data: null, timestamp: null },
    clients: { data: null, timestamp: null },
    stats: { data: null, timestamp: null },
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const isCacheValid = (cacheEntry) => {
    if (!cacheEntry.data || !cacheEntry.timestamp) return false;
    return Date.now() - cacheEntry.timestamp < CACHE_DURATION;
};

export const useAdminData = () => {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const { getVetRoleId, getClientRoleId } = useAdminRole();

    // Fetch Veterinarios
    const fetchVets = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && isCacheValid(dataCache.vets)) {
            return dataCache.vets.data;
        }

        try {
            setLoading(true);
            setError(null);

            const vetRoleId = await getVetRoleId();
            if (!vetRoleId) throw new Error('No se pudo obtener el rol de veterinario');

            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role_id', vetRoleId)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            dataCache.vets = { data, timestamp: Date.now() };
            return data;
        } catch (err) {
            console.error('Error fetching vets:', err.message);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getVetRoleId]);

    // Fetch Clientes
    const fetchClients = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && isCacheValid(dataCache.clients)) {
            return dataCache.clients.data;
        }

        try {
            setLoading(true);
            setError(null);

            const clientRoleId = await getClientRoleId();
            if (!clientRoleId) throw new Error('No se pudo obtener el rol de cliente');

            const { data, error: fetchError } = await supabase
                .from('profiles')
                .select('*')
                .eq('role_id', clientRoleId)
                .order('created_at', { ascending: false });

            if (fetchError) throw fetchError;

            dataCache.clients = { data, timestamp: Date.now() };
            return data;
        } catch (err) {
            console.error('Error fetching clients:', err.message);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getClientRoleId]);

    // Fetch Estadísticas
    const fetchStats = useCallback(async (forceRefresh = false) => {
        if (!forceRefresh && isCacheValid(dataCache.stats)) {
            return dataCache.stats.data;
        }

        try {
            setLoading(true);
            setError(null);

            const vetRoleId = await getVetRoleId();
            const clientRoleId = await getClientRoleId();

            const [
                { count: vetsCount, error: e1 },
                { count: clientsCount, error: e2 },
                { count: petsCount, error: e3 },
                { count: appointmentsCount, error: e4 }
            ] = await Promise.all([
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role_id', vetRoleId),
                supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role_id', clientRoleId),
                supabase.from('pets').select('*', { count: 'exact', head: true }),
                supabase.from('appointments').select('*', { count: 'exact', head: true }),
            ]);

            if (e1 || e2 || e3 || e4) {
                throw new Error('Error fetching stats');
            }

            const stats = {
                vets: vetsCount || 0,
                clients: clientsCount || 0,
                pets: petsCount || 0,
                appointments: appointmentsCount || 0,
                totalUsers: (vetsCount || 0) + (clientsCount || 0),
            };

            dataCache.stats = { data: stats, timestamp: Date.now() };
            return stats;
        } catch (err) {
            console.error('Error fetching stats:', err.message);
            setError(err.message);
            return {
                vets: 0,
                clients: 0,
                pets: 0,
                appointments: 0,
                totalUsers: 0,
            };
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [getVetRoleId, getClientRoleId]);

    // Refresh con indicador visual
    const refreshVets = useCallback(() => {
        setRefreshing(true);
        return fetchVets(true);
    }, [fetchVets]);

    const refreshClients = useCallback(() => {
        setRefreshing(true);
        return fetchClients(true);
    }, [fetchClients]);

    const refreshStats = useCallback(() => {
        setRefreshing(true);
        return fetchStats(true);
    }, [fetchStats]);

    // Limpiar cache manualmente
    const clearCache = useCallback(() => {
        dataCache.vets = { data: null, timestamp: null };
        dataCache.clients = { data: null, timestamp: null };
        dataCache.stats = { data: null, timestamp: null };
    }, []);

    return {
        // Fetch functions
        fetchVets,
        fetchClients,
        fetchStats,

        // Refresh functions (force reload)
        refreshVets,
        refreshClients,
        refreshStats,

        // Clear cache
        clearCache,

        // States
        loading,
        refreshing,
        error,
    };
};
