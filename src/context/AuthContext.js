import React from 'react';
import { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../api/Supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const getInitialSession = async () => {
      const { data: { session: initialSession } } = await supabase.auth.getSession();
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession?.user) {
        // --- CAMBIO CLAVE AQUÍ ---
        // Pedimos todos los datos del perfil y el nombre del rol asociado
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('*, roles(name)') // Ahora pedimos el nombre del rol
          .eq('id', initialSession.user.id)
          .single();
        setProfile(userProfile);
      }
      setLoading(false);
    };
    
    getInitialSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          // --- CAMBIO CLAVE AQUÍ ---
          // Hacemos lo mismo cuando hay un nuevo inicio de sesión
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('*, roles(name)') // Ahora pedimos el nombre del rol
            .eq('id', newSession.user.id)
            .single();
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const value = {
    session,
    user,
    profile,
    loading,
    signOut: () => supabase.auth.signOut(),
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};