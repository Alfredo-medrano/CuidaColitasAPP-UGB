import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../api/Supabase';

// Cache simple en memoria
const roleCache = {};

export const useAdminRole = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Obtener ID de rol por nombre
    const getRoleByName = useCallback(async (roleName) => {
        if (roleCache[roleName]) {
            return roleCache[roleName];
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error: roleError } = await supabase
                .from('roles')
                .select('id')
                .ilike('name', roleName)
                .single();

            if (roleError) throw roleError;

            roleCache[roleName] = data.id;
            return data.id;
        } catch (err) {
            console.error(`Error fetching role ${roleName}:`, err.message);
            setError(err.message);

            // Fallback a RPC si falla
            if (roleName === 'cliente') {
                try {
                    const { data: rpcData, error: rpcErr } = await supabase.rpc('get_cliente_role_id');
                    if (!rpcErr && rpcData) {
                        roleCache[roleName] = rpcData;
                        return rpcData;
                    }
                } catch (rpcError) {
                    console.error('RPC fallback failed:', rpcError);
                }
            }

            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtener múltiples roles de una vez
    const getRoles = useCallback(async (roleNames) => {
        const uncached = roleNames.filter(name => !roleCache[name]);

        if (uncached.length > 0) {
            try {
                setLoading(true);
                setError(null);

                const { data, error: rolesError } = await supabase
                    .from('roles')
                    .select('id, name')
                    .in('name', uncached);

                if (rolesError) throw rolesError;

                data.forEach(role => {
                    roleCache[role.name] = role.id;
                });
            } catch (err) {
                console.error('Error fetching multiple roles:', err.message);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        return roleNames.reduce((acc, name) => {
            acc[name] = roleCache[name] || null;
            return acc;
        }, {});
    }, []);

    // Helpers específicos
    const getVetRoleId = useCallback(() => getRoleByName('veterinario'), [getRoleByName]);
    const getClientRoleId = useCallback(() => getRoleByName('cliente'), [getRoleByName]);
    const getAdminRoleId = useCallback(() => getRoleByName('admin'), [getRoleByName]);

    return {
        getRoleByName,
        getRoles,
        getVetRoleId,
        getClientRoleId,
        getAdminRoleId,
        loading,
        error,
    };
};
