// context/AuthContext.js
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../api/Supabase';

const AuthContext = createContext();
const BUCKET_ID = 'attachments';

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null); // ✅ URL firmada para <Image/>
  const [loading, setLoading] = useState(true);

  // ------- Cargar perfil desde BD -------
  const loadProfile = useCallback(async (uid) => {
    if (!uid) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*, roles(name)')
      .eq('id', uid)
      .single();
    if (!error) setProfile(data || null);
    return data || null;
  }, []);

  // ------- Firmar URL del avatar -------
  const refreshAvatarUrl = useCallback(
    async (path, updatedAt) => {
      if (!path) {
        setAvatarUrl(null);
        return;
      }
      const { data, error } = await supabase
        .storage.from(BUCKET_ID)
        .createSignedUrl(path, 60 * 15); // 15 min
      if (!error && data?.signedUrl) {
        // cache-buster: evita que quede la imagen anterior en caché
        const cb = updatedAt ? new Date(updatedAt).getTime() : Date.now();
        setAvatarUrl(`${data.signedUrl}&cb=${cb}`);
      }
    },
    []
  );

  // ------- Sesión inicial -------
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        const p = await loadProfile(initialSession.user.id);
        await refreshAvatarUrl(p?.avatar_url || null, p?.updated_at);
      }
      setLoading(false);
    })();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_evt, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        const p = await loadProfile(newSession.user.id);
        await refreshAvatarUrl(p?.avatar_url || null, p?.updated_at);
      } else {
        setProfile(null);
        setAvatarUrl(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, [loadProfile, refreshAvatarUrl]);

  // ------- Realtime: refrescar si el perfil cambia en BD -------
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('profiles_realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, async (payload) => {
        // Recarga y vuelve a firmar la imagen
        const p = await loadProfile(user.id);
        await refreshAvatarUrl(p?.avatar_url || null, p?.updated_at);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, loadProfile, refreshAvatarUrl]);

  // ------- API pública para pantallas -------
  const refetchProfile = useCallback(async () => {
    if (!user?.id) return;
    const p = await loadProfile(user.id);
    await refreshAvatarUrl(p?.avatar_url || null, p?.updated_at);
  }, [user?.id, loadProfile, refreshAvatarUrl]);

  // ------- Maintenance Mode Check -------
  const [isMaintenance, setIsMaintenance] = useState(false);

  useEffect(() => {
    const checkMaintenance = async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'maintenance_mode')
        .single();

      if (!error && data?.value) {
        setIsMaintenance(true);
      } else {
        setIsMaintenance(false);
      }
    };

    checkMaintenance();

    // Realtime listener for settings
    const channel = supabase
      .channel('settings_realtime')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'system_settings',
        filter: "key=eq.maintenance_mode",
      }, (payload) => {
        setIsMaintenance(payload.new.value);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const value = {
    session,
    user,
    profile,
    avatarUrl,     // ✅ úsalo en Home y Perfil
    loading,
    isMaintenance, // ✅ Expose maintenance state
    refetchProfile, // ✅ llama esto tras guardar en EditProfile
    signOut: () => supabase.auth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
